"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BRAND_LOGO_256 } from "@/lib/brand-logo";
import { SUPPORT_X } from "@/lib/support-contact";

export function HackathonPoweredBy({ className = "" }: { className?: string }) {
  return (
    <a
      href={SUPPORT_X}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-6 flex items-center justify-center gap-2 border-t border-[color:var(--fd-border)] pt-5 text-sm font-semibold text-[color:var(--fd-text)] transition hover:text-[color:var(--fd-primary)] ${className}`}
    >
      <span className="text-xs font-medium text-[color:var(--fd-muted)]">
        Powered by
      </span>
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--fd-mint)] ring-1 ring-[color:var(--fd-primary)]/15">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={BRAND_LOGO_256}
          alt=""
          width={28}
          height={28}
          className="h-full w-full object-contain p-0.5"
        />
      </span>
      <span>McBuleli</span>
    </a>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneTitle: Record<Tone, string> = {
  neutral: "text-[color:var(--fd-text)]",
  success: "text-[color:var(--fd-primary)]",
  warning: "text-amber-800",
  danger: "text-red-700",
  info: "text-[color:var(--fd-text)]",
};

export function HackathonProcessCard({
  children,
  title,
  subtitle,
  tone = "neutral",
  icon,
  backHref = "/hackathon",
  backLabel = "← Hackathon",
  showLogo = true,
}: {
  children?: ReactNode;
  title: string;
  subtitle?: string;
  tone?: Tone;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  showLogo?: boolean;
}) {
  return (
    <div className="home-theme fd-public-light flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-white p-6 text-center shadow-sm">
        {showLogo ? (
          <div className="flex flex-col items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={BRAND_LOGO_256}
              alt="McBuleli"
              width={48}
              height={48}
              className="h-12 w-12 rounded-xl"
            />
            <p className="mt-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
              McBuleli Hackathon
            </p>
          </div>
        ) : (
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[color:var(--fd-primary)]">
            McBuleli Hackathon
          </p>
        )}

        {icon ? <div className="mt-4 flex justify-center">{icon}</div> : null}

        <h1 className={`mt-3 text-xl font-black ${toneTitle[tone]}`}>{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {subtitle}
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}

        <p className="mt-8 text-xs">
          <Link
            href={backHref}
            className="font-semibold text-[color:var(--fd-primary)]"
          >
            {backLabel}
          </Link>
        </p>

        <HackathonPoweredBy />
      </div>
    </div>
  );
}
