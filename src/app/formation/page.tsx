import Link from "next/link";
import { Suspense } from "react";
import { FormationRegisterForm } from "@/components/formation/formation-register-form";
import { LandingLaunchHero } from "@/components/landing/landing-launch-hero";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { getLocale } from "@/lib/get-locale";
import { TRAINING_END, TRAINING_SLOT, TRAINING_START } from "@/lib/launch-campaign";
import { getSessionUserId } from "@/lib/session";

export const metadata = {
  title: "Formation McBuleli — inscription gratuite",
  description:
    "Formation gratuite Crypto, Trading, IA et P2P. Lancement 8 juin 2026. Sessions 15–30 juin.",
};

export default async function FormationPage() {
  const locale = await getLocale();
  const isFr = locale === "fr";
  const userId = await getSessionUserId();

  return (
    <div className="home-theme fd-public-light min-h-dvh">
      <LandingTopBar />
      <div className="relative mx-auto max-w-lg px-3 pb-10 pt-2 sm:max-w-xl lg:max-w-2xl">
        <LandingLaunchHero />
        <div className="fd-card mt-6 rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] p-5 sm:p-7">
          <h1 className="text-xl font-black text-[color:var(--fd-text)]">
            {isFr ? "Inscription — formation gratuite" : "Register — free training"}
          </h1>
          <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
            {isFr
              ? `Sessions du ${TRAINING_START} au ${TRAINING_END}, chaque samedi ${TRAINING_SLOT} (GMT+1).`
              : `Sessions ${TRAINING_START}–${TRAINING_END}, every Saturday ${TRAINING_SLOT} (GMT+1).`}
          </p>
          <p className="mt-1 text-xs font-semibold text-[color:var(--fd-primary)]">
            {isFr
              ? "Powered by McBuleli — vos coordonnées servent uniquement aux rappels formation."
              : "Powered by McBuleli — your contact details are used only for training reminders."}
          </p>
          {userId ? (
            <p className="mt-4 rounded-xl bg-[#e8f3ee] px-4 py-3 text-sm font-semibold text-[#305f33]">
              {isFr ? "Compte connecté — " : "Signed in — "}
              <Link href="/app/academy" className="underline font-extrabold">
                {isFr ? "ouvrir McBuleli Academy" : "open McBuleli Academy"}
              </Link>
            </p>
          ) : null}
          <Suspense fallback={<p className="mt-6 text-sm text-[color:var(--fd-muted)]">…</p>}>
            <FormationRegisterForm locale={locale} />
          </Suspense>
          <p className="mt-6 text-center text-xs text-[color:var(--fd-muted)]">
            <Link href="/" className="font-semibold text-[color:var(--fd-primary)]">
              ← mcbuleli.org
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
