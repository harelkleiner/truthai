"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";
import { cn } from "@/lib/utils";

type ArticleCard = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  tags: string[];
  published_at: string | null;
};

export default function ArticlesPage() {
  const { locale, dir } = useLocale();
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleCard[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/articles");
        const data = await res.json();
        if (res.ok) setArticles(data.articles ?? []);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className={cn("mb-8", dir === "rtl" ? "text-right" : "text-left")}>
            <h1 className="text-3xl font-bold text-gray-900">{locale === "ar" ? "المقالات" : "Articles"}</h1>
            <p className="mt-2 text-gray-500">
              {locale === "ar" ? "محتوى وتعليمات حول كشف الكتابة بالذكاء الاصطناعي" : "Guides and insights about AI-writing detection"}
            </p>
          </div>

          {loading && <p className="text-sm text-gray-500">{locale === "ar" ? "جار التحميل..." : "Loading..."}</p>}

          {!loading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((a) => (
                <Card key={a.id} className="overflow-hidden">
                  {a.cover_image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.cover_image_url} alt={a.title} className="h-40 w-full object-cover" />
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2 text-lg">{a.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-3 line-clamp-3 text-sm text-gray-600">{a.excerpt}</p>
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {(a.tags ?? []).slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                    <Link href={`/articles/${a.slug}`}>
                      <Button size="sm" className="w-full">{locale === "ar" ? "قراءة المقال" : "Read article"}</Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!loading && articles.length === 0 && (
            <p className="text-sm text-gray-500">{locale === "ar" ? "لا توجد مقالات بعد" : "No articles yet."}</p>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
