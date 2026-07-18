import type { MetadataRoute } from "next";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { buildCommunitySitemapEntries } from "@/lib/seo/community-sitemap";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = CANONICAL_PRODUCTION_ORIGIN;
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_SITEMAP_PATHS.map(
    (path) => ({
      url: `${base}${path}`,
      lastModified: now,
      changeFrequency:
        path === "" || path === "/community" ? "daily" : "monthly",
      priority:
        path === ""
          ? 1
          : path === "/community"
            ? 0.85
            : path === "/about" || path === "/contact" || path === "/whitepaper"
              ? 0.8
              : 0.6,
    }),
  );

  const community = await buildCommunitySitemapEntries();
  // Hub already included in static + community helper; dedupe by URL
  const seen = new Set<string>();
  const out: MetadataRoute.Sitemap = [];
  for (const entry of [...staticEntries, ...community]) {
    if (seen.has(entry.url)) continue;
    seen.add(entry.url);
    out.push(entry);
  }
  return out;
}
