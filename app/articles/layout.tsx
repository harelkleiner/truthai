import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "مقالات — أخبار ونصائح حول كشف الذكاء الاصطناعي | Articles",
  description:
    "مقالات ونصائح حول كشف محتوى الذكاء الاصطناعي بالعربية، أنسنة النصوص، والكتابة الإبداعية باللهجة الإماراتية والخليجية.",
  alternates: { canonical: "https://truth-ai.studio/articles" },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
