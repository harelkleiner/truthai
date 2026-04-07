import { NextRequest, NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const body = await req.text();

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

  // Use service role client — webhooks have no browser cookies, and we need to bypass RLS
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  switch (event.type) {
    case "order.created": {
      const { metadata, subscription } = event.data as any;
      const userId = metadata?.userId;
      const plan = metadata?.plan;
      if (!userId || !plan) break;

      const { error: planError } = await supabase
        .from("users")
        .update({ plan })
        .eq("id", userId);
      if (planError) console.error("Webhook: failed to update user plan", planError);

      const subId = subscription?.id ?? (event.data as any).id;
      const periodEnd = subscription?.current_period_end
        ? new Date(subscription.current_period_end).toISOString()
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const { error: subError } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subId,
        plan,
        status: "active",
        current_period_end: periodEnd,
        updated_at: new Date().toISOString(),
      });
      if (subError) console.error("Webhook: failed to upsert subscription", subError);
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
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
