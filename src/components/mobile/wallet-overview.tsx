"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { WalletAsset } from "@/lib/wallet-types";

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

export type WalletOverviewLabels = {
  wallet_title: string;
  wallet_asset_balance: string;
  wallet_col_usd: string;
  wallet_no_match: string;
  wallet_asset_list: string;
  wallet_est_total: string;
  wallet_search_placeholder: string;
  wallet_action_deposit: string;
  wallet_action_withdraw: string;
  wallet_action_send: string;
  wallet_link_history: string;
  hide_balance: string;
  show_balance: string;
  wallet_crypto_only_hint: string;
};

export type StakingPromoDTO = {
  href: string;
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
  href: string;
  title: string;
  tagline: string;
  cta: string;
  metaLine: string;
  tone: "emerald" | "amber";
  icon: "staking" | "pool" | "likelimba" | "avec" | "loans";
};

function mask() {
  return "••••••";
}

export function WalletOverview({
  labels,
  totalUsdDisplay,
  cryptoRows,
}: {
  labels: WalletOverviewLabels;
  totalUsdDisplay: string;
  cryptoRows: WalletRowDTO[];
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

  return (
    <div className="flex flex-col gap-0 pb-2">
      <section className="wallet-hero mt-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {labels.wallet_est_total}
          </p>
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-[color:var(--fd-muted)] active:scale-95"
            aria-pressed={hidden}
            aria-label={hidden ? labels.show_balance : labels.hide_balance}
          >
            {hidden ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        <p className="mt-1 text-[1.65rem] font-bold leading-tight tabular-nums text-[color:var(--fd-text)]">
          {hidden ? mask() : totalUsdDisplay}
        </p>

        <div className="wallet-balance-actions">
          <Link href="/app/deposit" className="wallet-balance-action wallet-balance-action-deposit">
            <span className="wallet-balance-action-icon">
              <DepositIcon />
            </span>
            <span>{labels.wallet_action_deposit}</span>
          </Link>
          <Link href="/app/withdraw" className="wallet-balance-action wallet-balance-action-withdraw">
            <span className="wallet-balance-action-icon">
              <WithdrawIcon />
            </span>
            <span>{labels.wallet_action_withdraw}</span>
          </Link>
          <Link href="/app/wallet/transfer" className="wallet-balance-action wallet-balance-action-send">
            <span className="wallet-balance-action-icon">
              <SendIcon />
            </span>
            <span>{labels.wallet_action_send}</span>
          </Link>
        </div>
      </section>

      <div className="mt-4">
        <label className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--fd-muted)]">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.wallet_search_placeholder}
            className="w-full rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] py-3 pl-10 pr-14 text-sm text-[color:var(--fd-text)] outline-none ring-[color:var(--fd-primary)]/30 placeholder:text-[color:var(--fd-muted)] focus:ring-2"
          />
          <Link
            href="/app/wallet/history"
            className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] shadow-sm active:scale-95"
            aria-label={labels.wallet_link_history}
          >
            <HistoryIcon />
          </Link>
        </label>
      </div>

      <ul className="mt-3 flex flex-col gap-2">
        {rows.length === 0 ? (
          <li className="fd-card px-4 py-8 text-center text-sm text-[color:var(--fd-muted)]">
            {labels.wallet_no_match}
          </li>
        ) : (
          rows.map((row) => (
            <li key={row.asset} className="fd-card p-3">
              <Link
                href={`/app/wallet/${row.asset}`}
                className="flex items-center gap-3 active:opacity-90"
              >
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                  <Image
                    src={ICON[row.asset]}
                    alt=""
                    width={44}
                    height={44}
                    className="object-cover"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-[color:var(--fd-text)]">
                    {row.title}
                  </p>
                  <p className="truncate text-[11px] text-[color:var(--fd-muted)]">
                    {row.subtitle}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
                    {hidden ? mask() : row.balanceDisplay}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold tabular-nums text-[color:var(--fd-muted)]">
                    {hidden ? mask() : row.valueUsdApprox}
                  </p>
                </div>
              </Link>
              <div className="mt-3 flex justify-end gap-2">
                <Link
                  href={row.depositHref}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900 shadow-sm active:scale-95"
                  title={labels.wallet_action_deposit}
                  aria-label={labels.wallet_action_deposit}
                >
                  <DepositIcon small />
                </Link>
                <Link
                  href={row.withdrawHref}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 text-[color:var(--fd-primary)] shadow-sm active:scale-95"
                  title={labels.wallet_action_withdraw}
                  aria-label={labels.wallet_action_withdraw}
                >
                  <WithdrawIcon small />
                </Link>
                <Link
                  href={`/app/wallet/transfer?asset=${row.asset}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-stone-100 to-stone-200 text-[color:var(--fd-primary-dark)] shadow-sm active:scale-95"
                  title={labels.wallet_action_send}
                  aria-label={labels.wallet_action_send}
                >
                  <SendIcon small />
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>

    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 12a8 8 0 1116 0 8 8 0 01-16 0z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
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

function DepositIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
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

function WithdrawIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
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

function SendIcon({ small }: { small?: boolean }) {
  const s = small ? 16 : 22;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
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
