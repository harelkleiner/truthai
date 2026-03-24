"use client";

import { useState, useRef } from "react";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2, X, FileText, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn, countWords, toEasternArabic } from "@/lib/utils";
import type { DetectionResult, MacroSignals } from "@/lib/detection/detector";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const FREE_WORD_LIMIT = 500;

/* ─── Score ring ─── */
function ScoreRing({ pct, label, color }: { pct: number; label: string; color: string }) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
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
    "ai-like": t.results.ai_like,
    "human-like": t.results.human_like,
    "mixed": t.results.mixed,
    "flat": t.results.flat,
    "varied": t.results.varied,
    "consistent": t.results.consistent,
    "shifting": t.results.shifting,
    "uniform": t.results.uniform,
    "uneven": t.results.uneven,
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={cn(
        "text-xs font-semibold rounded-full px-2.5 py-0.5",
        isAi ? "bg-red-50 text-red-700" :
        isHuman ? "bg-green-50 text-green-700" :
        "bg-amber-50 text-amber-700"
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
      isAi ? "border-red-100 bg-red-50" :
      isHuman ? "border-green-100 bg-green-50" :
      "border-amber-100 bg-amber-50"
    )}>
      <div className="flex items-start gap-2">
        <span className={cn(
          "mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-bold",
          isAi ? "bg-red-200 text-red-800" :
          isHuman ? "bg-green-200 text-green-800" :
          "bg-amber-200 text-amber-800"
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

/* ─── Main page ─── */
export default function AnalyzePage() {
  const { t, locale, dir } = useLocale();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const wordCount = countWords(text);
  const overLimit = wordCount > FREE_WORD_LIMIT;

  async function handleAnalyze() {
    if (!text.trim()) { setError(t.errors.empty_text); return; }
    if (overLimit) { setError(t.errors.word_limit); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("Detection failed");
      setResult(await res.json());
    } catch {
      setError(t.errors.generic);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { setError(t.errors.file_size); return; }
    setFileName(file.name);
    setText(await file.text());
  }

  const pieData = result ? [
    { name: t.results.human_score, value: result.human_pct, color: "#10b981" },
    { name: t.results.ai_score,   value: result.ai_pct,    color: "#ef4444" },
  ] : [];

  const macroKeys: { key: keyof MacroSignals; label: string }[] = [
    { key: "narrative_arc",       label: t.results.narrative_arc },
    { key: "energy_curve",        label: t.results.energy_curve },
    { key: "register_consistency",label: t.results.register_consistency },
    { key: "knowledge_depth",     label: t.results.knowledge_depth },
    { key: "repetition_pattern",  label: t.results.repetition_pattern },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-10 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className={cn("mb-1 text-2xl font-bold text-gray-900", dir === "rtl" ? "text-right" : "text-left")}>
            {t.analyze.title}
          </h1>
          <p className={cn("mb-8 text-sm text-gray-500", dir === "rtl" ? "text-right" : "text-left")}>
            {t.analyze.free_limit}
          </p>

          {/* ── INPUT FORM ── */}
          {!result ? (
            <Card>
              <CardContent className="pt-6">
                {/* Textarea */}
                <div className="mb-4">
                  <label className={cn("mb-2 block text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "text-left")}>
                    {t.analyze.paste_label}
                  </label>
                  <textarea
                    dir="rtl"
                    value={text}
                    onChange={(e) => { setText(e.target.value); setError(null); }}
                    placeholder={t.analyze.paste_placeholder}
                    rows={10}
                    className={cn(
                      "w-full rounded-xl border p-4 font-arabic text-base leading-relaxed resize-none text-right",
                      "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500",
                      overLimit ? "border-red-300 bg-red-50" : "border-gray-200 bg-white"
                    )}
                  />
                  <div className={cn("mt-1.5 flex items-center text-xs text-gray-400", dir === "rtl" ? "flex-row-reverse" : "")}>
                    <span>
                      {locale === "ar"
                        ? `${toEasternArabic(wordCount)} ${t.analyze.word_count}`
                        : `${wordCount} ${t.analyze.word_count}`}
                    </span>
                    {overLimit && (
                      <span className={cn("flex items-center gap-1 text-red-500", dir === "rtl" ? "mr-auto" : "ml-auto")}>
                        <AlertCircle className="h-3.5 w-3.5" />
                        {t.errors.word_limit}
                      </span>
                    )}
                  </div>
                  <Progress
                    value={Math.min((wordCount / FREE_WORD_LIMIT) * 100, 100)}
                    className="mt-2 h-1.5"
                    indicatorClassName={overLimit ? "bg-red-500" : undefined}
                  />
                </div>

                {/* File upload */}
                <div className="mb-6">
                  <p className={cn("mb-2 text-sm font-medium text-gray-700", dir === "rtl" ? "text-right" : "text-left")}>
                    {t.analyze.upload_label}
                  </p>
                  <div
                    onClick={() => fileRef.current?.click()}
                    className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-6 transition hover:border-teal-400 hover:bg-teal-50"
                  >
                    {fileName ? (
                      <div className="flex items-center gap-2 text-sm text-teal-700">
                        <FileText className="h-4 w-4" />
                        <span>{fileName}</span>
                        <button onClick={(e) => { e.stopPropagation(); setFileName(null); setText(""); }}>
                          <X className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto mb-1 h-5 w-5 text-gray-400" />
                        <p className="text-sm text-gray-500">{t.analyze.upload_hint}</p>
                      </div>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept=".txt,.docx,.pdf" className="hidden" onChange={handleFileUpload} />
                </div>

                {error && (
                  <div className={cn("mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700", dir === "rtl" ? "flex-row-reverse text-right" : "")}>
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div className={cn("flex gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
                  <Button size="lg" onClick={handleAnalyze} disabled={loading || overLimit} className="flex-1 sm:flex-none">
                    {loading
                      ? <><Loader2 className="h-4 w-4 animate-spin" />{" "}{t.analyze.analyzing}</>
                      : t.analyze.submit}
                  </Button>
                  {text && (
                    <Button size="lg" variant="outline" onClick={() => { setText(""); setFileName(null); setError(null); }}>
                      {t.analyze.clear}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            /* ── RESULTS ── */
            <div className="space-y-5">

              {/* 1 — Score + pie */}
              <Card>
                <CardContent className="pt-6">
                  <div className={cn("mb-6 flex items-center justify-between flex-wrap gap-3", dir === "rtl" ? "flex-row-reverse" : "")}>
                    <h2 className="text-xl font-bold text-gray-900">{t.results.title}</h2>
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialectBadge dialect={result.dialect} t={t} />
                      <ConfidenceBadge confidence={result.confidence} t={t} />
                    </div>
                  </div>
                  {/* Rings: side-by-side on all screens, pie below on mobile, right col on desktop */}
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 items-center">
                    <div className="flex justify-center">
                      <ScoreRing pct={result.human_pct} label={t.results.human_score} color="#10b981" />
                    </div>
                    <div className="flex justify-center">
                      <ScoreRing pct={result.ai_pct} label={t.results.ai_score} color="#ef4444" />
                    </div>
                    <div className="col-span-2 sm:col-span-1 h-40 sm:h-44">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={32} outerRadius={58} dataKey="value">
                            {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                          </Pie>
                          <Tooltip formatter={(v) => `${v}%`} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2 — Summary */}
              {result.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className={cn("text-base", dir === "rtl" ? "text-right" : "text-left")}>
                      {t.results.summary_title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="-mt-2">
                    <p dir={dir} className={cn("text-sm text-gray-700 leading-relaxed font-arabic", dir === "rtl" ? "text-right" : "text-left")}>
                      {result.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 3 — Macro signals */}
              <Card>
                <CardHeader>
                  <CardTitle className={cn("text-base", dir === "rtl" ? "text-right" : "text-left")}>
                    {t.results.macro_title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="-mt-2">
                  {macroKeys.map(({ key, label }) => (
                    <MacroRow key={key} label={label} value={result.macro_signals[key]} t={t} />
                  ))}
                </CardContent>
              </Card>

              {/* 4 — Flags row */}
              {(result.red_flags.length > 0 || result.green_flags.length > 0) && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {result.red_flags.length > 0 && (
                    <Card className="border-red-100">
                      <CardHeader>
                        <CardTitle className={cn("text-base text-red-700", dir === "rtl" ? "text-right" : "text-left")}>
                          🚩 {t.results.red_flags_title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="-mt-2">
                        <ul className={cn("space-y-1.5", dir === "rtl" ? "text-right" : "text-left")}>
                          {result.red_flags.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                              <span dir={dir} className="font-arabic leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                  {result.green_flags.length > 0 && (
                    <Card className="border-green-100">
                      <CardHeader>
                        <CardTitle className={cn("text-base text-green-700", dir === "rtl" ? "text-right" : "text-left")}>
                          ✅ {t.results.green_flags_title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="-mt-2">
                        <ul className={cn("space-y-1.5", dir === "rtl" ? "text-right" : "text-left")}>
                          {result.green_flags.map((f, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400" />
                              <span dir={dir} className="font-arabic leading-snug">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* 5 — Sentence analysis */}
              {result.sentence_data.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className={cn("text-base", dir === "rtl" ? "text-right" : "text-left")}>
                      {t.results.sentence_analysis}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="-mt-2">
                    <div className="space-y-2">
                      {result.sentence_data.map((s, i) => (
                        <SentenceCard key={i} s={s} t={t} dir={dir} />
                      ))}
                    </div>
                    {/* Legend */}
                    <div className={cn("mt-4 flex items-center gap-4 text-xs text-gray-500", dir === "rtl" ? "flex-row-reverse" : "")}>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-green-400 inline-block" />
                        {t.results.sentence_human}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" />
                        {t.results.sentence_ai}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 inline-block" />
                        {t.results.sentence_mixed}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className={cn("flex gap-3 pb-4", dir === "rtl" ? "flex-row-reverse" : "")}>
                <Button onClick={() => { setResult(null); setText(""); }}>{t.results.new_analysis}</Button>
                <Button variant="outline">{t.results.save}</Button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
