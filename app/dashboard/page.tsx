"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, BarChart3, Zap, ArrowUpRight, Loader2 } from "lucide-react";
import { cn, toEasternArabic } from "@/lib/utils";
import { getMonthlyLimit, normalizePlan, type AppPlan } from "@/lib/plan";

type DashboardUser = {
  full_name: string | null;
  plan: AppPlan;
  checks_used_this_month: number;
};

type HistoryRow = {
  id: string;
  title: string;
  date: string;
  human_pct: number;
  ai_pct: number;
  dialect: string;
};

const DIALECT_LABELS: Record<string, Record<string, string>> = {
  ar: { emirati: "إماراتية", gulf: "خليجية", msa: "فصحى", mixed: "مختلطة", other: "غير محددة" },
  en: { emirati: "Emirati", gulf: "Gulf", msa: "MSA", mixed: "Mixed", other: "Other" },
};

export default function DashboardPage() {
  const { t, locale, dir } = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [totalAnalyses, setTotalAnalyses] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const { createClient } = await import("@/lib/supabase");
        const sb = createClient();

        const { data: { user: authUser } } = await sb.auth.getUser();
        if (!authUser) {
          router.replace("/login");
          return;
        }

        const meRes = await fetch("/api/me");
        if (meRes.ok) {
          const me = await meRes.json();
          setIsAdmin(!!me.is_admin);
        }

        const { data: profile, error: profileError } = await sb
          .from("users")
          .select("full_name, plan, checks_used_this_month, checks_reset_at")
          .eq("id", authUser.id)
          .single();

        if (profileError || !profile) {
          setError(locale === "ar" ? "تعذر تحميل بيانات الحساب" : "Could not load account data");
          return;
        }

        const checksResetAt = profile.checks_reset_at ? new Date(profile.checks_reset_at) : null;
        const now = new Date();
        const sameMonth =
          !!checksResetAt &&
          checksResetAt.getUTCFullYear() === now.getUTCFullYear() &&
          checksResetAt.getUTCMonth() === now.getUTCMonth();

        const normalizedPlan = normalizePlan(profile.plan);
        setUser({
          full_name: profile.full_name,
          plan: normalizedPlan,
          checks_used_this_month: sameMonth ? profile.checks_used_this_month ?? 0 : 0,
        });

        const { data: docs } = await sb
          .from("documents")
          .select("id, title, created_at, results(human_pct, ai_pct, dialect)")
          .eq("user_id", authUser.id)
          .order("created_at", { ascending: false })
          .limit(20);

        const { count } = await sb
          .from("documents")
          .select("id", { count: "exact", head: true })
          .eq("user_id", authUser.id);
        setTotalAnalyses(count ?? 0);

        const parsed: HistoryRow[] = (docs ?? []).map((doc: any) => {
          const result = Array.isArray(doc.results) ? doc.results[0] : doc.results;
          return {
            id: doc.id,
            title: doc.title ?? "Untitled",
            date: String(doc.created_at ?? "").slice(0, 10),
            human_pct: result?.human_pct ?? 0,
            ai_pct: result?.ai_pct ?? 0,
            dialect: result?.dialect ?? "other",
          };
        });
        setHistory(parsed);
      } catch {
        setError(locale === "ar" ? "حدث خطأ أثناء تحميل البيانات" : "Failed to load your dashboard");
      } finally {
        setLoading(false);
      }
    })();
  }, [locale, router]);

  const checksLimit = user ? (isAdmin ? null : getMonthlyLimit(user.plan)) : null;
  const checksUsed = user?.checks_used_this_month ?? 0;
  const usagePct = checksLimit ? Math.min((checksUsed / checksLimit) * 100, 100) : 0;
  const checksRemaining = checksLimit === null ? null : Math.max(checksLimit - checksUsed, 0);
  const displayName = user?.full_name || (locale === "ar" ? "مستخدم" : "User");

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {loading && (
            <Card className="mb-8">
              <CardContent className="py-10 flex justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="mb-8 border-red-100">
              <CardContent className="py-4 text-sm text-red-700">{error}</CardContent>
            </Card>
          )}

          {!loading && !error && user && (
            <>
          {/* Header */}
          <div className={cn("mb-8 flex items-start justify-between gap-4 flex-wrap", dir === "rtl" ? "flex-row-reverse" : "")}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
              <p className="text-gray-500">{t.dashboard.welcome}, {displayName}</p>
            </div>
            <Link href="/analyze">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t.analyze.title}
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {/* Plan */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                    <Zap className="h-5 w-5 text-teal-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t.dashboard.plan}</p>
                    <p className="font-semibold capitalize text-gray-900">{user.plan}</p>
                  </div>
                </div>
                {user.plan === "free" && !isAdmin && (
                  <Link href="/#pricing">
                    <Button variant="outline" size="sm" className="mt-3 w-full gap-1 text-xs">
                      {t.dashboard.upgrade} <ArrowUpRight className="h-3 w-3" />
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Usage */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                    <FileText className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t.dashboard.usage}</p>
                    <p className="font-semibold text-gray-900">
                      {checksLimit === null
                        ? t.dashboard.unlimited
                        : locale === "ar"
                          ? `${toEasternArabic(String(checksUsed))} / ${toEasternArabic(String(checksLimit))}`
                          : `${checksUsed} / ${checksLimit}`}
                      {" "}{t.dashboard.documents_analyzed}
                    </p>
                  </div>
                </div>
                {checksLimit !== null && (
                  <Progress value={usagePct} indicatorClassName={usagePct >= 100 ? "bg-red-500" : undefined} />
                )}
                <p className="mt-1.5 text-xs text-gray-400">
                  {checksLimit !== null
                    ? `${locale === "ar" ? toEasternArabic(String(checksRemaining ?? 0)) : checksRemaining ?? 0} ${t.dashboard.checks_remaining}`
                    : t.dashboard.unlimited}
                </p>
              </CardContent>
            </Card>

            {/* Total analyses */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{locale === "ar" ? "إجمالي التحليلات" : "Total Analyses"}</p>
                    <p className="font-semibold text-gray-900">
                      {locale === "ar" ? toEasternArabic(String(totalAnalyses)) : totalAnalyses}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.history}</CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="py-12 text-center text-gray-400">
                  <FileText className="mx-auto mb-3 h-10 w-10 opacity-30" />
                  <p>{t.dashboard.no_history}</p>
                  <Link href="/analyze">
                    <Button variant="outline" size="sm" className="mt-4">{t.analyze.submit}</Button>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className={cn("pb-3 text-xs font-medium text-gray-400", dir === "rtl" ? "text-right" : "text-left")}>{locale === "ar" ? "الوثيقة" : "Document"}</th>
                        <th className={cn("pb-3 text-xs font-medium text-gray-400", dir === "rtl" ? "text-right" : "text-left")}>{t.dashboard.date}</th>
                        <th className={cn("pb-3 text-xs font-medium text-gray-400", dir === "rtl" ? "text-right" : "text-left")}>{t.dashboard.score}</th>
                        <th className={cn("pb-3 text-xs font-medium text-gray-400", dir === "rtl" ? "text-right" : "text-left")}>{t.dashboard.dialect}</th>
                        <th className="pb-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((doc) => (
                        <tr key={doc.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                          <td className="py-3 font-medium text-gray-800">{doc.title}</td>
                          <td className="py-3 text-gray-500">{doc.date}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-medium">
                                {locale === "ar" ? toEasternArabic(doc.human_pct) : doc.human_pct}%
                              </span>
                              <span className="text-gray-300">/</span>
                              <span className="text-red-500">
                                {locale === "ar" ? toEasternArabic(doc.ai_pct) : doc.ai_pct}%
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <Badge variant={doc.dialect === "emirati" ? "default" : doc.dialect === "msa" ? "success" : "secondary"} className="text-xs">
                              {DIALECT_LABELS[locale][doc.dialect]}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Link href={`/results/${doc.id}`}>
                              <Button variant="ghost" size="sm" className="text-xs">{t.dashboard.view}</Button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
