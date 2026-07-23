import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { AmbassadorPromoClient } from "@/components/hackathon/ambassador-promo-client";
import { getSessionUser } from "@/lib/session-user";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Devenir ambassadeur - McBuleli Hackathon",
  description:
    "Crée ton code promo McBuleli Hackathon, partage ton lien et gagne du cashback.",
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
    <div className="relative min-h-dvh bg-[#F7F8F5]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(31,107,67,0.14),_transparent_60%)]"
      />
      <LandingTopBar authReturnPath={PATH} />
      <main className="relative mx-auto max-w-lg px-4 py-10 sm:py-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1F6B43]">
          McBuleli Hackathon
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-[#1A1A1A] sm:text-4xl">
          Devenir ambassadeur
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5c6b60]">
          Crée ton code, partage ton lien d&apos;inscription, suis les
          confirmations et retire ton cashback Mobile Money.
        </p>

        <ul className="mt-6 space-y-2.5 rounded-2xl bg-white/80 px-4 py-4 text-sm text-[#3D3D3D] shadow-sm ring-1 ring-black/[0.04] backdrop-blur-sm">
          <li className="flex gap-2">
            <span className="font-bold text-[#1F6B43]">
              -{AMBASSADOR_DISCOUNT_PERCENT}%
            </span>
            <span>pour chaque personne qui s&apos;inscrit avec ton code</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#1F6B43]">
              +{AMBASSADOR_CASHBACK_USD} USD
            </span>
            <span>pour toi à chaque paiement confirmé</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#1F6B43]">
              {PROMO_CASHBACK_CLAIM_MIN_USD}+ USD
            </span>
            <span>pour retirer via Mobile Money</span>
          </li>
          <li className="text-[#6B6B6B]">
            Pas de cashback sur ton propre paiement - anti-collusion actif
          </li>
        </ul>

        <div className="mt-8">
          <AmbassadorPromoClient
            initialEmail={user.email}
            initialDisplayName={displayName}
          />
        </div>

        <p className="mt-8 text-center text-xs text-[#6B6B6B]">
          <Link href="/hackathon" className="font-semibold text-[#1F6B43] hover:underline">
            Retour au hackathon
          </Link>
        </p>

        <p className="mt-6 text-center text-[10px] leading-relaxed text-[#8A8A8A]">
          McBuleli - RCCM CD/KNG/RCCM/26-A-00382
        </p>
        <McBuleliPoweredFooter />
      </main>
    </div>
  );
}
