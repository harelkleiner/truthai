import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("webhook-signature") ?? "";

  let event;
  try {
    const headersRecord: Record<string, string> = {};
    req.headers.forEach((v, k) => { headersRecord[k] = v; });
    event = validateEvent(body, headersRecord, process.env.POLAR_WEBHOOK_SECRET!);
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  switch (event.type) {
    case "order.created": {
      const { metadata } = event.data as any;
      const userId = metadata?.userId;
      const plan = metadata?.plan;
      if (userId && plan) {
        await supabase.from("users").update({ plan }).eq("id", userId);
        await supabase.from("subscriptions").upsert({
          user_id: userId,
          stripe_subscription_id: (event.data as any).id,
          plan,
          status: "active",
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }
      break;
    }

    case "subscription.revoked":
    case "subscription.canceled": {
      const subId = (event.data as any).id;
      const { data: sub } = await supabase
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", subId)
        .single();
      if (sub) {
        await supabase.from("users").update({ plan: "free" }).eq("id", sub.user_id);
        await supabase.from("subscriptions")
          .update({ status: "canceled" })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
