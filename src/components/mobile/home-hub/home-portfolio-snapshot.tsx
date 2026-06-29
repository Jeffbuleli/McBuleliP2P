"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locale";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";
import { getDictionary } from "@/i18n/messages";

function formatHidden() {
  return "••••";
}

export function HomePortfolioSnapshot({
  locale,
  totalDisplay,
  assetChips,
}: {
  locale: Locale;
  totalDisplay: string;
  assetChips: { code: string; balance: string }[];
}) {
  const d = getDictionary(locale);
  const fr = locale === "fr";
  const [hidden, setHidden] = useState(false);

  return (
    <HudFrame accent="green" className={`wallet-hero wallet-hero-total ${HUD_PANEL_LG} p-4`}>
      <section aria-label={d.balance_estimated_total}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-brown)]/80">
          {d.balance_estimated_total}
        </p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[color:var(--fd-muted)] transition active:scale-95"
          aria-pressed={hidden}
          aria-label={hidden ? d.show_balance : d.hide_balance}
        >
          {hidden ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>

      <p className="mt-1 text-center text-[1.45rem] font-black leading-tight tabular-nums tracking-tight text-[color:var(--fd-primary-dark)]">
        {hidden ? formatHidden() : totalDisplay}
      </p>

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {assetChips.map((chip) => (
          <span
            key={chip.code}
            className="rounded-full border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]/80 px-2.5 py-1 text-[10px] font-bold tabular-nums text-[color:var(--fd-text)]"
          >
            <span className="text-[color:var(--fd-muted)]">{chip.code}</span>{" "}
            {hidden ? "••••" : chip.balance.replace(/\s+(USDT|Pi|USD|CDF)$/, "")}
          </span>
        ))}
      </div>

      <Link
        href="/app/wallet"
        className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-emerald-400/45 bg-emerald-500/15 text-sm font-bold text-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.12)] transition active:scale-[0.99] hover:bg-emerald-500/25"
      >
        {fr ? "Voir le portefeuille →" : "View wallet →"}
      </Link>
      </section>
    </HudFrame>
  );
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 3l18 18M10.5 10.5a2 2 0 102.5 2.5M6.4 6.4C4.6 7.8 3.3 9.6 2.5 12c1.5 4.5 5.7 8 9.5 8 1.2 0 2.3-.3 3.4-.8M9.9 5.1A9.2 9.2 0 0112.5 5c3.8 0 8 3.5 9.5 8a9.3 9.3 0 01-1.1 2.1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M2.5 12C4.2 7.5 8 5 12 5s7.8 2.5 9.5 7c-1.7 4.5-5.5 7-9.5 7s-7.8-2.5-9.5-7z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
