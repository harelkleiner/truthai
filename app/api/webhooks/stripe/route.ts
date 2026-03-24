import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Stripe webhook signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const { userId, plan } = session.metadata ?? {};
      if (!userId || !plan) break;

      // Update user plan
      await supabase.from("users").update({ plan, stripe_customer_id: session.customer as string }).eq("id", userId);

      // Upsert subscription
      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status,
        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const isActive = subscription.status === "active";

      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (!isActive) {
        // Downgrade to free
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();
        if (sub) {
          await supabase.from("users").update({ plan: "free" }).eq("id", sub.user_id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
