"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";

function formatHidden() {
  return "••••";
}

export function BalanceCard({
  locale,
  totalEquivDisplay,
  usdtDisplay,
  piDisplay,
}: {
  locale: Locale;
  /** Estimated portfolio total in USD (same basis as Wallet overview, excluding staking). */
  totalEquivDisplay: string;
  usdtDisplay: string;
  piDisplay: string;
}) {
  const d = getDictionary(locale);
  const [hidden, setHidden] = useState(false);

  return (
    <section className="wallet-hero p-4" aria-label={d.balance_estimated_total}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
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
      <p className="mt-1 text-center text-[1.65rem] font-bold leading-tight tabular-nums tracking-tight text-[color:var(--fd-text)]">
        {hidden ? formatHidden() : totalEquivDisplay}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-[color:var(--fd-border)] pt-3">
        <div className="fd-card rounded-xl px-2.5 py-2 shadow-none">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
            USDT
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-[color:var(--fd-text)]">
            {hidden ? formatHidden() : usdtDisplay}
          </p>
        </div>
        <div className="fd-card rounded-xl px-2.5 py-2 shadow-none">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
            Pi
          </p>
          <p className="truncate text-xs font-semibold tabular-nums text-[color:var(--fd-text)]">
            {hidden ? formatHidden() : piDisplay}
          </p>
        </div>
      </div>

      <div className="wallet-balance-actions">
        <Link href="/app/deposit" className="wallet-balance-action wallet-balance-action-deposit">
          <span className="wallet-balance-action-icon">
            <DepositIcon />
          </span>
          <span>{d.wallet_action_deposit}</span>
        </Link>
        <Link href="/app/withdraw" className="wallet-balance-action wallet-balance-action-withdraw">
          <span className="wallet-balance-action-icon">
            <WithdrawIcon />
          </span>
          <span>{d.wallet_action_withdraw}</span>
        </Link>
        <Link href="/app/wallet/transfer" className="wallet-balance-action wallet-balance-action-send">
          <span className="wallet-balance-action-icon">
            <SendIcon />
          </span>
          <span>{d.wallet_action_send}</span>
        </Link>
      </div>
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

function DepositIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v12M8 12l4 4 4-4M5 20h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20V8M8 12l4-4 4 4M5 4h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
