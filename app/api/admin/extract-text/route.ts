import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import mammoth from "mammoth";
import { isAdminEmail } from "@/lib/admin";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

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

async function parsePdf(buffer: Buffer): Promise<string> {
  // Dynamic import keeps pdf-parse out of the webpack bundle (serverExternalPackages)
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return result.text ?? "";
  } finally {
    try { await parser.destroy(); } catch { /* ignore */ }
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 15 MB size limit" }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const mime = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (mime === "text/plain" || lowerName.endsWith(".txt")) {
      return NextResponse.json({ text: buffer.toString("utf-8") });
    }

    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return NextResponse.json({ text: result.value ?? "" });
    }

    if (mime === "application/pdf" || lowerName.endsWith(".pdf")) {
      const text = await parsePdf(buffer);
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "Unsupported file type. Use PDF, DOCX, or TXT." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin extract text error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to extract text from file" },
      { status: 500 }
    );
  }
}
