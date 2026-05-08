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
  wallet_balance_hint: string;
  wallet_est_total: string;
  wallet_tab_crypto: string;
  wallet_tab_account: string;
  wallet_tab_crypto_sub: string;
  wallet_tab_account_sub: string;
  wallet_search_placeholder: string;
  wallet_add_funds: string;
  wallet_quick_withdraw: string;
  wallet_quick_send: string;
  wallet_row_send: string;
  wallet_link_history: string;
  wallet_fees_expand: string;
  wallet_fees_collapse: string;
  wallet_fees_title: string;
  wallet_hub_actions: string;
  hide_balance: string;
  show_balance: string;
  feeBulletLines: string[];
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
};

function mask() {
  return "••••••";
}

export function WalletOverview({
  labels,
  totalUsdDisplay,
  cryptoRows,
  fiatRows,
}: {
  labels: WalletOverviewLabels;
  totalUsdDisplay: string;
  cryptoRows: WalletRowDTO[];
  fiatRows: WalletRowDTO[];
}) {
  const [tab, setTab] = useState<"crypto" | "account">("crypto");
  const [q, setQ] = useState("");
  const [hidden, setHidden] = useState(false);
  const [feesOpen, setFeesOpen] = useState(false);

  const baseRows = tab === "crypto" ? cryptoRows : fiatRows;
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return baseRows;
    return baseRows.filter(
      (r) =>
        r.asset.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.subtitle.toLowerCase().includes(s),
    );
  }, [baseRows, q]);

  const addFundsHref =
    tab === "crypto" ? "/app/deposit" : "/app/wallet/fiat/deposit";
  const withdrawHrefTop =
    tab === "crypto" ? "/app/withdraw" : "/app/wallet/fiat/withdraw";

  return (
    <div className="flex flex-col gap-0 pb-6">
      <header className="mb-1 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[color:var(--mb-text)] dark:text-stone-50">
            {labels.wallet_title}
          </h1>
          <p className="mt-0.5 text-xs leading-snug text-[color:var(--mb-muted)] dark:text-stone-400">
            {labels.wallet_balance_hint}
          </p>
        </div>
        <Link
          href="/app/wallet/history"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl border border-stone-700/50 bg-stone-950/60 text-emerald-200 shadow-lg shadow-black/25 backdrop-blur-md transition active:scale-95 hover:bg-stone-900/60"
          aria-label={labels.wallet_link_history}
        >
          <HistoryIcon />
        </Link>
      </header>

      <section className="mt-3 rounded-3xl border border-[color:var(--mb-border)] bg-[color:var(--mb-surface)]/95 p-4 shadow-sm ring-1 ring-stone-900/[0.04] dark:border-stone-700 dark:bg-stone-900/95 dark:ring-white/[0.06]">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
            {labels.wallet_est_total}
          </p>
          <button
            type="button"
            onClick={() => setHidden((h) => !h)}
            className="flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg text-stone-500 transition active:scale-95 dark:text-stone-400"
            aria-pressed={hidden}
            aria-label={hidden ? labels.show_balance : labels.hide_balance}
          >
            {hidden ? <EyeIcon /> : <EyeOffIcon />}
          </button>
        </div>
        <p className="mt-1 text-[1.65rem] font-bold leading-tight tabular-nums tracking-tight text-emerald-900 dark:text-emerald-100">
          {hidden ? mask() : totalUsdDisplay}
        </p>
        <p className="mt-2 text-[11px] text-[color:var(--mb-muted)] dark:text-stone-500">
          {labels.wallet_hub_actions}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Link
            href={addFundsHref}
            className="flex min-h-[48px] items-center justify-center rounded-2xl bg-[color:var(--mb-secondary)] px-2 text-center text-sm font-bold text-white shadow-md shadow-emerald-900/15 active:scale-[0.98] dark:bg-emerald-600"
          >
            {labels.wallet_add_funds}
          </Link>
          <Link
            href={withdrawHrefTop}
            className="flex min-h-[48px] items-center justify-center rounded-2xl border-2 border-[color:var(--mb-primary)]/35 bg-white px-2 text-center text-sm font-bold text-[color:var(--mb-primary)] active:scale-[0.98] dark:border-amber-900/40 dark:bg-stone-800 dark:text-amber-100"
          >
            {labels.wallet_quick_withdraw}
          </Link>
          <Link
            href="/app/wallet/transfer"
            className="flex min-h-[48px] items-center justify-center rounded-2xl border border-stone-200 bg-stone-50/90 px-2 text-center text-sm font-semibold text-stone-800 active:scale-[0.98] dark:border-stone-600 dark:bg-stone-800/80 dark:text-stone-100"
          >
            {labels.wallet_quick_send}
          </Link>
        </div>
      </section>

      <div className="mt-5 flex rounded-2xl bg-stone-100/90 p-1 dark:bg-stone-800/80">
        <button
          type="button"
          onClick={() => setTab("crypto")}
          className={`relative flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition ${
            tab === "crypto"
              ? "bg-white text-emerald-900 shadow-sm dark:bg-stone-900 dark:text-emerald-100"
              : "text-stone-600 dark:text-stone-400"
          }`}
        >
          {labels.wallet_tab_crypto}
          <span className="mt-0.5 block text-[10px] font-normal opacity-80">
            {labels.wallet_tab_crypto_sub}
          </span>
          {tab === "crypto" ? (
            <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          ) : null}
        </button>
        <button
          type="button"
          onClick={() => setTab("account")}
          className={`relative flex-1 rounded-xl py-2.5 text-center text-sm font-bold transition ${
            tab === "account"
              ? "bg-stone-950/70 text-emerald-100 shadow-lg shadow-black/20"
              : "text-stone-600 dark:text-stone-400"
          }`}
        >
          {labels.wallet_tab_account}
          <span className="mt-0.5 block text-[10px] font-normal opacity-80">
            {labels.wallet_tab_account_sub}
          </span>
          {tab === "account" ? (
            <span className="absolute bottom-0 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-emerald-600 dark:bg-emerald-400" />
          ) : null}
        </button>
      </div>

      <div className="mt-3">
        <label className="relative block">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={labels.wallet_search_placeholder}
            className="w-full rounded-2xl border border-stone-700 bg-stone-900/70 py-3 pl-10 pr-3 text-sm text-stone-100 outline-none ring-emerald-500/40 placeholder:text-stone-500 focus:ring-2"
          />
        </label>
      </div>

      <div className="mt-2 overflow-hidden rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 border-b border-stone-800/80 px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-stone-400">
          <span>{labels.wallet_asset_list}</span>
          <span className="text-right tabular-nums">{labels.wallet_asset_balance}</span>
          <span className="min-w-[3.5rem] text-right tabular-nums">{labels.wallet_col_usd}</span>
        </div>
        <ul className="divide-y divide-stone-800/80">
          {rows.length === 0 ? (
            <li className="px-3 py-8 text-center text-sm text-stone-400">
              {labels.wallet_no_match}
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.asset} className="px-3 py-3">
                <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-stone-700/70">
                      <Image
                        src={ICON[row.asset]}
                        alt=""
                        width={40}
                        height={40}
                        className="object-cover"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-stone-50">
                        {row.title}
                      </p>
                      <p className="truncate text-[11px] text-stone-400">
                        {row.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-semibold tabular-nums text-stone-100">
                      {hidden ? mask() : row.balanceDisplay}
                    </p>
                  </div>
                  <div className="min-w-[3.5rem] text-right">
                    <p className="text-xs font-semibold tabular-nums text-stone-300">
                      {hidden ? mask() : row.valueUsdApprox}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex flex-wrap justify-end gap-1.5">
                  <Link
                    href={row.depositHref}
                    className="rounded-lg bg-emerald-700/90 px-2.5 py-1.5 text-[11px] font-bold text-white active:scale-95"
                  >
                    {labels.wallet_add_funds}
                  </Link>
                  <Link
                    href={row.withdrawHref}
                    className="rounded-lg border border-[color:var(--mb-primary)]/30 px-2.5 py-1.5 text-[11px] font-bold text-[color:var(--mb-primary)] dark:border-amber-800/40 dark:text-amber-100"
                  >
                    {labels.wallet_quick_withdraw}
                  </Link>
                  <Link
                    href={`/app/wallet/transfer?asset=${row.asset}`}
                    className="rounded-lg border border-stone-200 px-2.5 py-1.5 text-[11px] font-semibold text-stone-700 dark:border-stone-600 dark:text-stone-200"
                  >
                    {labels.wallet_row_send}
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setFeesOpen((o) => !o)}
        className="mt-4 flex min-h-[48px] w-full items-center justify-between rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 px-4 text-left text-sm font-semibold text-stone-100 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:bg-stone-900/50 active:scale-[0.99]"
      >
        <span>{labels.wallet_fees_title}</span>
        <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          {feesOpen ? labels.wallet_fees_collapse : labels.wallet_fees_expand}
        </span>
      </button>
      {feesOpen ? (
        <ul className="mt-2 space-y-1.5 rounded-[1.75rem] border border-stone-700/50 bg-stone-950/65 p-4 text-sm text-stone-300 shadow-2xl shadow-black/40 backdrop-blur-xl">
          {labels.feeBulletLines.map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-emerald-600 dark:text-emerald-400">·</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <Link
        href="/app/wallet/history"
        className="mt-4 block text-center text-sm font-semibold text-emerald-800 underline underline-offset-2 dark:text-emerald-400"
      >
        {labels.wallet_link_history}
      </Link>
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
