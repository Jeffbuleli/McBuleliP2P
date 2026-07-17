import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { CommunityPoweredByStrip } from "@/components/community/community-powered-by-strip";

const INVITE =
  "Rejoignez une communauté P2P, Trading Crypto et Builders Innovants";

/** Immersive public share landing (posts, profiles, media). */
export function CommunityPublicShareShell({
  loginHref,
  registerHref,
  atmosphereUrl,
  children,
  inviteHandle,
  primaryCta = "Créer un compte gratuit",
  secondaryCta = "Ouvrir dans McBuleli",
  notFound = false,
  notFoundLabel = "Contenu introuvable.",
}: {
  loginHref: string;
  registerHref: string;
  atmosphereUrl?: string | null;
  children?: ReactNode;
  /** Shown in invite line as @handle */
  inviteHandle?: string;
  primaryCta?: string;
  secondaryCta?: string;
  notFound?: boolean;
  notFoundLabel?: string;
}) {
  if (notFound) {
    return (
      <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#0c1a0e] px-4 py-12 text-center">
        <p className="text-sm text-white/70">{notFoundLabel}</p>
        <Link href="/" className="mt-4 text-sm font-semibold text-[#9dcc9f]">
          mcbuleli.org
        </Link>
        <div className="mt-10">
          <CommunityPoweredByStrip onDark />
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#0b1510] text-white">
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {atmosphereUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={atmosphereUrl}
            alt=""
            className="h-full w-full scale-110 object-cover opacity-40 blur-2xl"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1510]/40 via-[#0b1510]/75 to-[#0b1510]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(48,95,51,0.35),_transparent_55%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-8 pt-5">
        <header className="mb-5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-[#eaf5ee] ring-1 ring-white/20">
              <Image
                src="/brand/logo-256.png"
                alt="McBuleli"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                unoptimized
              />
            </span>
            <span className="text-sm font-extrabold tracking-tight text-white">
              McBuleli
            </span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link
              href={loginHref}
              className="rounded-full px-3 py-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              Connexion
            </Link>
            <Link
              href={registerHref}
              className="rounded-full bg-white px-3 py-1.5 font-bold text-[#1a3d1c]"
            >
              Créer un compte
            </Link>
          </div>
        </header>

        <article className="overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/95 text-[#0c0a09] shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm">
          {children}

          <div className="px-5 pb-6">
            <div className="rounded-2xl bg-[#eaf5ee] px-4 py-3.5 ring-1 ring-[#305f33]/15">
              <p className="text-[13px] font-semibold leading-snug text-[#1a3d1c]">
                {INVITE}
                {inviteHandle ? (
                  <>
                    {" "}
                    - comme{" "}
                    <span className="font-extrabold">@{inviteHandle}</span>
                  </>
                ) : null}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href={registerHref}
                className="flex min-h-[52px] items-center justify-center rounded-2xl bg-[#305f33] text-[15px] font-extrabold text-white shadow-[0_10px_28px_rgba(48,95,51,0.35)] transition active:scale-[0.99]"
              >
                {primaryCta}
              </Link>
              <Link
                href={loginHref}
                className="flex min-h-[48px] items-center justify-center rounded-2xl border border-[#dce8e0] bg-white text-sm font-bold text-[#305f33] transition active:scale-[0.99]"
              >
                {secondaryCta}
              </Link>
            </div>
          </div>
        </article>

        <div className="mt-auto pt-8">
          <CommunityPoweredByStrip onDark />
        </div>
      </div>
    </main>
  );
}
