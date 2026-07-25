"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";
import Link from "next/link";
import { LandingTopBar } from "@/components/landing/landing-top-bar";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";
import { useI18n } from "@/components/i18n-provider";

export function HkShell({
  children,
  authReturnPath,
}: {
  children: ReactNode;
  authReturnPath: string;
}) {
  return (
    <div className="min-h-dvh">
      <LandingTopBar authReturnPath={authReturnPath} />
      {children}
    </div>
  );
}

export function HkPage({
  eyebrow,
  title,
  lede,
  children,
  actions,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <main className="relative mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[color:var(--hk-accent,var(--fd-primary))]">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[color:var(--hk-text,var(--fd-text))] sm:text-4xl">
            {title}
          </h1>
          {lede ? (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[color:var(--hk-muted,var(--fd-muted))]">
              {lede}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </div>
      <div className="mt-8 space-y-5">{children}</div>
      <p className="mt-10 text-center text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
        <Link
          href="/hackathon"
          className="font-semibold text-[color:var(--hk-accent,var(--fd-primary))] hover:underline"
        >
          ← Hackathon
        </Link>
      </p>
      <HackathonPoweredBy />
    </main>
  );
}

export function HkSection({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-[color:var(--hk-surface,var(--fd-card))]/90 p-5 shadow-sm ring-1 ring-[color:var(--hk-border,var(--fd-border))] backdrop-blur-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[color:var(--hk-text,var(--fd-text))]">
            {title}
          </h2>
          {hint ? (
            <p className="mt-1 text-xs text-[color:var(--hk-muted,var(--fd-muted))]">
              {hint}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export function HkStatusPill({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok" | "warn" | "danger" | "accent";
}) {
  const tones = {
    neutral:
      "bg-[color:var(--hk-soft,var(--fd-mint))] text-[color:var(--hk-muted,var(--fd-muted))]",
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    warn: "bg-amber-500/15 text-[color:var(--hk-warn-text,#92400e)]",
    danger: "bg-red-500/15 text-red-700",
    accent:
      "bg-[color:var(--hk-accent,var(--fd-primary))]/10 text-[color:var(--hk-accent,var(--fd-primary))]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function HkBtn({
  children,
  onClick,
  disabled,
  variant = "primary",
  type = "button",
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  type?: "button" | "submit";
  className?: string;
}) {
  const variants = {
    primary:
      "bg-[color:var(--hk-accent,var(--fd-primary))] text-white hover:bg-[color:var(--fd-primary-dark)]",
    secondary:
      "bg-[color:var(--hk-page,var(--fd-bg))] text-[color:var(--hk-text,var(--fd-text))] ring-1 ring-[color:var(--hk-border,var(--fd-border))] hover:bg-[color:var(--hk-soft,var(--fd-mint))]",
    danger:
      "bg-red-500/10 text-red-700 ring-1 ring-red-500/30 hover:bg-red-500/15",
    ghost:
      "text-[color:var(--hk-accent,var(--fd-primary))] hover:bg-[color:var(--hk-soft,var(--fd-mint))]",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function HkInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 text-sm font-medium text-[color:var(--hk-text,var(--fd-text))] outline-none transition placeholder:text-[color:var(--hk-muted,var(--fd-muted))] focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15 ${props.className ?? ""}`}
    />
  );
}

export function HkTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-xl border border-[color:var(--hk-border,var(--fd-border))] bg-[color:var(--hk-page,var(--fd-bg))] px-3.5 py-3 text-sm font-medium text-[color:var(--hk-text,var(--fd-text))] outline-none transition placeholder:text-[color:var(--hk-muted,var(--fd-muted))] focus:border-[#1F6B43] focus:ring-2 focus:ring-[#1F6B43]/15 ${props.className ?? ""}`}
    />
  );
}

export function HkError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-500/20">
      {message}
    </p>
  );
}

export function HkLabel({
  children,
  hint,
}: {
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted,var(--fd-muted))]">
        {children}
      </span>
      {hint ? (
        <span className="mt-0.5 block text-xs font-normal normal-case tracking-normal text-[color:var(--hk-muted,var(--fd-muted))]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

export function useHkLocale() {
  const { locale } = useI18n();
  return locale === "fr";
}

export function paymentTone(
  status: string,
): "ok" | "warn" | "danger" | "neutral" {
  if (status === "paid") return "ok";
  if (status === "reserved" || status === "pending_verify") return "warn";
  if (status === "failed" || status === "expired") return "danger";
  return "neutral";
}
