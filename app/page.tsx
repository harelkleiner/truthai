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
  Zap, ShieldCheck, Languages, ChevronRight, Check, X,
  MessageSquare, ClipboardPaste, BrainCircuit, BarChart3,
} from "lucide-react";
import { cn, toEasternArabic } from "@/lib/utils";

type PlanFeature = { text: string; included: boolean };
type PlanKey = "free" | "starter" | "pro" | "business";

/* ─── Pricing card ─── */
function PricingCard({
  name, description, price, annualPrice, features, cta, badge,
  highlighted = false, locale, plan, billing,
}: {
  name: string;
  description: string;
  price: number;
  annualPrice: number;
  features: PlanFeature[];
  cta: string;
  badge?: string;
  highlighted?: boolean;
  locale: string;
  plan: PlanKey;
  billing: "monthly" | "annual";
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

      {/* Header */}
      <div className="mb-5">
        <p className={cn("text-xs font-bold uppercase tracking-widest mb-1", highlighted ? "text-teal-200" : "text-teal-600")}>
          {name}
        </p>
        <p className={cn("text-sm mb-4 leading-snug", highlighted ? "text-teal-100" : "text-gray-500")}>
          {description}
        </p>

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

      {/* Divider */}
      <div className={cn("mb-5 border-t", highlighted ? "border-teal-600" : "border-gray-100")} />

      {/* Features */}
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
              f.included
                ? (highlighted ? "text-white" : "text-gray-700")
                : (highlighted ? "text-teal-400" : "text-gray-300"),
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
      {(() => {
        const ar = locale === "ar";

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

              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {ar ? "الأسعار" : "Simple, transparent pricing"}
                </h2>
                <p className="mt-2 text-gray-500 max-w-xl mx-auto">
                  {ar
                    ? "اختر الخطة المناسبة — ابدأ مجاناً، وارتقِ عند الحاجة"
                    : "Start free, scale when you're ready. No hidden fees."}
                </p>
              </div>

              {/* Billing toggle */}
              <div className="flex justify-center mb-10 sm:mb-14">
                <div className="flex items-center rounded-full border border-gray-200 bg-white p-1 gap-1 shadow-sm">
                  <button
                    onClick={() => setBilling("monthly")}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm font-medium transition-all",
                      billing === "monthly"
                        ? "bg-teal-700 text-white shadow"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {ar ? "شهري" : "Monthly"}
                  </button>
                  <button
                    onClick={() => setBilling("annual")}
                    className={cn(
                      "flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all",
                      billing === "annual"
                        ? "bg-teal-700 text-white shadow"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {ar ? "سنوي" : "Annual"}
                    <span className={cn(
                      "rounded-full text-xs font-bold px-2 py-0.5",
                      billing === "annual" ? "bg-white text-teal-700" : "bg-green-100 text-green-700",
                    )}>
                      {ar ? "خصم ٢٠٪" : "Save 20%"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Cards — 2 col mobile → 4 col desktop */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-4 items-start max-w-6xl mx-auto">
                <PricingCard
                  name={ar ? "مجاني" : "Free"}
                  description={ar ? "للاستخدام الشخصي والاستكشاف" : "For personal use & exploration"}
                  price={0} annualPrice={0}
                  features={freeFeatures}
                  cta={ar ? "ابدأ مجاناً" : "Get Started"}
                  locale={locale} plan="free" billing={billing} />

                <PricingCard
                  name={ar ? "مبتدئ" : "Starter"}
                  description={ar ? "للكتّاب والمدونين المستقلين" : "For freelance writers & bloggers"}
                  price={12} annualPrice={9}
                  features={starterFeatures}
                  cta={ar ? "ابدأ الآن" : "Get Started"}
                  locale={locale} plan="starter" billing={billing} />

                <PricingCard
                  name={ar ? "احترافي" : "Pro"}
                  description={ar ? "للمؤسسات والفرق المحترفة" : "For content teams & institutions"}
                  price={29} annualPrice={24}
                  features={proFeatures}
                  cta={ar ? "اشترك في Pro" : "Go Pro"}
                  badge={ar ? "الأكثر شعبية ✦" : "Most Popular ✦"}
                  highlighted
                  locale={locale} plan="pro" billing={billing} />

                <PricingCard
                  name={ar ? "أعمال" : "Business"}
                  description={ar ? "للمؤسسات التي تحتاج لأكثر" : "For enterprises that need more"}
                  price={99} annualPrice={79}
                  features={bizFeatures}
                  cta={ar ? "تواصل مع فريق المبيعات" : "Contact Sales"}
                  locale={locale} plan="business" billing={billing} />
              </div>

              <p className="mt-8 text-center text-xs text-gray-400">
                {ar
                  ? "جميع الأسعار بالدولار الأمريكي • لا رسوم خفية • إلغاء في أي وقت"
                  : "All prices in USD · No hidden fees · Cancel anytime"}
              </p>
            </div>
          </section>
        );
      })()}

      <Footer />
    </div>
  );
}
