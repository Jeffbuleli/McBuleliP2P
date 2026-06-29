"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

type LinkProps = ComponentPropsWithoutRef<typeof Link>;

/** Shared outline CTA - matches Log in / Live prices (no solid green fill). */
export const LANDING_CTA_PRIMARY =
  "inline-flex min-h-[48px] items-center justify-center rounded-2xl border border-emerald-400/35 bg-emerald-500/[0.06] px-6 text-sm font-bold text-emerald-300 transition hover:border-emerald-300/50 hover:bg-emerald-500/12 active:scale-[0.99]";

export const LANDING_CTA_COMPACT =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-400/35 bg-emerald-500/[0.06] px-5 text-sm font-bold text-emerald-300 transition hover:border-emerald-300/50 hover:bg-emerald-500/12";

/** Small controls - rounded pills. */
export function HudTabGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`landing-scrollbar inline-flex gap-1 overflow-x-auto rounded-full bg-white/[0.04] p-1 ${className}`} role="tablist">
      {children}
    </div>
  );
}

export function HudTabButton({
  active,
  children,
  className = "",
  ...props
}: ComponentPropsWithoutRef<"button"> & { active: boolean }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition sm:px-4 ${
        active
          ? "bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-400/35"
          : "text-stone-400 hover:bg-white/8 hover:text-stone-200"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

/** Primary CTA - emerald outline (same family as secondary / outline links). */
export function HudPrimaryLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link prefetch={false} className={`${LANDING_CTA_PRIMARY} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** Medium secondary - rounded-xl outline. */
export function HudSecondaryLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      prefetch={false}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-5 text-sm font-bold text-stone-200 transition hover:border-cyan-500/30 hover:text-cyan-300 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

/** Accent tertiary - rounded-full pill. */
export function HudOutlineLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      prefetch={false}
      className={`inline-flex min-h-[48px] items-center justify-center rounded-full border border-cyan-500/25 bg-cyan-500/[0.06] px-5 text-sm font-bold text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function HudActionLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      prefetch={false}
      className={`inline-flex items-center rounded-lg border border-emerald-400/20 bg-emerald-500/[0.06] px-3 py-1.5 text-xs font-bold text-emerald-400 transition hover:border-emerald-400/35 hover:bg-emerald-500/12 ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function HudCardButton({ className = "", children, ...props }: LinkProps) {
  return (
    <Link prefetch={false} className={`${LANDING_CTA_COMPACT} ${className}`} {...props}>
      {children}
    </Link>
  );
}

/** Nav link - mono futuristic, like /about. */
export function HudNavLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      prefetch={false}
      className={`rounded-lg px-2.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-stone-400 transition hover:bg-white/5 hover:text-cyan-300 sm:text-[12px] ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}

export function HudLegalLink({ className = "", children, ...props }: LinkProps) {
  return (
    <Link
      prefetch={false}
      className={`font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500 transition hover:text-cyan-400 sm:text-[11px] ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
}
