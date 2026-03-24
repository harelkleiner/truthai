"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/lib/locale-context";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Zap, ShieldCheck, Languages, ChevronRight, Check,
  MessageSquare, ClipboardPaste, BrainCircuit, BarChart3, ChevronDown,
} from "lucide-react";
import { cn, toEasternArabic } from "@/lib/utils";

/* ─── Currency config ─── */
type CurrencyCode = "USD" | "AED" | "SAR" | "KWD" | "BHD" | "QAR" | "OMR";

// Rates = how much target currency per 1 AED (base is AED)
const CURRENCIES: { code: CurrencyCode; symbol: string; rate: number; label: string }[] = [
  { code: "AED", symbol: "د.إ", rate: 1,      label: "AED — درهم إماراتي" },
  { code: "USD", symbol: "$",   rate: 0.2723, label: "USD — US Dollar" },
  { code: "SAR", symbol: "ر.س", rate: 1.0211, label: "SAR — ريال سعودي" },
  { code: "KWD", symbol: "د.ك", rate: 0.0839, label: "KWD — دينار كويتي" },
  { code: "BHD", symbol: "د.ب", rate: 0.1024, label: "BHD — دينار بحريني" },
  { code: "QAR", symbol: "ر.ق", rate: 0.9911, label: "QAR — ريال قطري" },
  { code: "OMR", symbol: "ر.ع", rate: 0.1049, label: "OMR — ريال عُماني" },
];

function convertPrice(aed: number, currency: CurrencyCode): string {
  const c = CURRENCIES.find((x) => x.code === currency)!;
  const val = aed * c.rate;
  if (val < 1)  return val.toFixed(2);
  if (val < 10) return val.toFixed(1);
  return Math.round(val).toString();
}

/* ─── Pricing card ─── */
function PricingCard({
  name, priceAed, annualPriceAed, features, cta, badge, saveBadge,
  highlighted = false, locale, currency, plan, billing,
}: {
  name: string;
  priceAed: number | null;
  annualPriceAed: number | null;
  features: string[];
  cta: string;
  badge?: string;
  saveBadge?: string;
  highlighted?: boolean;
  locale: string;
  currency: CurrencyCode;
  plan: "free" | "pro" | "business";
  billing: "monthly" | "annual";
}) {
  const c = CURRENCIES.find((x) => x.code === currency)!;

  const effectiveAed = priceAed === null ? null
    : billing === "annual" && annualPriceAed !== null ? annualPriceAed
    : priceAed;

  const priceDisplay = effectiveAed === null ? (locale === "ar" ? "٠" : "0")
    : locale === "ar" ? toEasternArabic(convertPrice(effectiveAed, currency))
    : convertPrice(effectiveAed, currency);

  const annualTotalDisplay = billing === "annual" && annualPriceAed !== null
    ? (locale === "ar"
        ? `${toEasternArabic(convertPrice(annualPriceAed * 12, currency))} ${c.symbol} / سنة`
        : `${c.symbol}${convertPrice(annualPriceAed * 12, currency)} / yr`)
    : null;

  async function handleClick() {
    if (plan === "free") { window.location.href = "/signup"; return; }
    if (plan === "business") { window.location.href = "/contact"; return; }
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, email: "" }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else window.location.href = "/signup";
    } catch {
      window.location.href = "/signup";
    }
  }

  return (
    <div className={cn(
      "relative rounded-2xl border p-6 sm:p-8 flex flex-col",
      highlighted
        ? "border-teal-700 bg-teal-700 text-white shadow-xl sm:scale-105 z-10"
        : "border-gray-200 bg-white",
    )}>
      {badge && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-0.5 text-xs font-bold text-white whitespace-nowrap">
          {badge}
        </span>
      )}
      <div className="mb-6">
        <p className={cn("text-sm font-medium mb-1", highlighted ? "text-teal-100" : "text-gray-500")}>
          {name}
        </p>
        <div className="flex items-baseline gap-1 flex-wrap">
          <span className={cn("text-xs sm:text-sm font-medium", highlighted ? "text-teal-200" : "text-gray-400")}>
            {c.symbol}
          </span>
          <span className="text-3xl sm:text-4xl font-bold">{priceDisplay}</span>
          <span className={cn("text-xs sm:text-sm", highlighted ? "text-teal-100" : "text-gray-400")}>
            / {locale === "ar" ? "شهر" : "mo"}
          </span>
        </div>
        {annualTotalDisplay && (
          <p className={cn("text-xs mt-1", highlighted ? "text-teal-200" : "text-gray-400")}>
            {locale === "ar" ? `يُحسب سنوياً • ` : `billed annually • `}
            {annualTotalDisplay}
          </p>
        )}
        {saveBadge && billing === "annual" && priceAed !== null && (
          <span className="mt-2 inline-block rounded-full bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-0.5">
            {saveBadge}
          </span>
        )}
      </div>
      <ul className="space-y-2.5 flex-1 mb-6 sm:mb-8">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", highlighted ? "text-teal-200" : "text-teal-600")} />
            <span className={highlighted ? "text-teal-50" : "text-gray-600"}>{f}</span>
          </li>
        ))}
      </ul>
      <Button onClick={handleClick} className="w-full" variant={highlighted ? "secondary" : "default"}>
        {cta}
      </Button>
    </div>
  );
}

