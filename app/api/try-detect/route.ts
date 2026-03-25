import { NextRequest, NextResponse } from "next/server";
import { detectText } from "@/lib/detection/detector";
import { countWords } from "@/lib/utils";

const TRY_WORD_LIMIT = 500;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const wordCount = countWords(text);
    if (wordCount > TRY_WORD_LIMIT) {
      return NextResponse.json(
        { error: `Trial is limited to ${TRY_WORD_LIMIT} words` },
        { status: 400 }
      );
    }

    const result = await detectText(text);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Try detect error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
