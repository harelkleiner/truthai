import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" });
  }

  try {
    const client = new Anthropic({ apiKey: key });

    // Test with a small JSON detection request similar to detectText
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: 'OUTPUT: valid JSON only, no extra text.\n{"final_human_percentage":0,"final_ai_percentage":0,"dialect":"غير محددة","confidence":"low","macro_signals":{"narrative_arc":"mixed","energy_curve":"varied","register_consistency":"shifting","knowledge_depth":"uneven","repetition_pattern":"human-like"},"red_flags":[],"green_flags":[],"sentence_analysis":[],"summary":""}',
      messages: [{ role: "user", content: "مرحبا" }],
    });

    const rawText = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const cleaned = rawText.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    let parsed = null;
    let parseError = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e: any) {
      parseError = e.message;
    }

    return NextResponse.json({
      ok: true,
      keyPrefix: key.slice(0, 20) + "...",
      model: res.model,
      rawText,
      cleaned,
      parsed,
      parseError,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message ?? String(err),
      keyPrefix: key.slice(0, 20) + "...",
    });
  }
}
