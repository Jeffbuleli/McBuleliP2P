"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { WalletAsset } from "@/lib/wallet-types";
import {
  IconDeposit,
  IconHistory,
  IconSend,
  IconSwap,
  IconWithdraw,
  WalletActionGrid,
} from "@/components/wallet/wallet-action-grid";

const ICON: Record<WalletAsset, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
  PI_TEST: "/assets/crypto/pi.png",
  USD: "/assets/crypto/usd.png",
  CDF: "/assets/crypto/cdf.png",
};

export type WalletRowDTO = {
  asset: WalletAsset;
  title: string;
  subtitle: string;
  balanceDisplay: string;
  valueUsdApprox: string;
  depositHref: string;
  withdrawHref: string;
};

export type FiatSummaryDTO = {
  usdDisplay: string;
  cdfDisplay: string;
  usdValueUsd: string;
  cdfValueUsd: string;
};

export type StakingPromoDTO = {
  href: string;
  imageSrc?: string;
  title: string;
  tagline: string;
  cta: string;
  activeLine: string;
  lockedLabel: string;
  lockedDisplay: string;
  accruedLabel: string;
  accruedDisplay: string;
  riskShort: string;
};

export type ServicePromoDTO = {
  imageSrc?: string;
  href: string;
  title: string;
  tagline: string;
  cta: string;
  metaLine: string;
  tone: "emerald" | "amber";
  icon: "staking" | "pool" | "avec" | "loans";
};

export type WalletOverviewLabels = {
  wallet_est_total: string;
  wallet_search_placeholder: string;
  wallet_action_deposit: string;
  wallet_action_withdraw: string;
  wallet_action_send: string;
  wallet_swap_title: string;
  wallet_link_history: string;
  wallet_section_crypto: string;
  wallet_section_fiat: string;
  wallet_no_match: string;
  hide_balance: string;
  show_balance: string;
  wallet_fiat_hub_title: string;
  wallet_fiat_open_hub: string;
};

function mask() {
  return "••••••";
}

