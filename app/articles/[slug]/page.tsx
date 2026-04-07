"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/locale-context";

type Article = {
  title: string;
  excerpt: string;
  content: string;
  cover_image_url: string | null;
  published_at: string | null;
};

export default function ArticleDetailsPage() {
  const { locale } = useLocale();
  const params = useParams<{ slug: string }>();
  const [loading, setLoading] = useState(true);
  const [article, setArticle] = useState<Article | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/articles/${params.slug}`);
        const data = await res.json();
        if (res.ok) setArticle(data.article ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [params.slug]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-gray-50 py-10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Link href="/articles">
            <Button variant="outline" size="sm" className="mb-4">
              {locale === "ar" ? "رجوع للمقالات" : "Back to articles"}
            </Button>
          </Link>

          {loading && <p className="text-sm text-gray-500">{locale === "ar" ? "جار التحميل..." : "Loading..."}</p>}

          {!loading && !article && (
            <Card>
              <CardContent className="py-8 text-sm text-gray-500">
                {locale === "ar" ? "المقال غير موجود" : "Article not found"}
              </CardContent>
            </Card>
          )}

          {!loading && article && (
            <Card className="overflow-hidden">
              {article.cover_image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={article.cover_image_url} alt={article.title} className="h-56 w-full object-cover" />
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{article.title}</CardTitle>
                {article.published_at && (
                  <p className="text-sm text-gray-500">{article.published_at.slice(0, 10)}</p>
                )}
              </CardHeader>
              <CardContent>
                {article.excerpt && (
                  <p className="mb-4 text-base text-gray-600">{article.excerpt}</p>
                )}
                <article className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                  {article.content}
                </article>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
