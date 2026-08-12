import type { MetadataRoute } from "next";

import { publishedStories } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.pdtv.me";

  const stories = await publishedStories(1000);

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },

    ...stories.map((story) => ({
      url: `${base}/news/${story.slug}`,
      lastModified: new Date(
        story.updated_at ||
          story.published_at ||
          story.created_at
      ),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}