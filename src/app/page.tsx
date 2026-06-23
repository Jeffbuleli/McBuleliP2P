import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { HomeLanding } from "@/components/landing/home-landing";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";
import { homeSeoCopy, organizationJsonLd, SEO_KEYWORDS } from "@/lib/seo/site";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = homeSeoCopy(locale);

  return {
    title: seo.title,
    description: seo.description,
    keywords: [...SEO_KEYWORDS],
    alternates: {
      canonical: CANONICAL_PRODUCTION_ORIGIN,
    },
    openGraph: {
      type: "website",
      url: CANONICAL_PRODUCTION_ORIGIN,
      siteName: "McBuleli",
      title: seo.ogTitle,
      description: seo.description,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? ["en_US"] : ["fr_FR"],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle,
      description: seo.description,
    },
  };
}

export default async function HomePage() {
  const userId = await getSessionUserId();
  if (userId) {
    redirect("/app");
  }

  const locale = await getLocale();
  const jsonLd = organizationJsonLd(locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeLanding />
    </>
  );
}
