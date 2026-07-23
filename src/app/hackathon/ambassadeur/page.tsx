import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { AmbassadorPromoPageClient } from "@/components/hackathon/ambassador-promo-page-client";
import { getSessionUser } from "@/lib/session-user";
import { getLocale } from "@/lib/get-locale";
import { ambassadorPageCopy } from "@/lib/hackathon/ambassador-ui-copy";

export const dynamic = "force-dynamic";

const PATH = "/hackathon/ambassadeur";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const c = ambassadorPageCopy(locale);
  return {
    title: c.metaTitle,
    description: c.metaDesc,
    robots: { index: true, follow: true },
  };
}

export default async function HackathonAmbassadorPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(PATH)}`);
  }

  const displayName =
    user.email.split("@")[0]?.replace(/[._]/g, " ") || "Ambassadeur";

  return (
    <div className="relative min-h-dvh bg-[#F7F8F5]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(31,107,67,0.14),_transparent_60%)]"
      />
      <LandingTopBar authReturnPath={PATH} />
      <AmbassadorPromoPageClient
        initialEmail={user.email}
        initialDisplayName={displayName}
      />
    </div>
  );
}
