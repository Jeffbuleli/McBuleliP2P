import type { Metadata } from "next";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonLanding } from "@/components/hackathon/hackathon-landing";
import { getLocale } from "@/lib/get-locale";
import { getFeaturedHackathon } from "@/lib/hackathon/service";
import { CANONICAL_PRODUCTION_ORIGIN } from "@/lib/app-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "McBuleli Hackathon — Build the Future with AI",
  description:
    "Bootcamps et Hackathons McBuleli : Vibe Coding, startups IA, jury, mentors, tickets QR. Kinshasa et au-delà.",
  openGraph: {
    title: "McBuleli Hackathon — Build the Future with AI",
    description:
      "Participez aux Bootcamps et Hackathons McBuleli pour apprendre le Vibe Coding et pitcher devant un jury.",
    url: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon`,
  },
  alternates: { canonical: `${CANONICAL_PRODUCTION_ORIGIN}/hackathon` },
};

export default async function HackathonPage() {
  const locale = await getLocale();
  const isFr = locale === "fr";
  let data = null;
  try {
    data = await getFeaturedHackathon();
  } catch {
    data = null;
  }

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <LandingTopBar authReturnPath="/hackathon" />
      {data ? (
        <HackathonLanding data={data} locale={isFr ? "fr" : "en"} />
      ) : (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <h1 className="text-2xl font-black text-[color:var(--fd-text)]">
            McBuleli Hackathon
          </h1>
          <p className="mt-3 text-sm text-[color:var(--fd-muted)]">
            {isFr
              ? "La prochaine édition arrive bientôt. Revenez dans quelques instants."
              : "The next edition is coming soon. Check back shortly."}
          </p>
        </div>
      )}
    </div>
  );
}
