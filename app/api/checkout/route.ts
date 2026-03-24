import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PLANS } from "@/lib/polar";

export async function POST(req: NextRequest) {
  try {
    const { plan, email, userId } = await req.json();

    if (!plan || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { productId } = PLANS[plan as keyof typeof PLANS];

    const checkout = await createCheckoutSession({
      productId,
      customerEmail: email,
      successUrl: `${appUrl}/dashboard?upgraded=1`,
      metadata: { userId, plan },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
