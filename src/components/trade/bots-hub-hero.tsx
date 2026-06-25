"use client";

import type { ReactNode } from "react";
import type { Messages } from "@/i18n/messages";
import { IconAnalysis, IconBot, IconCron } from "@/components/trade/bot-visual-icons";

function HubStackIllustration() {
  return (
    <svg
      viewBox="0 0 120 88"
      className="h-[4.5rem] w-auto shrink-0"
      aria-hidden
    >
      <defs>
        <linearGradient id="bhh-a" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--fd-primary)" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--fd-primary)" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="bhh-b" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="bhh-c" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.45" />
        </linearGradient>
      </defs>
      <rect x="8" y="52" width="104" height="28" rx="10" fill="url(#bhh-c)" opacity="0.35" />
      <rect x="14" y="46" width="92" height="28" rx="10" fill="url(#bhh-b)" opacity="0.4" />
      <rect x="20" y="40" width="80" height="28" rx="10" fill="url(#bhh-a)" opacity="0.5" />
      <path
        d="M32 54h56M32 60h40M32 66h48"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="88" cy="54" r="6" fill="white" opacity="0.85" />
      <path d="M86 54l1.5 1.5L91 52" stroke="var(--fd-primary)" strokeWidth="1.5" strokeLinecap="round" />
      <path
        d="M44 18 L60 8 L76 18 L76 34 L44 34 Z"
        fill="none"
        stroke="var(--fd-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        opacity="0.65"
      />
      <path
        d="M48 28 L56 20 L64 26 L72 18"
        stroke="#8b5cf6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BotsHubHero({
  t,
}: {
  t: (k: keyof Messages) => string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-gradient-to-br from-white via-[color:var(--fd-mint)]/40 to-white p-4 shadow-sm">
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-[color:var(--fd-primary)]/8 blur-2xl"
        aria-hidden
      />
      <div className="flex items-start gap-3">
        <HubStackIllustration />
        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[color:var(--fd-primary)]">
            {t("bots_hub_badge")}
          </p>
          <p className="mt-1 text-sm font-semibold leading-snug text-[color:var(--fd-text)]">
            {t("bots_hub_tagline")}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <LayerChip icon={<IconCron size={12} />} label="Cron" />
            <LayerChip icon={<IconAnalysis size={12} />} label="TA" />
            <LayerChip icon={<IconBot size={12} />} label="AI·BOT" />
          </div>
        </div>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("bots_binance_only")}
      </p>
    </div>
  );
}

function LayerChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--fd-border)]/80 bg-white/90 px-2 py-0.5 text-[10px] font-bold text-[color:var(--fd-text)]">
      <span className="text-[color:var(--fd-primary)]">{icon}</span>
      {label}
    </span>
  );
}
