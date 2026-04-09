import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "أنسنة النص — اجعل نصك يبدو بشرياً | Humanize Text",
  description:
    "أعد صياغة النصوص المُولَّدة بالذكاء الاصطناعي لتبدو طبيعية ومكتوبة بيد بشرية. يدعم اللهجة الإماراتية والخليجية والعربية الفصحى.",
  alternates: { canonical: "https://truth-ai.studio/humanize" },
};

export default function HumanizeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
