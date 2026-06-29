import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { FormationRegisterForm } from "@/components/formation/formation-register-form";
import { LandingLaunchHero } from "@/components/landing/landing-launch-hero";
import { LandingFuturisticBg } from "@/components/landing/landing-futuristic-bg";
import { LangSwitch } from "@/components/lang-switch";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { TRAINING_END, TRAINING_SLOT, TRAINING_START } from "@/lib/launch-campaign";
import { getSessionUserId } from "@/lib/session";

export const metadata = {
  title: "Formation McBuleli - inscription gratuite",
  description:
    "Formation gratuite Crypto, Trading, IA et P2P. Lancement 8 juin 2026. Sessions 15-30 juin.",
};

export default async function FormationPage() {
  const locale = await getLocale();
  const isFr = locale === "fr";
  const d = getDictionary(locale);
  const userId = await getSessionUserId();

  return (
    <div className="auth-v2 auth-futuristic fd-public-futuristic notranslate relative min-h-dvh overflow-hidden text-stone-100">
      <LandingFuturisticBg />
      <header className="relative z-20 border-b border-white/6 bg-[#050810]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3 lg:max-w-3xl">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full ring-2 ring-emerald-500/25"
            />
            <span className="text-sm font-extrabold">{d.brand}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden font-mono text-[10px] font-semibold uppercase tracking-wider text-cyan-400/90 hover:text-cyan-300 sm:inline"
            >
              ← {d.auth_back_home}
            </Link>
            <LangSwitch variant="dark" />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-2xl px-4 pb-14 pt-4 lg:max-w-3xl">
        <LandingLaunchHero linkHref={null} />

        <HudFrame accent="cyan" className={`mt-6 ${HUD_PANEL_LG} p-5 sm:p-7`}>
          <h1 className="text-xl font-black text-white sm:text-2xl">
            {isFr ? "Inscription - formation gratuite" : "Register - free training"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            {isFr
              ? `Sessions du ${TRAINING_START} au ${TRAINING_END}, chaque samedi ${TRAINING_SLOT} (GMT+1).`
              : `Sessions ${TRAINING_START}-${TRAINING_END}, every Saturday ${TRAINING_SLOT} (GMT+1).`}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-400/90">
            {isFr
              ? "Powered by McBuleli - vos coordonnées servent uniquement aux rappels formation."
              : "Powered by McBuleli - your contact details are used only for training reminders."}
          </p>
          {userId ? (
            <p className="mt-4 border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-300">
              {isFr ? "Compte connecté - " : "Signed in - "}
              <Link href="/app/academy" className="font-extrabold text-cyan-400 underline-offset-4 hover:underline">
                {isFr ? "ouvrir McBuleli Academy" : "open McBuleli Academy"}
              </Link>
            </p>
          ) : null}
          <Suspense fallback={<p className="mt-6 text-sm text-stone-500">…</p>}>
            <FormationRegisterForm locale={locale} isLoggedIn={!!userId} />
          </Suspense>
          <p className="mt-6 text-center text-xs text-stone-500">
            <Link href="/" className="font-semibold text-cyan-400 hover:text-cyan-300">
              ← mcbuleli.org
            </Link>
          </p>
        </HudFrame>
      </main>
    </div>
  );
}
