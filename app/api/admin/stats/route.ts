import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isAdminEmail } from "@/lib/admin";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user || !isAdminEmail(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "Server not configured" }, { status: 500 });
    }

    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const [usersRes, analysesRes, paidRes, articlesRes] = await Promise.allSettled([
      adminClient.from("users").select("id", { count: "exact", head: true }),
      adminClient.from("analyses").select("id", { count: "exact", head: true }),
      adminClient.from("users").select("id", { count: "exact", head: true }).neq("plan", "free"),
      adminClient.from("articles").select("id", { count: "exact", head: true }),
    ]);
    const users    = usersRes.status    === "fulfilled" ? (usersRes.value.count    ?? 0) : 0;
    const analyses = analysesRes.status === "fulfilled" ? (analysesRes.value.count ?? 0) : 0;
    const paidUsers = paidRes.status    === "fulfilled" ? (paidRes.value.count     ?? 0) : 0;
    const articles  = articlesRes.status === "fulfilled" ? (articlesRes.value.count ?? 0) : 0;

    return NextResponse.json({ users, analyses, paid_users: paidUsers, articles });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
