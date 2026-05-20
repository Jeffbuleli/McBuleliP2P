"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
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
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg shadow-black/30 ring-2 ring-emerald-500/30">
        <Image
          src="/brand/logo.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
      </div>
      <h1 className="mt-3 text-2xl font-black tracking-tight text-stone-50">
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
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-stone-700/70 bg-stone-950/70 text-stone-200 transition hover:border-emerald-700/40 hover:text-white active:scale-[0.99]"
        aria-label={t("auth_back_home")}
        title={t("auth_back_home")}
      >
        <BackIcon className="h-5 w-5" />
      </Link>
      {prefix ? <span className="text-stone-500">{prefix}</span> : null}
      <Link
        href={linkHref}
        className="font-extrabold text-emerald-300 underline-offset-4 hover:text-emerald-200 hover:underline"
      >
        {linkLabel}
      </Link>
    </footer>
  );
}

export function AuthMarketingShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-full">
      <div
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_55%_at_50%_-15%,rgba(16,185,129,0.14),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-full max-w-md flex-col px-4 pb-10 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <AuthBrandHeader />
        <div className="flex-1">{children}</div>
        {footer}
      </div>
    </div>
  );
}
