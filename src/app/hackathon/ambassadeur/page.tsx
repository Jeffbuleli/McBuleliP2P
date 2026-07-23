import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { AmbassadorPromoClient } from "@/components/hackathon/ambassador-promo-client";
import { getSessionUser } from "@/lib/session-user";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
} from "@/lib/hackathon/promo-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devenir ambassadeur - McBuleli Hackathon",
  description:
    "Cree ton code promo McBuleli Hackathon, partage ton lien et gagne du cashback.",
  robots: { index: true, follow: true },
};

const PATH = "/hackathon/ambassadeur";

export default async function HackathonAmbassadorPage() {
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(PATH)}`);
  }

  const displayName =
    user.email.split("@")[0]?.replace(/[._]/g, " ") || "Ambassadeur";

  return (
    <div className="min-h-dvh bg-[#F7F8F5]">
      <LandingTopBar authReturnPath={PATH} />
      <main className="mx-auto max-w-lg px-4 py-10 sm:py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1F6B43]">
          McBuleli Hackathon
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1A1A]">
          Devenir ambassadeur
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5c6b60]">
          Cree ton code, partage ton lien d&apos;inscription, suis les
          confirmations et retire ton cashback Mobile Money.
        </p>

        <ul className="mt-5 space-y-2 text-sm text-[#5c6b60]">
          <li>
            -{AMBASSADOR_DISCOUNT_PERCENT}% pour chaque personne qui s&apos;inscrit
            avec ton code
          </li>
          <li>
            +{AMBASSADOR_CASHBACK_USD} USD pour toi a chaque paiement confirme
          </li>
          <li>
            Pas de cashback sur ton propre paiement - pas de collusion entre
            comptes
          </li>
        </ul>

        <div className="mt-8">
          <AmbassadorPromoClient
            initialEmail={user.email}
            initialDisplayName={displayName}
          />
        </div>

        <p className="mt-8 text-center text-xs text-[#6B6B6B]">
          <Link href="/hackathon" className="font-semibold text-[#1F6B43]">
            Retour au hackathon
          </Link>
        </p>
      </main>
    </div>
  );
}
