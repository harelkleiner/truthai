import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin/", "/dashboard/", "/checkout-redirect/"],
    },
    sitemap: "https://truth-ai.studio/sitemap.xml",
  };
}
