"use client";

import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { FileText, Plus, Key, Zap, ArrowUpRight } from "lucide-react";
import { cn, toEasternArabic } from "@/lib/utils";

// Mock data — replace with Supabase query
const MOCK_USER = {
  full_name: "أحمد الشمري",
  plan: "free" as "free" | "pro" | "business",
  checks_used: 2,
  checks_limit: 3,
};

const MOCK_HISTORY = [
  { id: "1", title: "مقال عن التقنية", date: "2026-03-18", human_pct: 78, ai_pct: 22, dialect: "emirati" },
  { id: "2", title: "تقرير أكاديمي", date: "2026-03-15", human_pct: 34, ai_pct: 66, dialect: "msa" },
];

const DIALECT_LABELS: Record<string, Record<string, string>> = {
  ar: { emirati: "إماراتية", gulf: "خليجية", msa: "فصحى", mixed: "مختلطة", other: "غير محددة" },
  en: { emirati: "Emirati", gulf: "Gulf", msa: "MSA", mixed: "Mixed", other: "Other" },
};

export default function DashboardPage() {
  const { t, locale, dir } = useLocale();
  const usagePct = (MOCK_USER.checks_used / MOCK_USER.checks_limit) * 100;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className={cn("mb-8 flex items-start justify-between gap-4 flex-wrap", dir === "rtl" ? "flex-row-reverse" : "")}>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t.dashboard.title}</h1>
              <p className="text-gray-500">{t.dashboard.welcome}, {MOCK_USER.full_name}</p>
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
                    <p className="font-semibold capitalize text-gray-900">{MOCK_USER.plan}</p>
                  </div>
                </div>
                {MOCK_USER.plan === "free" && (
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
                      {locale === "ar"
                        ? `${toEasternArabic(MOCK_USER.checks_used)} / ${toEasternArabic(MOCK_USER.checks_limit)}`
                        : `${MOCK_USER.checks_used} / ${MOCK_USER.checks_limit}`}
                      {" "}{t.dashboard.documents_analyzed}
                    </p>
                  </div>
                </div>
                <Progress value={usagePct} indicatorClassName={usagePct >= 100 ? "bg-red-500" : undefined} />
                <p className="mt-1.5 text-xs text-gray-400">
                  {MOCK_USER.plan === "free"
                    ? `${locale === "ar" ? toEasternArabic(MOCK_USER.checks_limit - MOCK_USER.checks_used) : MOCK_USER.checks_limit - MOCK_USER.checks_used} ${t.dashboard.checks_remaining}`
                    : t.dashboard.unlimited}
                </p>
              </CardContent>
            </Card>

            {/* API Keys */}
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Key className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">{t.dashboard.api_keys}</p>
                    {MOCK_USER.plan === "free" ? (
                      <Badge variant="secondary" className="mt-0.5 text-xs">Pro+</Badge>
                    ) : (
                      <p className="font-semibold text-gray-900">1 {locale === "ar" ? "مفتاح" : "key"}</p>
                    )}
                  </div>
                </div>
                {MOCK_USER.plan !== "free" && (
                  <Button variant="outline" size="sm" className="mt-3 w-full text-xs">
                    {locale === "ar" ? "إدارة المفاتيح" : "Manage Keys"}
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          {/* History */}
          <Card>
            <CardHeader>
              <CardTitle>{t.dashboard.history}</CardTitle>
            </CardHeader>
            <CardContent>
              {MOCK_HISTORY.length === 0 ? (
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
                      {MOCK_HISTORY.map((doc) => (
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
        </div>
      </main>
      <Footer />
    </div>
  );
}
