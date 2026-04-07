"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { cn, toEasternArabic } from "@/lib/utils";
import type { SentenceResult } from "@/lib/detection/detector";

type ResultDetail = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  word_count: number;
  human_pct: number;
  ai_pct: number;
  dialect: "emirati" | "gulf" | "msa" | "mixed" | "other";
  confidence: "high" | "medium" | "low";
  sentence_data: SentenceResult[];
  markers_found: string[];
  summary: string;
  red_flags: string[];
  green_flags: string[];
};

const DIALECT_LABELS: Record<string, Record<ResultDetail["dialect"], string>> = {
  ar: { emirati: "إماراتية", gulf: "خليجية", msa: "فصحى", mixed: "مختلطة", other: "غير محددة" },
  en: { emirati: "Emirati", gulf: "Gulf", msa: "MSA", mixed: "Mixed", other: "Other" },
};

const CONFIDENCE_LABELS: Record<string, Record<ResultDetail["confidence"], string>> = {
  ar: { high: "عالية", medium: "متوسطة", low: "منخفضة" },
  en: { high: "High", medium: "Medium", low: "Low" },
};

export default function ResultDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { locale, dir, t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultDetail | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase");
        const sb = createClient();
        const { data: { user } } = await sb.auth.getUser();
        if (!user) {
          router.replace("/login");
          return;
        }

        const { data, error: rowError } = await sb
          .from("documents")
          .select("id, title, content, created_at, word_count, results(human_pct, ai_pct, dialect, confidence, sentence_data, markers_found, summary, red_flags, green_flags)")
          .eq("id", params.id)
          .eq("user_id", user.id)
          .single();

        if (rowError || !data) {
          setError(locale === "ar" ? "لم يتم العثور على النتيجة" : "Result not found");
          return;
        }

        const r = Array.isArray((data as any).results) ? (data as any).results[0] : (data as any).results;
        if (!r) {
          setError(locale === "ar" ? "النتيجة غير مكتملة" : "Result data is incomplete");
          return;
        }

        setResult({
          id: data.id,
          title: data.title,
          content: data.content,
          created_at: data.created_at,
          word_count: data.word_count,
          human_pct: r.human_pct ?? 0,
          ai_pct: r.ai_pct ?? 0,
          dialect: r.dialect ?? "other",
          confidence: r.confidence ?? "medium",
          sentence_data: r.sentence_data ?? [],
          markers_found: r.markers_found ?? [],
          summary: r.summary ?? "",
          red_flags: r.red_flags ?? [],
          green_flags: r.green_flags ?? [],
        });
      } catch {
        setError(locale === "ar" ? "تعذر تحميل النتيجة" : "Could not load result");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.id, locale, router]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className={cn("mb-6 flex items-center justify-between gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
            <h1 className="text-2xl font-bold text-gray-900">{t.results.title}</h1>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1.5">
                <ArrowLeft className={cn("h-4 w-4", dir === "rtl" ? "rotate-180" : "")} />
                {locale === "ar" ? "رجوع" : "Back"}
              </Button>
            </Link>
          </div>

          {loading && (
            <Card>
              <CardContent className="py-12 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              </CardContent>
            </Card>
          )}

          {!loading && error && (
            <Card className="border-red-100">
              <CardContent className="py-5 text-sm text-red-700">{error}</CardContent>
            </Card>
          )}

          {!loading && result && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className={cn(dir === "rtl" ? "text-right" : "text-left")}>{result.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn("mb-3 flex items-center gap-2 text-sm text-gray-500", dir === "rtl" ? "flex-row-reverse text-right" : "")}>
                    <span>{result.created_at.slice(0, 10)}</span>
                    <span>•</span>
                    <span>
                      {locale === "ar"
                        ? `${toEasternArabic(String(result.word_count))} ${t.analyze.word_count}`
                        : `${result.word_count} ${t.analyze.word_count}`}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Card className="sm:col-span-1">
                      <CardContent className="pt-5">
                        <p className="text-xs text-gray-400 mb-1">{t.results.human_score}</p>
                        <p className="text-xl font-bold text-green-600">{result.human_pct}%</p>
                      </CardContent>
                    </Card>
                    <Card className="sm:col-span-1">
                      <CardContent className="pt-5">
                        <p className="text-xs text-gray-400 mb-1">{t.results.ai_score}</p>
                        <p className="text-xl font-bold text-red-500">{result.ai_pct}%</p>
                      </CardContent>
                    </Card>
                    <Card className="sm:col-span-1">
                      <CardContent className="pt-5">
                        <p className="text-xs text-gray-400 mb-1">{t.dashboard.dialect}</p>
                        <Badge variant="secondary">{DIALECT_LABELS[locale][result.dialect]}</Badge>
                      </CardContent>
                    </Card>
                    <Card className="sm:col-span-1">
                      <CardContent className="pt-5">
                        <p className="text-xs text-gray-400 mb-1">{t.results.confidence}</p>
                        <Badge variant="default">{CONFIDENCE_LABELS[locale][result.confidence]}</Badge>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {result.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.results.summary_title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p dir={dir} className={cn("text-sm text-gray-700 leading-relaxed font-arabic", dir === "rtl" ? "text-right" : "text-left")}>
                      {result.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {(result.red_flags.length > 0 || result.green_flags.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-red-700">🚩 {t.results.red_flags_title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.red_flags.length === 0 ? (
                        <p className="text-sm text-gray-400">{locale === "ar" ? "لا يوجد" : "None"}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {result.red_flags.map((f, i) => (
                            <li key={i} className="text-sm text-gray-700">{f}</li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base text-green-700">✅ {t.results.green_flags_title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {result.green_flags.length === 0 ? (
                        <p className="text-sm text-gray-400">{locale === "ar" ? "لا يوجد" : "None"}</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {result.green_flags.map((f, i) => (
                            <li key={i} className="text-sm text-gray-700">{f}</li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {result.sentence_data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t.results.sentence_analysis}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {result.sentence_data.map((s, i) => (
                        <div key={i} className="rounded-lg border border-gray-100 bg-white p-3">
                          <div className="mb-1 text-xs text-gray-500">{s.label.toUpperCase()}</div>
                          <p className="text-sm text-gray-800 mb-1" dir="rtl">{s.sentence}</p>
                          {s.reason && <p className="text-xs text-gray-500">{s.reason}</p>}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{locale === "ar" ? "النص الأصلي" : "Original Text"}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p dir="rtl" className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-arabic">
                    {result.content}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
