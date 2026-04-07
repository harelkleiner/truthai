import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { getHumanizeLimit, getWordLimit, normalizePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin";
import { countWords } from "@/lib/utils";

function isCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
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

    const { data: profile } = await supabase
      .from("users")
      .select("plan, humanizations_used_this_month, humanizations_reset_at")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Unable to load user profile" }, { status: 400 });
    }

    const plan = normalizePlan(profile.plan);
    const admin = isAdminEmail(user.email);
    const humanizeLimit = admin ? null : getHumanizeLimit(plan);

    if (humanizeLimit === 0) {
      return NextResponse.json(
        { error: "Humanization is not available on your plan", code: "plan_not_allowed" },
        { status: 403 }
      );
    }

    let humanizationsUsed = profile.humanizations_used_this_month ?? 0;
    if (!isCurrentMonth(profile.humanizations_reset_at)) {
      humanizationsUsed = 0;
      await supabase
        .from("users")
        .update({ humanizations_used_this_month: 0, humanizations_reset_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    if (humanizeLimit !== null && humanizationsUsed >= humanizeLimit) {
      return NextResponse.json(
        {
          error: "Monthly humanization limit reached",
          code: "plan_humanize_limit",
          used: humanizationsUsed,
          limit: humanizeLimit,
        },
        { status: 403 }
      );
    }

    const wordLimit = admin ? null : getWordLimit(plan);
    const wordCount = countWords(text);
    if (wordLimit !== null && wordCount > wordLimit) {
      return NextResponse.json(
        { error: `Text exceeds ${wordLimit} word limit for your plan`, code: "plan_word_limit" },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `أنت كاتب عربي بليغ ومتمكن من اللهجات الخليجية والإماراتية. مهمتك هي إعادة صياغة النص التالي بحيث يبدو طبيعياً تماماً وكأنه مكتوب بيد بشرية.

قواعد مهمة:
- حافظ على المعنى الأصلي بالكامل
- استخدم تعبيرات طبيعية وعامية خليجية حيثما يناسب السياق
- أضف تنوعاً في طول الجمل وبنيتها
- استخدم علامات ترقيم طبيعية (ليست مثالية جداً)
- أضف لمسات بشرية: تردد خفيف، أقواس جانبية، تعبيرات شخصية
- تجنب التكرار والبنية الموحدة التي تميز النصوص الآلية
- لا تضف مقدمات أو خاتمات — فقط أعد صياغة النص المعطى
- اكتب الناتج بالعربية فقط

النص:
${text}`,
        },
      ],
    });

    const humanizedText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Increment usage
    await supabase.rpc("increment_humanizations_used", { uid: user.id });

    return NextResponse.json({ humanized: humanizedText });
  } catch (err) {
    console.error("Humanize error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
