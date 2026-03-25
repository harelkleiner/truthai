import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

async function requireAdmin() {
  const cookieStore = await cookies();
  const authClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await authClient.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const { id } = await params;
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from("articles")
      .select("id, title, slug, excerpt, content, cover_image_url, tags, published, created_at")
      .eq("id", id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Article not found" }, { status: 404 });
    return NextResponse.json({ article: data });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const { id } = await params;
    const body = await req.json();

    const patch: Record<string, unknown> = {};
    if (body.title !== undefined)    patch.title   = String(body.title).trim();
    if (body.excerpt !== undefined)  patch.excerpt = String(body.excerpt).trim();
    if (body.content !== undefined)  patch.content = String(body.content).trim();
    if (body.tags !== undefined)     patch.tags    = Array.isArray(body.tags) ? body.tags.map(String) : [];
    if (body.coverImageUrl !== undefined) patch.cover_image_url = String(body.coverImageUrl).trim() || null;
    if (body.published !== undefined) {
      patch.published = Boolean(body.published);
      patch.published_at = body.published ? new Date().toISOString() : null;
    }

    if (Object.keys(patch).length === 0)
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    const adminClient = getAdminClient();
    const { error } = await adminClient.from("articles").update(patch).eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to update article" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAdmin();
    if (!user) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });

    const { id } = await params;
    const adminClient = getAdminClient();
    const { error } = await adminClient.from("articles").delete().eq("id", id);
    if (error) return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
