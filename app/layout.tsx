import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";
import { Analytics } from "@vercel/analytics/next";

const BASE_URL = "https://truth-ai.studio";

export const metadata: Metadata = {
  title: {
    default: "TruthAI — كشف محتوى الذكاء الاصطناعي بالعربية | Arabic AI Content Detection",
    template: "%s | TruthAI",
  },
  description:
    "المنصة الوحيدة لكشف محتوى الذكاء الاصطناعي باللهجة الإماراتية والخليجية والعربية الفصحى. أنسنة النصوص وتحليل الجمل بدقة عالية. The only platform for Arabic AI content detection.",
  keywords: [
    "كشف الذكاء الاصطناعي",
    "كاشف الذكاء الاصطناعي عربي",
    "كشف النصوص المكتوبة بالذكاء الاصطناعي",
    "أنسنة النصوص العربية",
    "هل النص مكتوب بالذكاء الاصطناعي",
    "AI detection Arabic",
    "Arabic AI content detector",
    "humanize Arabic text",
    "GPT detector Arabic",
    "Emirati dialect detection",
  ],
  metadataBase: new URL(BASE_URL),
  alternates: {
    canonical: BASE_URL,
    languages: { ar: BASE_URL, en: BASE_URL },
  },
  openGraph: {
    type: "website",
    locale: "ar_AE",
    alternateLocale: "en_US",
    siteName: "TruthAI",
    title: "TruthAI — كشف محتوى الذكاء الاصطناعي بالعربية",
    description:
      "المنصة الوحيدة لكشف محتوى الذكاء الاصطناعي باللهجة الإماراتية والخليجية. حلل نصك واكتشف إن كان مكتوباً بالذكاء الاصطناعي.",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "TruthAI — كشف محتوى الذكاء الاصطناعي بالعربية",
    description:
      "المنصة الوحيدة لكشف محتوى الذكاء الاصطناعي باللهجة الإماراتية والخليجية.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  icons: {
    icon: "/icon",
    shortcut: "/icon",
    apple: "/icon",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "TruthAI",
              url: BASE_URL,
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web",
              description:
                "المنصة الوحيدة لكشف محتوى الذكاء الاصطناعي باللهجة الإماراتية والخليجية والعربية الفصحى",
              inLanguage: ["ar", "en"],
              offers: {
                "@type": "AggregateOffer",
                lowPrice: "0",
                highPrice: "99",
                priceCurrency: "USD",
                offerCount: 4,
              },
              provider: {
                "@type": "Organization",
                name: "TruthAI",
                url: BASE_URL,
              },
            }),
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <LocaleProvider>{children}</LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
