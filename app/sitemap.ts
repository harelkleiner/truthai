import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const BASE = "https://truth-ai.studio";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/analyze`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/humanize`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/articles`, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE}/contact`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/login`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${BASE}/signup`, changeFrequency: "monthly", priority: 0.4 },
  ];

  // Fetch published article slugs
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: articles } = await supabase
      .from("articles")
      .select("slug, updated_at")
      .eq("published", true)
      .order("published_at", { ascending: false });

    articlePages = (articles ?? []).map((a) => ({
      url: `${BASE}/articles/${a.slug}`,
      lastModified: a.updated_at ? new Date(a.updated_at) : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Supabase unavailable — skip articles
  }

  return [...staticPages, ...articlePages];
}
