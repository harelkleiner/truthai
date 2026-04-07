import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";
import { normalizePlan } from "@/lib/plan";

export async function GET() {
  try {
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("plan, checks_used_this_month, checks_reset_at, uploads_used_this_month, uploads_reset_at, humanizations_used_this_month, humanizations_reset_at, full_name")
      .eq("id", user.id)
      .single();

    return NextResponse.json({
      id: user.id,
      email: user.email ?? "",
      full_name: profile?.full_name ?? "",
      plan: normalizePlan(profile?.plan),
      checks_used_this_month: profile?.checks_used_this_month ?? 0,
      checks_reset_at: profile?.checks_reset_at ?? null,
      uploads_used_this_month: profile?.uploads_used_this_month ?? 0,
      uploads_reset_at: profile?.uploads_reset_at ?? null,
      humanizations_used_this_month: profile?.humanizations_used_this_month ?? 0,
      humanizations_reset_at: profile?.humanizations_reset_at ?? null,
      is_admin: isAdminEmail(user.email),
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
