import { NextRequest, NextResponse } from "next/server";
import { detectText } from "@/lib/detection/detector";
import { countWords } from "@/lib/utils";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getMonthlyLimit, getWordLimit, normalizePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "" &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== "";

function isCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

export async function POST(req: NextRequest) {
  try {
    if (!SUPABASE_CONFIGURED) {
      return NextResponse.json({ error: "Supabase is not configured" }, { status: 500 });
    }

    const { text, title } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
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
      return NextResponse.json({ error: "Authentication required", code: "auth_required" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("plan, checks_used_this_month, checks_reset_at")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Unable to load user profile" }, { status: 400 });
    }

    const plan = normalizePlan(profile.plan);
    const isAdmin = isAdminEmail(user.email);
    const wordLimit = isAdmin ? null : getWordLimit(plan);
    const monthlyLimit = isAdmin ? null : getMonthlyLimit(plan);

    const wordCount = countWords(text);
    if (wordLimit !== null && wordCount > wordLimit) {
      return NextResponse.json(
        { error: `Text exceeds ${wordLimit} word limit for your plan`, code: "plan_word_limit" },
        { status: 400 }
      );
    }

    let checksUsed = profile.checks_used_this_month ?? 0;
    if (!isCurrentMonth(profile.checks_reset_at)) {
      checksUsed = 0;
      await supabase
        .from("users")
        .update({ checks_used_this_month: 0, checks_reset_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    if (monthlyLimit !== null && checksUsed >= monthlyLimit) {
      return NextResponse.json(
        {
          error: "Monthly checks limit reached for your plan",
          code: "plan_monthly_limit",
          checks_used: checksUsed,
          checks_limit: monthlyLimit,
        },
        { status: 403 }
      );
    }

    const result = await detectText(text);

    const { data: doc, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        title: title ?? text.slice(0, 60),
        content: text,
        word_count: wordCount,
      })
      .select("id")
      .single();

    if (docError || !doc) {
      console.warn("Document insert failed:", docError);
      return NextResponse.json({ error: "Could not save analysis" }, { status: 500 });
    }

    const { error: resultError } = await supabase.from("results").insert({
      document_id: doc.id,
      human_pct: result.human_pct,
      ai_pct: result.ai_pct,
      dialect: result.dialect,
      confidence: result.confidence,
      sentence_data: result.sentence_data,
      markers_found: result.markers_found,
    });
    if (resultError) {
      console.warn("Result insert failed:", resultError);
      return NextResponse.json({ error: "Could not save analysis result" }, { status: 500 });
    }

    const { error: usageError } = await supabase.rpc("increment_checks_used", { uid: user.id });
    if (usageError) {
      console.warn("Usage increment failed:", usageError);
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Detection error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
