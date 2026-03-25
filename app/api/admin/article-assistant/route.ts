import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";
import { isAdminEmail } from "@/lib/admin";

type ChatMessage = { role: "user" | "assistant"; content: string };

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

function extractJson(raw: string): any {
  // Strip markdown code fences
  let text = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
  // Find outermost { ... } block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(start, end + 1);
  }
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 500 });
    }

    const body = await req.json();
    const title = String(body.title ?? "").trim();
    const editorBody = String(body.body ?? "").trim();
    const prompt = String(body.prompt ?? "").trim();
    const history = Array.isArray(body.history) ? (body.history as ChatMessage[]) : [];

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const recentHistory = history
      .slice(-6)
      .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
      .join("\n\n");

    const userMessage = [
      title ? `Current title:\n${title}` : null,
      editorBody ? `Current article body:\n${editorBody.slice(0, 6000)}` : null,
      recentHistory ? `Recent conversation:\n${recentHistory}` : null,
      `User request:\n${prompt}`,
    ]
      .filter(Boolean)
      .join("\n\n---\n\n");

    const res = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: [
        "You are an article editor assistant.",
        "Always respond with ONLY a valid JSON object — no preamble, no explanation outside the JSON.",
        'The JSON must have exactly these keys: "reply", "improved_title", "improved_body", "improved_excerpt".',
        '"reply": a short explanation of what you changed (1-3 sentences).',
        '"improved_title": the revised title (return the original if unchanged).',
        '"improved_body": the full revised article body (return the original if unchanged).',
        '"improved_excerpt": a 1-2 sentence summary suitable for a blog listing page.',
      ].join(" "),
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    let parsed: any;
    try {
      parsed = extractJson(rawText);
    } catch {
      // If JSON parsing completely fails, wrap the raw reply gracefully
      parsed = {
        reply: rawText.slice(0, 500),
        improved_title: title,
        improved_body: editorBody,
        improved_excerpt: "",
      };
    }

    return NextResponse.json({
      reply: String(parsed.reply ?? "Done."),
      improved_title: String(parsed.improved_title ?? title),
      improved_body: String(parsed.improved_body ?? editorBody),
      improved_excerpt: String(parsed.improved_excerpt ?? ""),
    });
  } catch (err: any) {
    console.error("Article assistant error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Internal server error" },
      { status: 500 }
    );
  }
}
