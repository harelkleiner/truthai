import { NextResponse } from "next/server";
import mammoth from "mammoth";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getUploadLimit, normalizePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function isCurrentMonth(isoDate: string | null): boolean {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
}

export async function POST(req: Request) {
  try {
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
      .select("plan, uploads_used_this_month, uploads_reset_at")
      .eq("id", user.id)
      .single();
    if (profileError || !profile) {
      return NextResponse.json({ error: "Unable to load user profile" }, { status: 400 });
    }

    const isAdmin = isAdminEmail(user.email);
    const plan = normalizePlan(profile.plan);
    const uploadLimit = isAdmin ? null : getUploadLimit(plan);
    if (uploadLimit === 0) {
      return NextResponse.json(
        { error: "File upload is not available on your plan", code: "plan_file_upload_not_allowed" },
        { status: 403 }
      );
    }

    let uploadsUsed = profile.uploads_used_this_month ?? 0;
    if (!isCurrentMonth(profile.uploads_reset_at)) {
      uploadsUsed = 0;
      await supabase
        .from("users")
        .update({ uploads_used_this_month: 0, uploads_reset_at: new Date().toISOString() })
        .eq("id", user.id);
    }
    if (uploadLimit !== null && uploadsUsed >= uploadLimit) {
      return NextResponse.json(
        {
          error: "Monthly file upload limit reached for your plan",
          code: "plan_file_upload_limit",
          uploads_used: uploadsUsed,
          uploads_limit: uploadLimit,
        },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File size exceeds the limit." }, { status: 400 });
    }

    const lowerName = file.name.toLowerCase();
    const mime = file.type;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Plain text
    if (mime === "text/plain" || lowerName.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      await supabase.rpc("increment_uploads_used", { uid: user.id }).maybeSingle();
      return NextResponse.json({ text });
    }

    // DOCX
    if (
      mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".docx")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value ?? "";
      await supabase.rpc("increment_uploads_used", { uid: user.id }).maybeSingle();
      return NextResponse.json({ text });
    }

    // PDF
    if (mime === "application/pdf" || lowerName.endsWith(".pdf")) {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      let text = "";
      try {
        const result = await parser.getText();
        text = result.text ?? "";
      } finally {
        try { await parser.destroy(); } catch { /* ignore */ }
      }
      await supabase.rpc("increment_uploads_used", { uid: user.id }).maybeSingle();
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });
  } catch (err) {
    console.error("Extract text error:", err);
    return NextResponse.json({ error: "Failed to extract text from file" }, { status: 500 });
  }
}
