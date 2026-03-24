import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function GET() {
  const key = process.env.ANTHROPIC_API_KEY;

  if (!key) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" });
  }

  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 10,
      messages: [{ role: "user", content: "hi" }],
    });
    return NextResponse.json({
      ok: true,
      keyPrefix: key.slice(0, 20) + "...",
      model: res.model,
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err?.message ?? String(err),
      keyPrefix: key.slice(0, 20) + "...",
    });
  }
}
