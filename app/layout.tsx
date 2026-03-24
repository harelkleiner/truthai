import type { Metadata } from "next";
import "./globals.css";
import { LocaleProvider } from "@/lib/locale-context";

export const metadata: Metadata = {
  title: "TruthAI — Arabic AI Content Detection | كشف محتوى الذكاء الاصطناعي",
  description:
    "The only platform purpose-built for Emirati Arabic AI content detection across the GCC. المنصة الوحيدة لكشف محتوى الذكاء الاصطناعي باللهجة الإماراتية.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        <LocaleProvider>{children}</LocaleProvider>
      </body>
    </html>
  );
}
