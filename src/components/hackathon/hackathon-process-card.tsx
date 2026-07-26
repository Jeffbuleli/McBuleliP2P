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
      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[color:var(--fd-primary)]/15">
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

const MOMO_RAILS = [
  { src: "/assets/partners/orange.png", alt: "Orange Money" },
  { src: "/assets/partners/mpesa.png", alt: "M-Pesa" },
  { src: "/assets/partners/airtel.png", alt: "Airtel Money" },
] as const;

export function HackathonMomoRailLogos({
  className = "",
  label,
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {label ? (
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--fd-muted)]">
          {label}
        </p>
      ) : null}
      <div className="flex items-center justify-center gap-2">
        {MOMO_RAILS.map((r) => (
          <span
            key={r.alt}
            className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-[color:var(--fd-border)]"
            title={r.alt}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={r.src}
              alt={r.alt}
              width={36}
              height={36}
              className="h-full w-full object-contain p-1"
            />
          </span>
        ))}
        <span
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-2 ring-1 ring-[color:var(--fd-border)]"
          title="pawaPay"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/partners/pawapay-logo.png"
            alt="pawaPay"
            width={72}
            height={28}
            className="h-5 w-auto object-contain"
          />
        </span>
      </div>
    </div>
  );
}

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const toneTitle: Record<Tone, string> = {
  neutral: "text-[color:var(--fd-text)]",
  success: "text-[color:var(--fd-primary)]",
  warning: "text-[color:var(--hk-warn-text,#92400e)]",
  danger: "text-red-600",
  info: "text-[color:var(--fd-text)]",
};

const toneRing: Record<Tone, string> = {
  neutral: "ring-[color:var(--fd-border)]",
  success: "ring-[color:var(--fd-primary)]/25",
  warning: "ring-amber-400/30",
  danger: "ring-red-400/30",
  info: "ring-[color:var(--fd-primary)]/20",
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
  showMomoRails = false,
  momoLabel,
}: {
  children?: ReactNode;
  title: string;
  subtitle?: string;
  tone?: Tone;
  icon?: ReactNode;
  backHref?: string;
  backLabel?: string;
  showLogo?: boolean;
  showMomoRails?: boolean;
  momoLabel?: string;
}) {
  return (
    <div className="relative flex min-h-[70dvh] items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(48,95,51,0.12),transparent_55%)]"
      />
      <div
        className={`relative w-full max-w-md rounded-[1.75rem] border border-[color:var(--fd-border)] bg-[color:var(--hk-surface,var(--fd-card))] p-6 text-center shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)] ring-1 ${toneRing[tone]}`}
      >
        {showLogo ? (
          <div className="flex flex-col items-center">
            <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[color:var(--fd-primary)]/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={BRAND_LOGO_256}
                alt="McBuleli"
                width={56}
                height={56}
                className="h-full w-full object-contain p-1"
              />
            </span>
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

        <h1 className={`mt-3 text-xl font-black tracking-tight ${toneTitle[tone]}`}>
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-2 text-sm leading-relaxed text-[color:var(--fd-muted)]">
            {subtitle}
          </p>
        ) : null}

        {children ? <div className="mt-5">{children}</div> : null}

        {showMomoRails ? (
          <HackathonMomoRailLogos
            className="mt-5"
            label={momoLabel}
          />
        ) : null}

        <p className="mt-8 text-center text-xs">
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
