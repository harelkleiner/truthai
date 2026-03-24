import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

export const PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    amount: 4900,
    currency: "aed",
    name: "Pro",
  },
  business: {
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID ?? "",
    amount: 19900,
    currency: "aed",
    name: "Business",
  },
} as const;

export async function createCheckoutSession({
  userId,
  email,
  plan,
  successUrl,
  cancelUrl,
}: {
  userId: string;
  email: string;
  plan: "pro" | "business";
  successUrl: string;
  cancelUrl: string;
}) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: { userId, plan },
    currency: "aed",
  });
  return session;
}
