import { NextRequest, NextResponse } from "next/server";
import { detectText } from "@/lib/detection/detector";
import { countWords } from "@/lib/utils";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "" &&
  !!process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY !== "";

export async function POST(req: NextRequest) {
  try {
    const { text, title } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const wordCount = countWords(text);
    if (wordCount > 5000) {
      return NextResponse.json({ error: "Text exceeds maximum word limit" }, { status: 500 });
    }

    const result = await detectText(text);

    // Save to Supabase if configured and user is authenticated
    if (SUPABASE_CONFIGURED) {
      try {
        const { createServerClient } = await import("@supabase/ssr");
        const { cookies } = await import("next/headers");
        const cookieStore = await cookies();

        const supabase = createServerClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
        );

        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          // Insert document
          const { data: doc } = await supabase
            .from("documents")
            .insert({
              user_id: user.id,
              title: title ?? text.slice(0, 60),
              content: text,
              word_count: wordCount,
            })
            .select("id")
            .single();

          // Insert result
          if (doc?.id) {
            await supabase.from("results").insert({
              document_id: doc.id,
              human_pct: result.human_pct,
              ai_pct: result.ai_pct,
              dialect: result.dialect,
              confidence: result.confidence,
              sentence_data: result.sentence_data,
              markers_found: result.markers_found,
            });
          }

          // Increment usage counter
          await supabase.rpc("increment_checks_used", { uid: user.id }).maybeSingle();
        }
      } catch (dbErr) {
        // Non-fatal — still return result even if DB save fails
        console.warn("DB save skipped:", dbErr);
      }
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Detection error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
