import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تحليل النص — كشف الذكاء الاصطناعي بالعربية | Analyze Text",
  description:
    "حلل أي نص عربي واكتشف إن كان مكتوباً بالذكاء الاصطناعي. يدعم اللهجة الإماراتية والخليجية والفصحى مع تحليل كل جملة بشكل منفصل.",
  alternates: { canonical: "https://truth-ai.studio/analyze" },
};

export default function AnalyzeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
