import type { MetadataRoute } from "next";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { PUBLIC_SITEMAP_PATHS } from "@/lib/seo/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = CANONICAL_PRODUCTION_ORIGIN;
  const now = new Date();

  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/about" || path === "/contact" ? 0.8 : 0.6,
  }));
}
