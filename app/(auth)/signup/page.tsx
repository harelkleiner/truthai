"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const SUPABASE_CONFIGURED =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_URL !== "";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const { t, dir } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planParam = searchParams.get("plan");
  const billingParam = searchParams.get("billing") ?? "monthly";
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!SUPABASE_CONFIGURED) {
      await new Promise((r) => setTimeout(r, 600));
      setLoading(false);
      setError(
        dir === "rtl"
          ? "Supabase غير مفعّل بعد — أضف NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY في ملف .env.local"
          : "Supabase not configured — add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
      );
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) throw authError;
      setSuccess(true);
      if (planParam) {
        const res = await fetch("/api/checkout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan: planParam, billing: billingParam }),
        });
        const data = await res.json();
        if (data.url) { window.location.href = data.url; return; }
      }
      setTimeout(() => router.push("/dashboard"), 1000);
    } catch (err: any) {
      setError(err?.message ?? t.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    if (!SUPABASE_CONFIGURED) {
      setError(dir === "rtl" ? "Supabase غير مفعّل بعد" : "Supabase not configured yet");
      return;
    }
    setError(null);
    const { createClient } = await import("@/lib/supabase");
    const supabase = createClient();
    const nextPath = planParam
      ? `/checkout-redirect?plan=${planParam}&billing=${billingParam}`
      : "/dashboard";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}` },
    });
    if (oauthError) {
      setError(oauthError.message ?? t.errors.generic);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 to-white px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-700">
              <span className="text-base font-bold text-white">T</span>
            </div>
            <span className="text-xl font-bold text-teal-800">TruthAI</span>
          </Link>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm">
          <h1 className={cn("mb-6 text-2xl font-bold text-gray-900", dir === "rtl" ? "text-right" : "text-center")}>
            {t.auth.signup_title}
          </h1>

          <Button variant="outline" className="mb-4 w-full gap-2" onClick={handleGoogle} type="button">
            <GoogleIcon />
            {t.auth.google}
          </Button>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">{t.auth.or}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "")}>
                {t.auth.full_name}
              </label>
              <input
                type="text" required value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "")}>
                {t.auth.email}
              </label>
              <input
                type="email" required value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className={cn("mb-1.5 block text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "")}>
                {t.auth.password}
              </label>
              <input
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className={cn("flex items-start gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-700", dir === "rtl" ? "flex-row-reverse text-right" : "")}>
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className={cn("flex items-center gap-2 rounded-lg bg-green-50 p-3 text-xs text-green-700", dir === "rtl" ? "flex-row-reverse" : "")}>
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{dir === "rtl" ? "تم إنشاء الحساب! جارٍ التحويل..." : "Account created! Redirecting..."}</span>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading || success}>
              {loading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : t.auth.signup_btn}
            </Button>
          </form>

          <p className={cn("mt-6 text-sm text-gray-500", dir === "rtl" ? "text-right" : "text-center")}>
            {t.auth.have_account}{" "}
            <Link href={planParam ? `/login?plan=${planParam}&billing=${billingParam}` : "/login"} className="font-medium text-teal-600 hover:underline">
              {t.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
