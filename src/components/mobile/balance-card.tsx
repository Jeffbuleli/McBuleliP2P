"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";
import { WalletRealmToggle } from "@/components/wallet/wallet-realm-toggle";
import { IconHistory } from "@/components/wallet/wallet-action-grid";

function formatHidden() {
  return "••••";
}

export function BalanceCard({
  locale,
  totalEquivDisplay,
}: {
  locale: Locale;
  totalEquivDisplay: string;
}) {
  const d = getDictionary(locale);
  const [hidden, setHidden] = useState(false);

  return (
    <section className="wallet-hero wallet-hero-total p-4" aria-label={d.balance_estimated_total}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-brown)]/80">
          {d.balance_estimated_total}
        </p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--fd-muted)] transition active:scale-95"
          aria-pressed={hidden}
          aria-label={hidden ? d.show_balance : d.hide_balance}
        >
          {hidden ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      <p className="mt-1 text-center text-[1.65rem] font-black leading-tight tabular-nums tracking-tight text-[color:var(--fd-primary-dark)]">
        {hidden ? formatHidden() : totalEquivDisplay}
      </p>

      <WalletRealmToggle
        variant="home"
        labels={{
          crypto: d.wallet_section_crypto,
          swap: d.wallet_swap_title,
        }}
      />

      <Link
        href="/app/wallet/history"
        className="wallet-history-banner mt-3 flex items-center gap-3 px-3 py-2.5 active:scale-[0.99]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/80 text-[color:var(--fd-primary)] shadow-sm">
          <IconHistory className="h-4 w-4" />
        </span>
        <span className="flex-1 text-sm font-bold text-[color:var(--fd-primary-dark)]">{d.wallet_link_history}</span>
        <span className="text-[color:var(--fd-primary)]">→</span>
      </Link>
    </section>
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
        d="M2.5 12c1.5 4.5 5.7 8 9.5 8s8-3.5 9.5-8c-1.5-4.5-5.7-8-9.5-8s-8 3.5-9.5 8z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
