"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Zap, ShieldCheck, Languages, ChevronRight, Check, X,
  MessageSquare, ClipboardPaste, BrainCircuit, BarChart3, Loader2,
  Lock, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { cn, toEasternArabic, countWords } from "@/lib/utils";
import type { DetectionResult, MacroSignals } from "@/lib/detection/detector";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

type PlanFeature = { text: string; included: boolean };
type PlanKey = "free" | "starter" | "pro" | "business";

/* ─── Score ring ─── */
function ScoreRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="110" height="110" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f0f0f0" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)", transition: "stroke-dashoffset 1.2s ease" }} />
        <text x="60" y="60" textAnchor="middle" dominantBaseline="central"
          fontSize="20" fontWeight="bold" fill={color}>{pct}%</text>
      </svg>
      <span className="text-sm font-medium text-gray-600 text-center">{label}</span>
    </div>
  );
}

/* ─── Dialect badge ─── */
function DialectBadge({ dialect, t }: { dialect: string; t: any }) {
  const map: Record<string, { label: string; variant: "default" | "gold" | "success" | "warning" | "secondary" }> = {
    emirati: { label: t.results.dialect_emirati, variant: "default" },
    gulf:    { label: t.results.dialect_gulf,    variant: "gold" },
    msa:     { label: t.results.dialect_msa,     variant: "success" },
    mixed:   { label: t.results.dialect_mixed,   variant: "warning" },
    other:   { label: t.results.dialect_other,   variant: "secondary" },
  };
  const item = map[dialect] ?? map.other;
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

/* ─── Confidence badge ─── */
function ConfidenceBadge({ confidence, t }: { confidence: string; t: any }) {
  const map: Record<string, { label: string; variant: "success" | "warning" | "danger" }> = {
    high:   { label: t.results.confidence_high,   variant: "success" },
    medium: { label: t.results.confidence_medium, variant: "warning" },
    low:    { label: t.results.confidence_low,    variant: "danger" },
  };
  const item = map[confidence] ?? map.medium;
  return <Badge variant={item.variant}>{t.results.confidence}: {item.label}</Badge>;
}

/* ─── Macro signal row ─── */
function MacroRow({ label, value, t }: { label: string; value: string; t: any }) {
  const isAi = value === "ai-like" || value === "flat" || value === "consistent" || value === "uniform";
  const isHuman = value === "human-like" || value === "varied" || value === "shifting" || value === "uneven";
  const labelMap: Record<string, string> = {
    "ai-like": t.results.ai_like, "human-like": t.results.human_like, "mixed": t.results.mixed,
    "flat": t.results.flat, "varied": t.results.varied, "consistent": t.results.consistent,
    "shifting": t.results.shifting, "uniform": t.results.uniform, "uneven": t.results.uneven,
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn(
        "text-xs font-semibold rounded-full px-2.5 py-0.5",
        isAi ? "bg-red-50 text-red-700" : isHuman ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
      )}>
        {labelMap[value] ?? value}
      </span>
    </div>
  );
}

/* ─── Sentence card ─── */
function SentenceCard({ s, t, dir }: { s: DetectionResult["sentence_data"][0]; t: any; dir: string }) {
  const [open, setOpen] = useState(false);
  const isAi = s.label === "ai";
  const isHuman = s.label === "human";
  return (
    <div className={cn(
      "rounded-lg border p-3 text-sm transition-colors",
      isAi ? "border-red-100 bg-red-50" : isHuman ? "border-green-100 bg-green-50" : "border-amber-100 bg-amber-50"
    )}>
      <div className="flex items-start gap-2">
        <span className={cn(
          "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
          isAi ? "bg-red-200 text-red-800" : isHuman ? "bg-green-200 text-green-800" : "bg-amber-200 text-amber-800"
        )}>
          {isAi ? t.results.sentence_ai : isHuman ? t.results.sentence_human : t.results.sentence_mixed}
        </span>
        <p dir="rtl" className="flex-1 font-arabic leading-relaxed text-gray-800">{s.sentence}</p>
        {s.reason && (
          <button onClick={() => setOpen(!open)} className="shrink-0 text-gray-400 hover:text-gray-600 mt-0.5">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        )}
      </div>
      {open && s.reason && (
        <p dir={dir === "rtl" ? "rtl" : "ltr"} className={cn(
          "mt-2 text-xs text-gray-500 border-t border-current border-opacity-20 pt-2 leading-relaxed",
          dir === "rtl" ? "text-right" : "text-left"
        )}>
          <span className="font-medium">{t.results.sentence_reason}: </span>{s.reason}
        </p>
      )}
    </div>
  );
}

