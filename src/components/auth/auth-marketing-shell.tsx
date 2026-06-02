"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { useI18n } from "@/components/i18n-provider";

function BackIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function AuthBrandHeader() {
  const { t } = useI18n();
  return (
    <header className="flex flex-col items-center pb-6 pt-4 text-center">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-md ring-2 ring-[color:var(--fd-primary)]/20">
        <Image
          src="/brand/logo-256.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
      </div>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-[color:var(--fd-text)]">
        {t("brand")}
      </h1>
    </header>
  );
}

export function AuthPageFooter({
  prefix,
  linkHref,
  linkLabel,
}: {
  prefix?: string;
  linkHref: string;
  linkLabel: string;
}) {
  const { t } = useI18n();
  return (
    <footer className="mt-6 flex items-center gap-2 text-sm">
      <Link
        href="/"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] shadow-sm transition hover:bg-[color:var(--fd-mint)] active:scale-[0.99]"
        aria-label={t("auth_back_home")}
        title={t("auth_back_home")}
      >
        <BackIcon className="h-5 w-5" />
      </Link>
      {prefix ? <span className="text-[color:var(--fd-muted)]">{prefix}</span> : null}
      <Link
        href={linkHref}
        className="font-extrabold text-[color:var(--fd-primary)] underline-offset-4 hover:underline"
      >
        {linkLabel}
      </Link>
    </footer>
  );
}

/** Core input styling lives in globals.css (`.auth-input`) — Tailwind classes are optional polish. */
const authInputClass = "auth-input";

export const authLabelClass = "auth-label auth-field flex flex-col gap-1";
export { authInputClass };

export function AuthMarketingShell({
  children,
  footer,
  showBrandHeader = true,
}: {
  children: ReactNode;
  footer?: ReactNode;
  /** When false, skip the top logo block (e.g. `AuthWaitingScreen` already brands the view). */
  showBrandHeader?: boolean;
}) {
  return (
    <div className="home-theme fd-public-light notranslate relative min-h-dvh">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(48,95,51,0.1),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-dvh max-w-md flex-col px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div className="auth-lang-float">
          <LangSwitch />
        </div>
        {showBrandHeader ? <AuthBrandHeader /> : null}
        <div className="flex-1">{children}</div>
        {footer}
      </div>
    </div>
  );
}
