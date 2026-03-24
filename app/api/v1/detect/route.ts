// Public API v1 — Pro+ users only
// POST /api/v1/detect  Authorization: Bearer <api_key>
import { NextRequest, NextResponse } from "next/server";
import { detectText } from "@/lib/detection/detector";
import { countWords } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
  }

  // TODO: validate API key against supabase api_keys table
  // const apiKey = authHeader.slice(7);
  // const { data: keyRow } = await supabase.from("api_keys").select("user_id").eq("key_hash", hash(apiKey)).single();
  // if (!keyRow) return NextResponse.json({ error: "Invalid API key" }, { status: 401 });

  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "text field is required" }, { status: 400 });
    }

    const wordCount = countWords(text);
    if (wordCount > 5000) {
      return NextResponse.json({ error: "Text exceeds 5000 word limit" }, { status: 400 });
    }

    const result = await detectText(text);

    return NextResponse.json({
      ok: true,
      data: {
        human_pct: result.human_pct,
        ai_pct: result.ai_pct,
        dialect: result.dialect,
        confidence: result.confidence,
        word_count: wordCount,
        sentence_breakdown: result.sentence_data,
        markers_found: result.markers_found,
      },
    });
  } catch (err) {
    console.error("API v1 detect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
