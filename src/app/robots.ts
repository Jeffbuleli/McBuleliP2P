import type { MetadataRoute } from "next";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/api/"],
    },
    sitemap: `${CANONICAL_PRODUCTION_ORIGIN}/sitemap.xml`,
    host: CANONICAL_PRODUCTION_ORIGIN,
  };
}
