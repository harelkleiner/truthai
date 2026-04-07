import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PLANS } from "@/lib/polar";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { plan, billing, email } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: "Missing plan" }, { status: 400 });
    }

    const planKey = billing === "annual" ? `${plan}_annual` : plan;
    if (!PLANS[planKey as keyof typeof PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const customerEmail = email || user.email;
    if (!customerEmail) {
      return NextResponse.json({ error: "Missing customer email" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const { productId } = PLANS[planKey as keyof typeof PLANS];
    if (!productId) {
      return NextResponse.json({ error: "Selected plan is not configured" }, { status: 400 });
    }

    const checkout = await createCheckoutSession({
      productId,
      customerEmail,
      successUrl: `${appUrl}/dashboard?upgraded=1`,
      metadata: { userId: user.id, plan },
    });

    return NextResponse.json({ url: checkout.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