export function WalletOverview({
  labels,
  totalUsdDisplay,
  cryptoRows,
  fiat,
}: {
  labels: WalletOverviewLabels;
  totalUsdDisplay: string;
  cryptoRows: WalletRowDTO[];
  fiat: FiatSummaryDTO;
}) {
  const [q, setQ] = useState("");
  const [hidden, setHidden] = useState(false);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return cryptoRows;
    return cryptoRows.filter(
      (r) =>
        r.asset.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.subtitle.toLowerCase().includes(s),
    );
  }, [cryptoRows, q]);

  const cryptoActions = [
    { href: "/app/deposit", label: labels.wallet_action_deposit, icon: <IconDeposit />, tone: "deposit" as const },
    { href: "/app/withdraw", label: labels.wallet_action_withdraw, icon: <IconWithdraw />, tone: "withdraw" as const },
    { href: "/app/wallet/transfer", label: labels.wallet_action_send, icon: <IconSend />, tone: "send" as const },
    { href: "/app/wallet/swap?realm=crypto", label: labels.wallet_swap_title, icon: <IconSwap />, tone: "swap" as const },
  ];

  const fiatActions = [
    { href: "/app/wallet/fiat/deposit", label: labels.wallet_action_deposit, icon: <IconDeposit />, tone: "deposit" as const },
    { href: "/app/wallet/fiat/withdraw", label: labels.wallet_action_withdraw, icon: <IconWithdraw />, tone: "withdraw" as const },
    { href: "/app/wallet/transfer?asset=USD", label: labels.wallet_action_send, icon: <IconSend />, tone: "send" as const },
    { href: "/app/wallet/swap?from=USD&to=USDT", label: labels.wallet_swap_title, icon: <IconSwap />, tone: "swap" as const },
  ];

  return (
    <div className="flex flex-col gap-0 pb-2">
      <section className="wallet-hero wallet-hero-total mt-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-brown)]/80">
            {labels.wallet_est_total}
          </p>
          <div className="flex items-center gap-1">
            <Link
              href="/app/wallet/history"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] active:scale-95"
              aria-label={labels.wallet_link_history}
            >
              <IconHistory className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-[color:var(--fd-muted)] active:scale-95"
              aria-pressed={hidden}
              aria-label={hidden ? labels.show_balance : labels.hide_balance}
            >
              {hidden ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
        </div>
        <p className="mt-1 text-[1.75rem] font-black leading-tight tabular-nums text-[color:var(--fd-primary-dark)]">
          {hidden ? mask() : totalUsdDisplay}
        </p>
      </section>

      <section className="mt-4">
        <div className="wallet-section-head wallet-section-head-crypto">
          <span className="wallet-section-dot wallet-section-dot-crypto" aria-hidden />
          <h2 className="wallet-section-title">{labels.wallet_section_crypto}</h2>
        </div>
        <WalletActionGrid actions={cryptoActions} />
        <div className="mt-3">
          <label className="relative block">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--fd-muted)]">
              <SearchIcon />
            </span>
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={labels.wallet_search_placeholder}
              className="w-full rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-2.5 pl-10 pr-3 text-sm text-[color:var(--fd-text)] outline-none ring-[color:var(--fd-primary)]/30 placeholder:text-[color:var(--fd-muted)] focus:ring-2"
            />
          </label>
        </div>
        <ul className="mt-2 flex flex-col gap-2">
          {rows.length === 0 ? (
            <li className="fd-card px-4 py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {labels.wallet_no_match}
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.asset} className="wallet-asset-row fd-card p-3">
                <Link href={`/app/wallet/${row.asset}`} className="flex items-center gap-3 active:opacity-90">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                    <Image src={ICON[row.asset]} alt="" width={44} height={44} className="object-cover" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-[color:var(--fd-text)]">{row.title}</p>
                    <p className="truncate text-[10px] text-[color:var(--fd-muted)]">{row.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
                      {hidden ? mask() : row.balanceDisplay}
                    </p>
                    <p className="mt-0.5 text-[10px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
                      {hidden ? mask() : row.valueUsdApprox}
                    </p>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
        <Link
          href="/app/wallet/history?realm=crypto"
          className="mt-2 flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[color:var(--fd-primary)]"
        >
          <IconHistory className="h-3.5 w-3.5" />
          {labels.wallet_link_history}
        </Link>
      </section>

      <section className="wallet-fiat-panel mt-5 rounded-2xl p-4">
        <div className="wallet-section-head wallet-section-head-fiat">
          <span className="wallet-section-dot wallet-section-dot-fiat" aria-hidden />
          <h2 className="wallet-section-title">{labels.wallet_section_fiat}</h2>
        </div>
        <WalletActionGrid actions={fiatActions} />
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="wallet-balance-pill">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-brown)]">USD</span>
            <span className="tabular-nums">{hidden ? mask() : fiat.usdDisplay}</span>
          </span>
          <span className="wallet-balance-pill">
            <span className="text-[10px] font-bold uppercase text-[color:var(--fd-brown)]">CDF</span>
            <span className="tabular-nums">{hidden ? mask() : fiat.cdfDisplay}</span>
          </span>
        </div>
        <Link href="/app/wallet/fiat" className="wallet-fiat-hub-link mt-3 flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 active:scale-[0.99]">
          <span className="text-xs font-bold text-[color:var(--fd-brown)]">{labels.wallet_fiat_open_hub}</span>
          <span className="text-[color:var(--fd-brown)]">→</span>
        </Link>
        <Link
          href="/app/wallet/history?realm=fiat"
          className="mt-2 flex items-center justify-center gap-1.5 py-1 text-xs font-bold text-[color:var(--fd-brown)]"
        >
          <IconHistory className="h-3.5 w-3.5" />
          {labels.wallet_link_history}
        </Link>
      </section>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 3l18 18M10.5 10.5a2 2 0 102.5 2.5M6.4 6.4C4.6 7.8 3.3 9.6 2.5 12c1.5 4.5 5.7 8 9.5 8 1.2 0 2.3-.3 3.4-.8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M2.5 12c1.5 4.5 5.7 8 9.5 8s8-3.5 9.5-8c-1.5-4.5-5.7-8-9.5-8s-8 3.5-9.5 8z" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}