/* ─── Pricing card ─── */
function PricingCard({
  name, description = "", price, annualPrice, features, cta, badge,
  highlighted = false, locale, plan, billing,
}: {
  name: string; description?: string; price: number; annualPrice: number;
  features: PlanFeature[]; cta: string; badge?: string;
  highlighted?: boolean; locale: string; plan: PlanKey; billing: "monthly" | "annual";
}) {
  const effective = billing === "annual" ? annualPrice : price;
  const originalPrice = billing === "annual" && annualPrice < price && price > 0 ? price : null;
  const displayNum = effective === 0
    ? (locale === "ar" ? "٠" : "0")
    : locale === "ar" ? toEasternArabic(String(effective)) : String(effective);

  async function handleClick() {
    if (plan === "free") { window.location.href = "/signup"; return; }
    if (plan === "business") { window.location.href = "/contact"; return; }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, billing }),
      });
      if (res.status === 401) {
        window.location.href = `/signup?plan=${plan}&billing=${billing}`;
        return;
      }
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else window.location.href = `/signup?plan=${plan}&billing=${billing}`;
    } catch { window.location.href = `/signup?plan=${plan}&billing=${billing}`; }
  }

  return (
    <div className={cn(
      "relative flex flex-col rounded-2xl border p-6 transition-shadow",
      highlighted
        ? "border-teal-600 bg-teal-700 text-white shadow-2xl ring-2 ring-teal-400 ring-offset-2 scale-[1.03] z-10"
        : "border-gray-200 bg-white shadow-sm hover:shadow-md",
    )}>
      {badge && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-1 text-xs font-bold text-white whitespace-nowrap shadow">
          {badge}
        </span>
      )}
      <div className="mb-5">
        <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", highlighted ? "text-teal-200" : "text-teal-600")}>
          {name}
        </p>
        {description && (
          <p className={cn("text-sm mb-4 leading-snug", highlighted ? "text-teal-100" : "text-gray-500")}>
            {description}
          </p>
        )}
        <div className="flex items-end gap-1.5">
          <span className={cn("text-sm font-medium mb-1", highlighted ? "text-teal-200" : "text-gray-400")}>$</span>
          <span className="text-4xl font-extrabold leading-none">{displayNum}</span>
          <div className="mb-0.5">
            {originalPrice && (
              <p className={cn("text-xs line-through leading-none", highlighted ? "text-teal-300" : "text-gray-400")}>
                ${originalPrice}
              </p>
            )}
            <p className={cn("text-xs", highlighted ? "text-teal-100" : "text-gray-400")}>
              / {locale === "ar" ? "شهر" : "mo"}
            </p>
          </div>
        </div>
        {billing === "annual" && annualPrice > 0 && (
          <p className={cn("text-xs mt-1.5", highlighted ? "text-teal-200" : "text-gray-400")}>
            {locale === "ar"
              ? `يُحسب سنوياً — $${toEasternArabic(String(annualPrice * 12))} / سنة`
              : `Billed annually — $${annualPrice * 12}/yr`}
          </p>
        )}
        {billing === "annual" && price > 0 && (
          <span className="mt-2 inline-block rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5">
            {locale === "ar" ? "وفّر ٢٠٪" : "Save 20%"}
          </span>
        )}
      </div>
      <div className={cn("mb-5 border-t", highlighted ? "border-teal-600" : "border-gray-100")} />
      <ul className="space-y-2.5 flex-1 mb-7">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2.5">
            {f.included ? (
              <Check className={cn("h-4 w-4 mt-0.5 shrink-0", highlighted ? "text-teal-300" : "text-teal-500")} />
            ) : (
              <X className={cn("h-4 w-4 mt-0.5 shrink-0", highlighted ? "text-teal-500" : "text-gray-300")} />
            )}
            <span className={cn(
              "text-sm leading-snug",
              f.included ? (highlighted ? "text-white" : "text-gray-700") : (highlighted ? "text-teal-400" : "text-gray-300"),
            )}>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
      <Button
        onClick={handleClick}
        className={cn("w-full font-semibold", highlighted ? "bg-white text-teal-700 hover:bg-teal-50" : "")}
        variant={highlighted ? "secondary" : "default"}
      >
        {cta}
      </Button>
    </div>
  );
}

