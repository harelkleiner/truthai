import Anthropic from "@anthropic-ai/sdk";
import { detectDialect } from "./arabic-heuristics";

export type MacroSignals = {
  narrative_arc: "ai-like" | "mixed" | "human-like";
  energy_curve: "flat" | "varied";
  register_consistency: "consistent" | "shifting";
  knowledge_depth: "uniform" | "uneven";
  repetition_pattern: "ai-like" | "human-like";
};

export type SentenceResult = {
  sentence: string;
  label: "human" | "ai" | "mixed";
  reason: string;
};

export type DetectionResult = {
  human_pct: number;
  ai_pct: number;
  dialect: "emirati" | "gulf" | "msa" | "mixed" | "other";
  dialect_raw: string;
  confidence: "high" | "medium" | "low";
  macro_signals: MacroSignals;
  red_flags: string[];
  green_flags: string[];
  sentence_data: SentenceResult[];
  markers_found: string[];
  summary: string;
};

const DIALECT_MAP: Record<string, DetectionResult["dialect"]> = {
  "إماراتية": "emirati",
  "خليجية": "gulf",
  "فصحى": "msa",
  "مختلطة": "mixed",
  "غير محددة": "other",
};

const SYSTEM_PROMPT = `You are an expert Arabic AI-text detection engine.
Analyze the text in this EXACT internal order:

STEP 1 — READ THE FULL TEXT FIRST
Before analyzing anything, read the entire text
from start to finish. Do not score yet.
Note your gut feeling: does this feel human or AI?

STEP 2 — MACRO ANALYSIS (full text patterns)
Only after reading everything, analyze:

NARRATIVE ARC:
- AI: intro → points → conclusion (always)
- Human: jumps in mid-thought, abrupt ending

ENERGY CURVE:
- AI: perfectly consistent energy start to finish
- Human: loses steam, bursts of enthusiasm,
  starts casual then gets formal

REGISTER CONSISTENCY:
- AI: exact same formal/informal level throughout
- Human: unconsciously shifts register

KNOWLEDGE DEPTH:
- AI: uniform medium-depth on everything
- Human: deep in one area, vague in another

REPETITION:
- AI: repeats same idea in different words
  across paragraphs
- Human: repetition feels intentional

STEP 3 — PARAGRAPH ANALYSIS
For each paragraph, informed by the macro view:

TRANSITIONS:
- Human: يعني، بصراحة، المهم، بس خلاص
- AI: علاوة على ذلك، من ناحية أخرى، وفي الختام

TOPIC DRIFT:
- Human: natural slight drift off-topic
- AI: perfectly on-topic always

INTERNAL CONTRADICTION:
- Human: sometimes walks back what they said
- AI: never contradicts itself

STEP 4 — SENTENCE ANALYSIS
Only now, analyze individual sentences,
using macro + paragraph context as override:

PERPLEXITY:
- AI: most obvious/expected phrasing every time
- Human: surprising word choices, unusual turns

BURSTINESS:
- AI: consistent sentence length throughout
- Human: mixes short punchy with long complex

ARABIC NATURALNESS:
✓ Dialect mixing (عامية + فصحى)
✓ Spelling variants (ابي / أبي / ابى)
✓ Emirati: وايد، جذي، عيل، ماكو، يبيلك
✓ Informal: يعني، والله، بصراحة، المهم

━━━━━━━━━━━━━━━━━━━━━━━━━━
OVERRIDE RULES — APPLY IN THIS ORDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Macro always overrides sentence
2. Paragraph overrides sentence
3. Never let one robotic sentence
   override a human-feeling full text
4. Never let one dialect word override
   an AI-structured full text

WEIGHTS:
Macro (full text):  45%
Paragraph level:    30%
Sentence level:     25%

━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT: valid JSON only, no extra text.
{
  "final_human_percentage": 0-100,
  "final_ai_percentage": 0-100,
  "dialect": "إماراتية|خليجية|فصحى|مختلطة|غير محددة",
  "confidence": "high|medium|low",
  "macro_signals": {
    "narrative_arc": "ai-like|mixed|human-like",
    "energy_curve": "flat|varied",
    "register_consistency": "consistent|shifting",
    "knowledge_depth": "uniform|uneven",
    "repetition_pattern": "ai-like|human-like"
  },
  "red_flags": [],
  "green_flags": [],
  "sentence_analysis": [
    {
      "sentence": "...",
      "label": "human|ai|mixed",
      "reason": "one short explanation"
    }
  ],
  "summary": "2-3 sentences in same language as input"
}`;

export async function detectText(text: string): Promise<DetectionResult> {
  const { markers_found } = detectDialect(text);

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: text.slice(0, 6000) }],
    });

    const rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");

    const jsonStr = rawText
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    const r = JSON.parse(jsonStr);

    const dialectRaw: string = r.dialect ?? "غير محددة";
    const dialect: DetectionResult["dialect"] = DIALECT_MAP[dialectRaw] ?? "other";

    return {
      human_pct: r.final_human_percentage ?? 50,
      ai_pct: r.final_ai_percentage ?? 50,
      dialect,
      dialect_raw: dialectRaw,
      confidence: r.confidence ?? "medium",
      macro_signals: r.macro_signals ?? {
        narrative_arc: "mixed",
        energy_curve: "varied",
        register_consistency: "shifting",
        knowledge_depth: "uneven",
        repetition_pattern: "human-like",
      },
      red_flags: r.red_flags ?? [],
      green_flags: r.green_flags ?? [],
      sentence_data: (r.sentence_analysis ?? []).map((s: SentenceResult) => ({
        sentence: s.sentence,
        label: s.label,
        reason: s.reason,
      })),
      markers_found,
      summary: r.summary ?? "",
    };
  } catch (err) {
    console.error("Claude detection error:", err);

    // Heuristic fallback
    const { computeAIPatternScore, detectDialect: dd } = await import("./arabic-heuristics");
    const { dialect, confidence, markers_found: mf } = dd(text);
    const score = computeAIPatternScore(text);
    const ai_pct = Math.min(Math.max(Math.round(score * 100), 10), 90);

    return {
      human_pct: 100 - ai_pct,
      ai_pct,
      dialect,
      dialect_raw: dialect,
      confidence,
      macro_signals: {
        narrative_arc: "mixed",
        energy_curve: "varied",
        register_consistency: "shifting",
        knowledge_depth: "uneven",
        repetition_pattern: "human-like",
      },
      red_flags: [],
      green_flags: [],
      sentence_data: text
        .split(/(?<=[.!?؟])\s+/)
        .filter((s) => s.trim().length > 5)
        .map((s) => ({
          sentence: s.trim(),
          label: "mixed" as const,
          reason: "Heuristic fallback",
        })),
      markers_found: mf,
      summary: "",
    };
  }
}
