"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, AlertCircle, Copy, Check, Lock, Sparkles } from "lucide-react";
import { cn, countWords, toEasternArabic } from "@/lib/utils";
import { getHumanizeLimit } from "@/lib/plan";

export default function HumanizePage() {
  return (
    <Suspense>
      <HumanizeContent />
    </Suspense>
  );
}

function HumanizeContent() {
  const { t, locale, dir } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialText = searchParams.get("text") ?? "";

  const [text, setText] = useState(initialText);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userPlan, setUserPlan] = useState<"free" | "starter" | "pro" | "business">("free");
  const [humanizationsUsed, setHumanizationsUsed] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) { router.replace("/login"); return; }
        const data = await res.json();
        setUserPlan(data.plan ?? "free");
        const resetAt = data?.humanizations_reset_at ? new Date(data.humanizations_reset_at) : null;
        const now = new Date();
        const sameMonth = !!resetAt &&
          resetAt.getUTCFullYear() === now.getUTCFullYear() &&
          resetAt.getUTCMonth() === now.getUTCMonth();
        setHumanizationsUsed(sameMonth ? (data?.humanizations_used_this_month ?? 0) : 0);
      } catch { router.replace("/login"); }
      finally { setAuthLoading(false); }
    })();
  }, [router]);

  const humanizeLimit = getHumanizeLimit(userPlan);
  const canHumanize = humanizeLimit === null || humanizeLimit > 0;
  const remaining = humanizeLimit === null ? null : Math.max(humanizeLimit - humanizationsUsed, 0);

  async function handleHumanize() {
    if (!text.trim()) { setError(t.errors.empty_text); return; }
    if (!canHumanize) return;
    if (remaining !== null && remaining <= 0) {
      setError(locale === "ar" ? "وصلت للحد الشهري للأنسنة" : "Monthly humanization limit reached");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/humanize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.code === "auth_required") { router.push("/login"); return; }
        if (data?.code === "plan_not_allowed") { router.push("/#pricing"); return; }
        throw new Error(data?.error ?? "Humanization failed");
      }
      setResult(data.humanized);
      if (humanizeLimit !== null) setHumanizationsUsed((v) => v + 1);
    } catch (err: any) {
      setError(err?.message ?? t.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const wordCount = countWords(text);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-10 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className={cn("mb-1 flex items-center gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
            <Sparkles className="h-6 w-6 text-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t.humanize.title}</h1>
          </div>
          <p className={cn("mb-8 text-sm text-gray-500", dir === "rtl" ? "text-right" : "text-left")}>
            {canHumanize
              ? remaining === null
                ? t.dashboard.unlimited
                : locale === "ar"
                  ? `${toEasternArabic(String(remaining))} ${t.humanize.remaining}`
                  : `${remaining} ${t.humanize.remaining}`
              : t.humanize.upgrade_cta}
          </p>

          {authLoading && (
            <Card>
              <CardContent className="py-10 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              </CardContent>
            </Card>
          )}

          {!authLoading && !canHumanize && (
            <Card>
              <CardContent className="py-12 flex flex-col items-center gap-4">
                <Lock className="h-10 w-10 text-gray-300" />
                <p className="text-gray-600 font-medium">{t.humanize.upgrade_cta}</p>
                <Button onClick={() => router.push("/#pricing")}>{t.humanize.upgrade_btn}</Button>
              </CardContent>
            </Card>
          )}

          {!authLoading && canHumanize && !result && (
            <Card>
              <CardContent className="pt-6">
                <label className={cn("mb-2 block text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "text-left")}>
                  {t.humanize.paste_label}
                </label>
                <textarea
                  dir="rtl"
                  value={text}
                  onChange={(e) => { setText(e.target.value); setError(null); }}
                  placeholder={t.humanize.paste_placeholder}
                  rows={10}
                  className="w-full rounded-xl border border-gray-200 bg-white p-4 font-arabic text-base leading-relaxed resize-none text-right placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <div className={cn("mt-1.5 text-xs text-gray-400", dir === "rtl" ? "text-right" : "text-left")}>
                  {locale === "ar"
                    ? `${toEasternArabic(wordCount)} ${t.analyze.word_count}`
                    : `${wordCount} ${t.analyze.word_count}`}
                </div>

                {error && (
                  <div className={cn("mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700", dir === "rtl" ? "flex-row-reverse text-right" : "")}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className={cn("mt-4 flex gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
                  <Button size="lg" onClick={handleHumanize} disabled={loading || !text.trim()}>
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.humanize.humanizing}</>
                      : <><Sparkles className="h-4 w-4" /> {t.humanize.submit}</>}
                  </Button>
                  {text && (
                    <Button size="lg" variant="outline" onClick={() => { setText(""); setError(null); }}>
                      {t.analyze.clear}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {!authLoading && canHumanize && result && (
            <div className="space-y-5">
              <Card>
                <CardContent className="pt-6">
                  <div className={cn("mb-4 flex items-center justify-between", dir === "rtl" ? "flex-row-reverse" : "")}>
                    <h2 className="text-lg font-bold text-gray-900">{t.humanize.result_title}</h2>
                    <Button size="sm" variant="outline" onClick={handleCopy}>
                      {copied
                        ? <><Check className="h-3.5 w-3.5" /> {t.humanize.copied}</>
                        : <><Copy className="h-3.5 w-3.5" /> {t.humanize.copy}</>}
                    </Button>
                  </div>
                  <div dir="rtl" className="rounded-xl border border-teal-100 bg-teal-50 p-4 font-arabic text-base leading-relaxed text-gray-800 text-right whitespace-pre-wrap">
                    {result}
                  </div>
                </CardContent>
              </Card>

              <div className={cn("flex gap-3 pb-4", dir === "rtl" ? "flex-row-reverse" : "")}>
                <Button onClick={() => { setResult(null); }}>
                  <Sparkles className="h-4 w-4" /> {t.humanize.try_again}
                </Button>
                <Button variant="outline" onClick={() => { setResult(null); setText(""); }}>
                  {t.humanize.new_text}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
