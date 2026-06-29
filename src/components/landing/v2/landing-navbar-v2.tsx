"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { HudLegalLink, HudNavLink, HudPrimaryLink, HudSecondaryLink, LANDING_CTA_PRIMARY } from "@/components/landing/landing-hud-ui";
import { useI18n } from "@/components/i18n-provider";
import { SessionAppLink } from "@/components/landing/session-app-link";
import { loginHrefFor, useSessionEntryHref } from "@/hooks/use-session-app-href";

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function LandingNavbarV2() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const entryHref = useSessionEntryHref("/app/wallet");
  const loginHref = loginHrefFor("/app/wallet");

  const nav = [
    { href: "/#rates", label: t("landing_v2_flash_title") },
    { href: "/#market", label: t("landing_v2_nav_p2p") },
    { href: "/#avec", label: t("landing_v2_nav_avec") },
    { href: "/formation", label: t("landing_v2_nav_blog") },
  ];

  const legal = [
    { href: "/about", label: t("landing_footer_about") },
    { href: "/contact", label: t("landing_footer_contact") },
    { href: "/terms", label: t("landing_footer_terms") },
    { href: "/privacy", label: t("landing_footer_privacy") },
  ];

  const close = () => setOpen(false);

  return (
    <header className="landing-v2-nav sticky top-0 z-50 border-b border-white/8 bg-[#050810]/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-2 sm:py-2.5">
          <Link href="/" className="group flex min-w-0 shrink-0 items-center gap-2">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={36}
              height={36}
              className="h-8 w-8 rounded-full ring-2 ring-emerald-500/25 sm:h-9 sm:w-9"
              priority
            />
            <span className="truncate text-sm font-extrabold tracking-tight text-stone-100 sm:text-base">
              {t("brand")}
            </span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <HudNavLink key={item.href} href={item.href}>
                {item.label}
              </HudNavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <LangSwitch variant="dark" />
            <HudSecondaryLink href={loginHref} className="hidden min-h-[40px] px-3 py-2 text-xs md:inline-flex">
              {t("landing_cta_login")}
            </HudSecondaryLink>
            <HudPrimaryLink href={entryHref} className="hidden min-h-[40px] px-4 py-2 text-xs md:inline-flex">
              {t("landing_v2_cta_start")}
            </HudPrimaryLink>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-stone-200 ring-1 ring-white/10 lg:hidden sm:h-10 sm:w-10"
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <nav
          className="hidden flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/6 py-2 lg:flex"
          aria-label="Legal"
        >
          {legal.map((item) => (
            <HudLegalLink key={item.href} href={item.href}>
              {item.label}
            </HudLegalLink>
          ))}
        </nav>
      </div>

      {open ? (
        <div className="border-t border-white/8 bg-[#0a1018] lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <nav className="flex flex-col gap-0.5" aria-label="Mobile">
              {nav.map((item) => (
                <HudNavLink
                  key={item.href}
                  href={item.href}
                  onClick={close}
                  className="px-3 py-2.5 text-sm"
                >
                  {item.label}
                </HudNavLink>
              ))}
              <div className="my-2 border-t border-white/6 pt-2">
                {legal.map((item) => (
                  <HudLegalLink
                    key={item.href}
                    href={item.href}
                    onClick={close}
                    className="block px-3 py-2 text-xs"
                  >
                    {item.label}
                  </HudLegalLink>
                ))}
              </div>
            </nav>
            <SessionAppLink
              href="/app/wallet"
              onClick={close}
              className={`mt-3 w-full ${LANDING_CTA_PRIMARY}`}
            >
              {t("landing_nav_open_app")}
            </SessionAppLink>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <HudSecondaryLink href={loginHref} onClick={close} className="min-h-[44px] w-full text-xs">
                {t("landing_cta_login")}
              </HudSecondaryLink>
              <HudPrimaryLink href={entryHref} onClick={close} className="min-h-[44px] w-full text-xs">
                {t("landing_v2_cta_start_short")}
              </HudPrimaryLink>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
