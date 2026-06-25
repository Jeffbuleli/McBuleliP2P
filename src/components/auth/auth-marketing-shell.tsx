"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LangSwitch } from "@/components/lang-switch";
import { useI18n } from "@/components/i18n-provider";

function BackHomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
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
    <div className="flex items-center justify-center gap-2.5 px-4 py-6">
      <Link
        href="/"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-stone-200 bg-white text-[#305F33] shadow-sm transition hover:border-[#305F33]/30 hover:bg-[#305F33]/5 active:scale-95"
        aria-label={t("auth_back_home")}
        title={t("auth_back_home")}
      >
        <BackHomeIcon className="h-4 w-4" />
      </Link>
      <p className="text-xs text-stone-500">
        {prefix ? <span>{prefix} </span> : null}
        <Link href={linkHref} className="font-bold text-[#305F33] hover:underline">
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

const authInputClass = "auth-input";
export const authLabelClass = "auth-label auth-field flex flex-col gap-1.5";
export { authInputClass };

export function AuthMarketingShell({
  children,
  footer,
  showBrandHeader = true,
  mode = "login",
}: {
  children: ReactNode;
  footer?: ReactNode;
  showBrandHeader?: boolean;
  mode?: "login" | "register";
}) {
  const { t } = useI18n();
  const headline = mode === "register" ? t("auth_register_headline") : t("auth_login_headline");

  return (
    <div className="auth-v2 fd-public-light notranslate flex min-h-dvh flex-col bg-[#fafaf9] text-stone-900">
      <header className="relative px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-5">
          <LangSwitch />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Image
            src="/brand/logo-256.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full ring-2 ring-[#305F33]/20"
            priority
          />
          <span className="text-base font-extrabold tracking-tight text-stone-900">{t("brand")}</span>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 sm:px-6">
        {showBrandHeader ? (
          <h1 className="mb-4 text-center text-xl font-black text-stone-900">{headline}</h1>
        ) : null}

        <div className="rounded-2xl border border-stone-200/80 bg-white p-4 shadow-lg shadow-stone-300/25 sm:p-5">
          {children}
        </div>
      </div>

      {footer}
    </div>
  );
}

/** Shared outline button style for Pi / Passkey on auth cards. */
export const authAltBtnClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-bold text-stone-800 shadow-sm transition hover:border-[#305F33]/25 hover:bg-[#305F33]/[0.03] active:scale-[0.99] disabled:opacity-60";

export const authAltBtnPiClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-amber-200/80 bg-amber-50/50 px-4 text-sm font-bold text-[#78350f] shadow-sm transition hover:border-amber-300 hover:bg-amber-50 active:scale-[0.99] disabled:opacity-60";

export const authAltBtnPasskeyClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-[#305F33]/20 bg-[#305F33]/5 px-4 text-sm font-bold text-[#305F33] shadow-sm transition hover:border-[#305F33]/35 hover:bg-[#305F33]/10 active:scale-[0.99] disabled:opacity-60";