/* ─── How it works step ─── */
function HowStep({ num, icon, title, desc }: { num: string; icon: React.ReactNode; title: string; desc: string; last?: boolean }) {
  return (
    <div className="flex gap-4 sm:flex-col sm:gap-3 sm:items-center sm:text-center">
      <div className="relative flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
          {icon}
        </div>
      </div>
      <div className="sm:pt-3">
        <p className="text-xs font-bold text-teal-600 mb-0.5">{num}</p>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

/* ─── Page ─── */
export default function HomePage() {
  const { t, locale, dir } = useLocale();
  const ar = locale === "ar";
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [tryText, setTryText] = useState("");
  const [tryLoading, setTryLoading] = useState(false);
  const [tryError, setTryError] = useState<string | null>(null);
  const [tryResult, setTryResult] = useState<DetectionResult | null>(null);

  const tryWordCount = countWords(tryText);
  const TRY_LIMIT = 500;
  const tryOverLimit = tryWordCount > TRY_LIMIT;

  const featureItems = [
    { icon: <MessageSquare className="h-6 w-6 text-teal-600" />, ...t.features.dialect },
    { icon: <Languages className="h-6 w-6 text-teal-600" />, ...t.features.codeswitching },
    { icon: <ShieldCheck className="h-6 w-6 text-teal-600" />, ...t.features.accuracy },
    { icon: <Zap className="h-6 w-6 text-teal-600" />, ...t.features.realtime },
  ];

  const hiw = t.how_it_works;
  const howSteps = [
    { num: hiw.step1_num, icon: <ClipboardPaste className="h-5 w-5" />, title: hiw.step1_title, desc: hiw.step1_desc },
    { num: hiw.step2_num, icon: <BrainCircuit className="h-5 w-5" />,   title: hiw.step2_title, desc: hiw.step2_desc },
    { num: hiw.step3_num, icon: <BarChart3 className="h-5 w-5" />,      title: hiw.step3_title, desc: hiw.step3_desc },
  ];

  const macroKeys: { key: keyof MacroSignals; label: string }[] = [
    { key: "narrative_arc",        label: t.results.narrative_arc },
    { key: "energy_curve",         label: t.results.energy_curve },
    { key: "register_consistency", label: t.results.register_consistency },
    { key: "knowledge_depth",      label: t.results.knowledge_depth },
    { key: "repetition_pattern",   label: t.results.repetition_pattern },
  ];

  async function handleTryAnalyze() {
    if (!tryText.trim() || tryOverLimit) return;
    setTryLoading(true);
    setTryError(null);
    setTryResult(null);
    try {
      const res = await fetch("/api/try-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: tryText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? t.errors.generic);
      setTryResult(data);
    } catch (err: any) {
      setTryError(err?.message ?? t.errors.generic);
    } finally {
      setTryLoading(false);
    }
  }

  const pieData = tryResult ? [
    { name: t.results.human_score, value: tryResult.human_pct, color: "#10b981" },
    { name: t.results.ai_score,   value: tryResult.ai_pct,    color: "#ef4444" },
  ] : [];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-amber-50 py-10 sm:py-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-4 text-center">
          {/* Compact headline block */}
          <Badge variant="gold" className="mb-3 inline-flex px-3 py-1 text-xs">
            ✦ {t.hero.badge} ✦
          </Badge>

          <h1 className="mb-2 text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight tracking-tight text-gray-900">
            {t.hero.title}
            <span className="text-gold-gradient"> {t.hero.subtitle}</span>
          </h1>

          <p className="mx-auto mb-5 max-w-xl text-sm sm:text-base text-gray-500 leading-relaxed px-2">
            {t.hero.description}
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center mb-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-teal-700 hover:bg-teal-600 text-white">
                {t.hero.cta_primary}
                <ChevronRight className={cn("h-4 w-4", dir === "rtl" ? "rotate-180" : "")} />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full">{t.hero.cta_secondary}</Button>
            </a>
          </div>

          <div className="flex justify-center gap-3 text-lg mb-8">
            {["🇦🇪","🇸🇦","🇰🇼","🇧🇭","🇶🇦","🇴🇲"].map((f, i) => (
              <span key={i} className="opacity-70 hover:opacity-100 transition">{f}</span>
            ))}
          </div>

          {/* ── Full analyze widget ── */}
          <div className="mx-auto max-w-3xl text-left">
            <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur-sm shadow-2xl p-6 sm:p-8">

              <p className="mb-4 text-center text-xs font-bold uppercase tracking-widest text-teal-600">
                {ar ? "حلّل النص الآن" : "Analyze Text"}
              </p>

              {/* Textarea */}
              <textarea
                autoFocus
                dir="rtl"
                value={tryText}
                onChange={(e) => { setTryText(e.target.value); setTryError(null); setTryResult(null); }}
                placeholder={t.analyze.paste_placeholder}
                rows={10}
                className={cn(
                  "w-full rounded-xl border p-4 font-arabic text-base leading-loose text-gray-800 resize-none",
                  "placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 transition",
                  tryOverLimit ? "border-red-300 bg-red-50" : "border-gray-200 bg-white",
                )}
              />

              {/* Word counter */}
              <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                <span>
                  {ar
                    ? `${toEasternArabic(String(tryWordCount))} / ${toEasternArabic(String(TRY_LIMIT))} ${t.analyze.word_count}`
                    : `${tryWordCount} / ${TRY_LIMIT} ${t.analyze.word_count}`}
                </span>
                {tryOverLimit && (
                  <span className="flex items-center gap-1 text-red-500 font-medium">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {ar ? "تجاوزت الحد المسموح" : "Limit exceeded"}
                  </span>
                )}
              </div>
              <Progress
                value={Math.min((tryWordCount / TRY_LIMIT) * 100, 100)}
                className="mt-1.5 h-1"
                indicatorClassName={tryOverLimit ? "bg-red-500" : undefined}
              />

              {/* Locked file upload */}
              <div className="mt-5">
                <p className="mb-2 text-sm font-medium text-gray-600">
                  {ar ? "أو ارفع ملفاً" : "Or upload a file"}
                </p>
                <Link href="/signup">
                  <div className="group flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-4 transition hover:border-teal-400 hover:bg-teal-50">
                    <Lock className="h-4 w-4 text-gray-300 group-hover:text-teal-400 transition" />
                    <p className="text-sm text-gray-400 group-hover:text-teal-600 transition">
                      {ar ? "أنشئ حساباً مجانياً لرفع PDF وDOCX وTXT" : "Create a free account to upload PDF, DOCX, or TXT"}
                    </p>
                    <span className="text-xs font-semibold text-teal-600 group-hover:underline">
                      {ar ? "إنشاء حساب مجاني ←" : "Sign up free →"}
                    </span>
                  </div>
                </Link>
              </div>

              {tryError && (
                <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {tryError}
                </div>
              )}

              <Button
                onClick={handleTryAnalyze}
                disabled={tryLoading || !tryText.trim() || tryOverLimit}
                className="mt-5 h-12 w-full bg-teal-700 text-base font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
              >
                {tryLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> {t.analyze.analyzing}</>
                  : t.analyze.submit}
              </Button>

              {/* ── Full results ── */}
              {tryResult && (
                <div className="mt-8 space-y-4">

                  {/* Score rings + pie */}
                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-6">
                    <div className={cn("mb-4 flex items-center justify-between flex-wrap gap-2", dir === "rtl" ? "flex-row-reverse" : "")}>
                      <h3 className="font-bold text-gray-900">{t.results.title}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <DialectBadge dialect={tryResult.dialect} t={t} />
                        <ConfidenceBadge confidence={tryResult.confidence} t={t} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 items-center">
                      <div className="flex justify-center">
                        <ScoreRing pct={tryResult.human_pct} label={t.results.human_score} color="#10b981" />
                      </div>
                      <div className="flex justify-center">
                        <ScoreRing pct={tryResult.ai_pct} label={t.results.ai_score} color="#ef4444" />
                      </div>
                      <div className="col-span-2 sm:col-span-1 h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={52} dataKey="value">
                              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                            </Pie>
                            <Tooltip formatter={(v) => `${v}%`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  {tryResult.summary && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{t.results.summary_title}</p>
                      <p dir={dir} className={cn("text-sm text-gray-700 leading-relaxed font-arabic", dir === "rtl" ? "text-right" : "text-left")}>
                        {tryResult.summary}
                      </p>
                    </div>
                  )}

                  {/* Macro signals */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">{t.results.macro_title}</p>
                    {macroKeys.map(({ key, label }) => (
                      <MacroRow key={key} label={label} value={tryResult.macro_signals[key]} t={t} />
                    ))}
                  </div>

                  {/* Flags */}
                  {(tryResult.red_flags.length > 0 || tryResult.green_flags.length > 0) && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {tryResult.red_flags.length > 0 && (
                        <div className="rounded-2xl border border-red-100 bg-white p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-500">🚩 {t.results.red_flags_title}</p>
                          <ul className="space-y-1.5">
                            {tryResult.red_flags.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                                <span dir={dir} className="font-arabic leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {tryResult.green_flags.length > 0 && (
                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-600">✅ {t.results.green_flags_title}</p>
                          <ul className="space-y-1.5">
                            {tryResult.green_flags.map((f, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                                <span dir={dir} className="font-arabic leading-snug">{f}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Sentence analysis */}
                  {tryResult.sentence_data.length > 0 && (
                    <div className="rounded-2xl border border-gray-100 bg-white p-4">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">{t.results.sentence_analysis}</p>
                      <div className="space-y-2">
                        {tryResult.sentence_data.map((s, i) => (
                          <SentenceCard key={i} s={s} t={t} dir={dir} />
                        ))}
                      </div>
                      <div className={cn("mt-4 flex items-center gap-4 text-xs text-gray-500", dir === "rtl" ? "flex-row-reverse" : "")}>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-green-400 inline-block" />{t.results.sentence_human}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />{t.results.sentence_ai}</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />{t.results.sentence_mixed}</span>
                      </div>
                    </div>
                  )}

                  {/* Signup CTA */}
                  <div className="rounded-2xl border border-teal-100 bg-teal-50 p-5 text-center">
                    <p className="mb-1 font-semibold text-teal-900">
                      {ar ? "احفظ نتائجك وحلّل بدون حدود" : "Save your results & analyze without limits"}
                    </p>
                    <p className="mb-4 text-sm text-teal-700">
                      {ar ? "سجل للوصول إلى السجل الكامل ورفع الملفات والمزيد" : "Get full history, file uploads, and unlimited checks"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Link href="/signup">
                        <Button className="bg-teal-700 hover:bg-teal-600 text-white px-8">
                          {ar ? "إنشاء حساب مجاني" : "Create Free Account"}
                        </Button>
                      </Link>
                      <Button variant="outline" onClick={() => { setTryResult(null); setTryText(""); }}>
                        {ar ? "تحليل نص جديد" : "Analyze another"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 sm:py-20 bg-gradient-to-b from-gray-50 to-white scroll-mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{hiw.title}</h2>
            <p className="mt-2 text-gray-500 text-sm sm:text-base">{hiw.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 mb-10">
            {howSteps.map((step, i) => (
              <HowStep key={i} {...step} last={i === howSteps.length - 1} />
            ))}
          </div>
          <div className="text-center">
            <Link href="/analyze">
              <Button size="lg" className="bg-teal-700 hover:bg-teal-600 text-white gap-2">
                {hiw.try_now}
                <ChevronRight className={cn("h-4 w-4", dir === "rtl" ? "rotate-180" : "")} />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-16 sm:py-20 bg-gray-50" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-10 sm:mb-12 text-center text-2xl sm:text-3xl font-bold text-gray-900">
            {t.features.title}
          </h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((feature, i) => (
              <Card key={i} className="group hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 group-hover:bg-teal-100 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-base">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      {(() => {
        const freeFeatures: PlanFeature[] = [
          { text: ar ? "٥ فحوصات شهرياً" : "5 checks / month", included: true },
          { text: ar ? "حتى ٥٠٠ كلمة لكل فحص" : "Up to 500 words per check", included: true },
          { text: ar ? "كشف اللهجة الأساسي" : "Basic dialect detection", included: true },
          { text: ar ? "نتائج فورية" : "Instant results", included: true },
          { text: ar ? "سجل التحليلات" : "Analysis history", included: false },
          { text: ar ? "رفع الملفات" : "File upload", included: false },
          { text: ar ? "دعم أولوي" : "Priority support", included: false },
        ];
        const starterFeatures: PlanFeature[] = [
          { text: ar ? "٥٠ فحصاً شهرياً" : "50 checks / month", included: true },
          { text: ar ? "حتى ٢٬٠٠٠ كلمة لكل فحص" : "Up to 2,000 words per check", included: true },
          { text: ar ? "كشف لهجة متقدم" : "Advanced dialect detection", included: true },
          { text: ar ? "سجل كامل للتحليلات" : "Full analysis history", included: true },
          { text: ar ? "درجة صحة المحتوى" : "Authenticity scoring", included: true },
          { text: ar ? "رفع الملفات" : "File upload", included: false },
          { text: ar ? "دعم أولوي" : "Priority support", included: false },
        ];
        const proFeatures: PlanFeature[] = [
          { text: ar ? "فحوصات غير محدودة" : "Unlimited checks", included: true },
          { text: ar ? "كلمات غير محدودة لكل فحص" : "Unlimited words per check", included: true },
          { text: ar ? "كشف لهجة متقدم" : "Advanced dialect detection", included: true },
          { text: ar ? "رفع الملفات (٥٠ ملف / شهر)" : "50 file uploads / month", included: true },
          { text: ar ? "درجة صحة المحتوى" : "Authenticity scoring", included: true },
          { text: ar ? "دعم أولوي" : "Priority support", included: true },
          { text: ar ? "مقاعد الفريق" : "Team seats", included: false },
        ];
        const bizFeatures: PlanFeature[] = [
          { text: ar ? "فحوصات غير محدودة" : "Unlimited checks", included: true },
          { text: ar ? "كلمات غير محدودة" : "Unlimited words", included: true },
          { text: ar ? "رفع ملفات غير محدود" : "Unlimited file uploads", included: true },
          { text: ar ? "تقارير PDF بعلامتك التجارية" : "White-label PDF reports", included: true },
          { text: ar ? "حتى ١٠ مقاعد للفريق" : "Up to 10 team seats", included: true },
          { text: ar ? "درجة صحة المحتوى" : "Authenticity scoring", included: true },
          { text: ar ? "مدير حساب مخصص" : "Dedicated account manager", included: true },
        ];
        return (
          <section className="py-16 sm:py-24 bg-gray-50" id="pricing">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {ar ? "الأسعار" : "Simple, transparent pricing"}
                </h2>
                <p className="mt-2 text-gray-500 max-w-xl mx-auto">
                  {ar ? "اختر الخطة المناسبة — ابدأ مجاناً، وارتقِ عند الحاجة" : "Start free, scale when you're ready. No hidden fees."}
                </p>
              </div>
              <div className="flex justify-center mb-10 sm:mb-14">
                <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 gap-1 shadow-sm">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={cn("rounded-full px-5 py-2 text-sm font-medium transition-all",
                      billing === "monthly" ? "bg-teal-700 text-white shadow" : "text-gray-500 hover:text-gray-700")}
                  >
                    {ar ? "شهري" : "Monthly"}
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className={cn("flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                      billing === "annual" ? "bg-teal-700 text-white shadow" : "text-gray-500 hover:text-gray-700")}
                  >
                    {ar ? "سنوي" : "Annual"}
                    <span className={cn("rounded-full text-xs font-bold px-2 py-0.5",
                      billing === "annual" ? "bg-white text-teal-700" : "bg-green-100 text-green-700")}>
                      {ar ? "خصم ٢٠٪" : "Save 20%"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 items-start max-w-6xl mx-auto">
                <PricingCard name={ar ? "مجاني" : "Free"} price={0} annualPrice={0}
                  features={freeFeatures} cta={ar ? "ابدأ مجاناً" : "Get Started"}
                  locale={locale} plan="free" billing={billing} />
                <PricingCard name={ar ? "مبتدئ" : "Starter"} price={24} annualPrice={19}
                  features={starterFeatures} cta={ar ? "ابدأ الآن" : "Get Started"}
                  locale={locale} plan="starter" billing={billing} />
                <PricingCard name={ar ? "احترافي" : "Pro"} price={29} annualPrice={24}
                  features={proFeatures} cta={ar ? "اشترك في Pro" : "Go Pro"}
                  badge={ar ? "الأكثر شعبية ✦" : "Most Popular ✦"} highlighted
                  locale={locale} plan="pro" billing={billing} />
                <PricingCard name={ar ? "أعمال" : "Business"} price={99} annualPrice={79}
                  features={bizFeatures} cta={ar ? "تواصل مع فريق المبيعات" : "Contact Sales"}
                  locale={locale} plan="business" billing={billing} />
              </div>
              <p className="mt-8 text-center text-xs text-gray-400">
                {ar ? "جميع الأسعار بالدولار الأمريكي • لا رسوم خفية • إلغاء في أي وقت" : "All prices in USD · No hidden fees · Cancel anytime"}
              </p>
            </div>
          </section>
        );
      })()}

      <Footer />
    </div>
  );
}
