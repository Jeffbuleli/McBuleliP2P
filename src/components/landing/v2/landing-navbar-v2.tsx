"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LangSwitch } from "@/components/lang-switch";
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
    { href: "/#services", label: t("landing_nav_services") },
    { href: "/#rates", label: t("landing_v2_flash_title") },
    { href: "/#market", label: t("landing_v2_nav_p2p") },
    { href: "/#avec", label: t("landing_v2_nav_avec") },
    { href: "/app/community", label: t("landing_v2_nav_community") },
    { href: "/app/academy", label: t("landing_v2_nav_blog") },
  ];

  return (
    <header className="landing-v2-nav sticky top-0 z-50 border-b border-stone-200/80 bg-white/95 backdrop-blur-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-2 py-2.5 sm:py-3">
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Image
              src="/brand/logo-256.png"
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-full ring-2 ring-[#305F33]/20"
              priority
            />
            <span className="text-base font-extrabold tracking-tight text-stone-900">{t("brand")}</span>
          </Link>

          <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 lg:flex" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                className="rounded-lg px-2.5 py-2 text-[13px] font-semibold text-stone-600 transition hover:bg-stone-50 hover:text-[#305F33]"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <LangSwitch />
            <Link
              href={loginHref}
              prefetch={false}
              className="hidden rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:border-[#305F33]/30 hover:text-[#305F33] sm:inline-flex"
            >
              {t("landing_cta_login")}
            </Link>
            <Link
              href={entryHref}
              prefetch={false}
              className="hidden rounded-xl bg-[#305F33] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#244a27] sm:inline-flex"
            >
              {t("landing_v2_cta_start")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-700 ring-1 ring-stone-200 lg:hidden"
              aria-expanded={open}
              aria-label="Menu"
            >
              {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {open ? (
        <div className="border-t border-stone-100 bg-white px-4 py-3 lg:hidden">
          <nav className="flex flex-col gap-0.5">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {item.label}
              </Link>
            ))}
            <SessionAppLink
              href="/app/wallet"
              onClick={() => setOpen(false)}
              className="mt-3 flex min-h-[48px] items-center justify-center rounded-xl bg-[#305F33] text-sm font-bold text-white"
            >
              {t("landing_nav_open_app")}
            </SessionAppLink>
            <Link
              href={loginHref}
              prefetch={false}
              onClick={() => setOpen(false)}
              className="mt-2 py-2 text-center text-xs font-semibold text-stone-500 hover:text-[#305F33]"
            >
              {t("landing_cta_login")}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
