"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { LangSwitch } from "@/components/lang-switch";
import { LandingFuturisticBg } from "@/components/landing/landing-futuristic-bg";
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
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/5 text-cyan-400 transition hover:border-cyan-500/30 hover:bg-cyan-500/10 active:scale-95"
        aria-label={t("auth_back_home")}
        title={t("auth_back_home")}
      >
        <BackHomeIcon className="h-4 w-4" />
      </Link>
      <p className="text-xs text-stone-500">
        {prefix ? <span>{prefix} </span> : null}
        <Link href={linkHref} className="font-bold text-emerald-400 hover:text-emerald-300 hover:underline">
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}

export const authInputClass =
  "auth-input w-full min-h-[48px] rounded-xl border border-white/20 bg-[#050810] px-3 py-2.5 text-sm text-stone-100 outline-none focus:border-cyan-400/45 focus:shadow-[0_0_0_3px_rgba(34,211,238,0.14)]";
export const authLabelClass = "auth-label auth-field flex flex-col gap-1.5";

export function AuthMarketingShell({
  children,
  footer,
  showBrandHeader = true,
  mode = "login",
}: {
  children: ReactNode;
  footer?: ReactNode;
  showBrandHeader?: boolean;
  mode?: "login" | "register" | "forgot" | "reset" | "recovery";
}) {
  const { t } = useI18n();
  const headline =
    mode === "register"
      ? t("auth_register_headline")
      : mode === "forgot"
        ? t("forgot_title")
        : mode === "reset"
          ? t("reset_title")
          : mode === "recovery"
            ? t("recovery_title")
            : t("auth_login_headline");

  return (
    <div className="auth-v2 auth-futuristic notranslate relative flex min-h-dvh flex-col overflow-hidden">
      <LandingFuturisticBg />
      <header className="relative z-10 px-4 pb-2 pt-5 sm:px-6 sm:pt-6">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-5">
          <LangSwitch variant="dark" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Image
            src="/brand/logo-256.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full ring-2 ring-emerald-500/30"
            priority
          />
          <span className="text-base font-extrabold tracking-tight text-stone-100">{t("brand")}</span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col px-4 sm:px-6">
        {showBrandHeader ? (
          <h1 className="mb-4 text-center text-xl font-black text-white sm:text-2xl">{headline}</h1>
        ) : null}

        <HudFrame accent="cyan" className={`${HUD_PANEL_LG} p-4 sm:p-5`}>
          {children}
        </HudFrame>
      </div>

      <div className="relative z-10">{footer}</div>
    </div>
  );
}

export const authAltBtnClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-white/12 bg-white/[0.03] px-4 text-sm font-bold text-stone-200 transition hover:border-cyan-500/25 hover:bg-cyan-500/5 active:scale-[0.99] disabled:opacity-60";

export const authAltBtnPiClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 text-sm font-bold text-amber-200 transition hover:border-amber-400/40 hover:bg-amber-500/12 active:scale-[0.99] disabled:opacity-60";

export const authAltBtnPasskeyClass =
  "flex min-h-[50px] w-full items-center justify-center gap-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/8 px-4 text-sm font-bold text-emerald-300 transition hover:border-emerald-400/40 hover:bg-emerald-500/12 active:scale-[0.99] disabled:opacity-60";

export const authErrorClass =
  "rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300";

export const authBtnSecondaryClass =
  "inline-flex min-h-[52px] w-full items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-5 text-sm font-bold text-stone-200 transition hover:border-cyan-500/25 hover:bg-cyan-500/5 active:scale-[0.99] disabled:opacity-60";

export const authTextMutedClass = "text-sm leading-relaxed text-stone-400";

export const authLinkMutedClass =
  "text-xs font-semibold text-stone-500 underline-offset-4 hover:text-cyan-400 hover:underline";
