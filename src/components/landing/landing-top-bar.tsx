"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { useI18n } from "@/components/i18n-provider";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden
      fill="currentColor"
    >
      <path d="M18.9 2H21l-6.6 7.6L22.2 22h-6.2l-4.9-6.4L5.5 22H3.4l7.1-8.2L2 2h6.3l4.4 5.8L18.9 2Zm-2.2 18h1.1L7.7 3.9H6.5L16.7 20Z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function LandingTopBar({ authReturnPath = "/app/wallet" }: { authReturnPath?: string }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const loginHref = loginHrefFor(authReturnPath);
  const registerHref = registerHrefFor(authReturnPath);

  const deskNav = [
    { href: "/#market", label: t("landing_nav_market") },
    { href: "/#africa", label: t("landing_nav_africa") },
    { href: "/#services", label: t("landing_nav_services") },
    { href: "/#how", label: t("landing_nav_how") },
    { href: "/about", label: t("landing_nav_about") },
    { href: "/contact", label: t("landing_nav_contact") },
  ];

  return (
    <header className="sticky top-0 z-40 px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-2">
      <div className="relative mx-auto max-w-lg sm:max-w-6xl">
        <div className="fd-app-topbar flex items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 pr-1">
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-[color:var(--fd-primary)]/25">
              <Image
                src="/brand/logo-256.png"
                alt=""
                aria-hidden
                width={40}
                height={40}
                className="object-cover"
                priority
              />
            </div>
            <span className="truncate text-base font-bold tracking-tight text-[color:var(--fd-text)]">
              {t("brand")}
            </span>
          </Link>
          <nav
            className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 px-2 sm:flex"
            aria-label="Primary"
          >
            {deskNav.map((x) => (
              <a
                key={x.href}
                href={x.href}
                className="rounded-full px-3 py-1.5 text-[13px] font-semibold text-[color:var(--fd-muted)] transition hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-primary)]"
              >
                {x.label}
              </a>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-2">
            <div className="sm:hidden">
              <LangSwitch />
            </div>
            <a
              href="https://x.com/McBuleli"
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--fd-muted)] transition hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-primary)]"
              aria-label="X"
              title="X"
            >
              <XIcon className="h-5 w-5" />
            </a>
            <div className="hidden sm:block">
              <LangSwitch />
            </div>
            <Link
              href={loginHref}
              prefetch={false}
              className="hidden min-h-10 items-center justify-center rounded-xl px-3.5 text-[13px] font-bold text-[color:var(--fd-muted)] transition hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-primary)] sm:inline-flex"
            >
              {t("landing_cta_login")}
            </Link>
            <Link
              href={registerHref}
              prefetch={false}
              className="hidden min-h-10 items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-4 text-[13px] font-extrabold text-white shadow-md shadow-[color:var(--fd-primary)]/20 transition active:scale-[0.99] sm:inline-flex"
            >
              {t("landing_cta_primary")}
            </Link>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-[color:var(--fd-muted)] transition hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-primary)] sm:hidden"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label="Menu"
              title="Menu"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {open ? (
          <div
            className="absolute right-0 mt-2 w-[min(92vw,18rem)] overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-white shadow-xl"
            role="menu"
          >
            <div className="flex flex-col p-2">
              <Link
                href="/"
                className="rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--fd-primary)] hover:bg-[color:var(--fd-mint)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("brand")}
              </Link>
              <Link
                href={registerHref}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_cta_primary")}
              </Link>
              <Link
                href={loginHref}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_cta_login")}
              </Link>
              <div className="my-2 h-px bg-[color:var(--fd-border)]" />
              <Link
                href="/about"
                className="rounded-xl px-3 py-2 text-sm text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-text)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_footer_about")}
              </Link>
              <Link
                href="/contact"
                className="rounded-xl px-3 py-2 text-sm text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-text)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_footer_contact")}
              </Link>
              <Link
                href="/terms"
                className="rounded-xl px-3 py-2 text-sm text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-text)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_footer_terms")}
              </Link>
              <Link
                href="/privacy"
                className="rounded-xl px-3 py-2 text-sm text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)] hover:text-[color:var(--fd-text)]"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {t("landing_footer_privacy")}
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