/* ─── How it works step ─── */
function HowStep({
  num, icon, title, desc, last = false,
}: {
  num: string; icon: React.ReactNode; title: string; desc: string; last?: boolean;
}) {
  return (
    <div className="flex gap-4 sm:flex-col sm:gap-3 sm:items-center sm:text-center">
      <div className="relative flex-shrink-0">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
          {icon}
        </div>
        {!last && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 hidden sm:block h-8 w-px bg-teal-200 mt-1" />
        )}
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
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [currency, setCurrency] = useState<CurrencyCode>("AED");
  const [currencyOpen, setCurrencyOpen] = useState(false);

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-white to-amber-50 py-16 sm:py-24 lg:py-32">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-teal-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 sm:h-96 sm:w-96 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <Badge variant="gold" className="mb-5 inline-flex px-4 py-1.5 text-xs sm:text-sm">
            ✦ {t.hero.badge} ✦
          </Badge>

          <h1 className="mb-4 text-3xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-gray-900">
            {t.hero.title}
            <br />
            <span className="text-gold-gradient">{t.hero.subtitle}</span>
          </h1>

          <p className="mx-auto mb-8 max-w-2xl text-base sm:text-lg text-gray-600 leading-relaxed px-2">
            {t.hero.description}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/analyze" className="w-full sm:w-auto">
              <Button size="xl" className="w-full bg-teal-700 hover:bg-teal-600 text-white">
                {t.hero.cta_primary}
                <ChevronRight className={cn("h-5 w-5", dir === "rtl" ? "rotate-180" : "")} />
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto">
              <Button size="xl" variant="outline" className="w-full">{t.hero.cta_secondary}</Button>
            </a>
          </div>

          <p className="mt-6 text-xs text-gray-400 px-4">{t.hero.trusted}</p>
          <div className="mt-5 flex justify-center gap-3 sm:gap-4 text-xl sm:text-2xl">
            {["🇦🇪","🇸🇦","🇰🇼","🇧🇭","🇶🇦","🇴🇲"].map((f, i) => (
              <span key={i} className="opacity-80 hover:opacity-100 transition">{f}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO PREVIEW ── */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400">
                {locale === "ar" ? "مثال تحليل" : "Analysis Example"}
              </span>
            </div>
            <div dir="rtl" className="rounded-xl bg-white p-4 sm:p-5 text-right shadow-inner overflow-x-hidden">
              <p className="font-arabic leading-loose text-gray-700 text-sm sm:text-base">
                <span className="sentence-human">وايد زين هذا الموضوع يا جماعة،</span>{" "}
                <span className="sentence-ai">ومن الجدير بالذكر أن هذه القضية تستحق الدراسة المعمقة والتحليل الشامل.</span>{" "}
                <span className="sentence-human">بس عيل شلون نقدر نحسنه؟</span>
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 rounded-lg bg-teal-50 px-3 sm:px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{locale === "ar" ? "اللهجة:" : "Dialect:"}</span>
                  <Badge variant="default" className="text-xs">{locale === "ar" ? "إماراتية ✓" : "Emirati ✓"}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-green-700">{locale === "ar" ? "٦٢٪ بشري" : "62% Human"}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-red-400" />
                    <span className="text-red-600">{locale === "ar" ? "٣٨٪ ذكاء اصطناعي" : "38% AI"}</span>
                  </span>
                </div>
              </div>
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

          {/* Steps: vertical on mobile, horizontal on desktop */}
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6 mb-12">
            {howSteps.map((step, i) => (
              <HowStep key={i} {...step} last={i === howSteps.length - 1} />
            ))}
          </div>

          {/* Live mini-demo inside the section */}
          <div className="rounded-2xl border border-teal-100 bg-white shadow-md overflow-hidden">
            {/* Mock browser bar */}
            <div className="flex items-center gap-2 bg-gray-50 border-b border-gray-100 px-4 py-2.5">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 rounded-md bg-gray-200 h-4 mx-2 text-xs text-gray-400 flex items-center px-2 truncate">
                truthai.io/analyze
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                {/* Input side */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {locale === "ar" ? "النص المدخَل" : "Input"}
                  </p>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-3 sm:p-4 font-arabic text-right text-sm leading-loose text-gray-700 min-h-[100px]" dir="rtl">
                    <span className="text-gray-400">{t.analyze.paste_placeholder.slice(0, 80)}...</span>
                  </div>
                  <div className="mt-3">
                    <div className="h-9 w-full rounded-lg bg-teal-700 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">{t.analyze.submit}</span>
                    </div>
                  </div>
                </div>

                {/* Output side */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    {locale === "ar" ? "النتائج" : "Results"}
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-3 py-2">
                      <span className="text-xs text-green-800 font-medium">{locale === "ar" ? "بشري" : "Human"}</span>
                      <span className="text-lg font-bold text-green-700">{locale === "ar" ? "٧٢٪" : "72%"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                      <span className="text-xs text-red-800 font-medium">{locale === "ar" ? "ذكاء اصطناعي" : "AI"}</span>
                      <span className="text-lg font-bold text-red-600">{locale === "ar" ? "٢٨٪" : "28%"}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-teal-50 border border-teal-100 px-3 py-2">
                      <span className="text-xs text-teal-800 font-medium">{locale === "ar" ? "اللهجة" : "Dialect"}</span>
                      <Badge variant="default" className="text-xs">{locale === "ar" ? "إماراتية" : "Emirati"}</Badge>
                    </div>
                    <div className="rounded-lg bg-gray-50 border border-gray-100 px-3 py-2">
                      <p className="text-xs text-gray-500 leading-snug font-arabic" dir="rtl">
                        {locale === "ar"
                          ? "النص يبدو في معظمه إنسانياً مع وجود جملة واحدة تشبه مخرجات النماذج..."
                          : "Text appears mostly human-written with one sentence resembling AI output..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
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
      <section className="py-16 sm:py-20 bg-white" id="pricing">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t.pricing.title}</h2>
            <p className="mt-2 text-gray-500">{t.pricing.subtitle}</p>
          </div>

          {/* Controls: billing toggle + currency picker */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10 sm:mb-14">

            {/* Billing toggle */}
            <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1 gap-1">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                  billing === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {locale === "ar" ? "شهري" : "Monthly"}
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
                  billing === "annual"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {locale === "ar" ? "سنوي" : "Annual"}
                <span className="rounded-full bg-green-100 text-green-700 text-xs font-bold px-1.5 py-0.5">
                  {locale === "ar" ? "٢٠٪ خصم" : "-20%"}
                </span>
              </button>
            </div>

            {/* Currency picker */}
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen((o) => !o)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:border-teal-400 transition-colors"
              >
                <span>{CURRENCIES.find((c) => c.code === currency)?.symbol}</span>
                <span>{currency}</span>
                <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
              </button>
              {currencyOpen && (
                <div className="absolute top-full mt-1 z-20 w-52 rounded-xl border border-gray-100 bg-white shadow-lg overflow-hidden"
                  style={{ [dir === "rtl" ? "right" : "left"]: 0 }}>
                  {CURRENCIES.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { setCurrency(c.code); setCurrencyOpen(false); }}
                      className={cn(
                        "w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-start",
                        c.code === currency ? "text-teal-700 font-semibold bg-teal-50" : "text-gray-700",
                      )}
                    >
                      <span className="w-6 text-base">{c.symbol}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-5 md:grid md:grid-cols-3 md:items-center max-w-5xl mx-auto">
            <PricingCard
              name={t.pricing.free.name}
              priceAed={0} annualPriceAed={0}
              features={t.pricing.free.features} cta={t.pricing.free.cta}
              locale={locale} currency={currency} plan="free" billing={billing} />
            <PricingCard
              name={t.pricing.pro.name}
              priceAed={49} annualPriceAed={39}
              features={t.pricing.pro.features} cta={t.pricing.pro.cta}
              badge={t.pricing.pro.badge}
              saveBadge={locale === "ar" ? "شهران مجاناً 🎉" : "2 months free 🎉"}
              highlighted
              locale={locale} currency={currency} plan="pro" billing={billing} />
            <PricingCard
              name={t.pricing.business.name}
              priceAed={199} annualPriceAed={159}
              features={t.pricing.business.features} cta={t.pricing.business.cta}
              saveBadge={locale === "ar" ? "وفّر ٢٠٪" : "Save 20%"}
              locale={locale} currency={currency} plan="business" billing={billing} />
          </div>

          <p className="mt-6 text-center text-xs text-gray-400">
            {locale === "ar"
              ? "الأسعار تقريبية بناءً على أسعار الصرف الحالية • السعر الأساسي بالدرهم الإماراتي"
              : "Prices are approximate based on current exchange rates • Base price in AED"}
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
