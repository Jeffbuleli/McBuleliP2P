"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import type { WalletAsset } from "@/lib/wallet-types";
import { IconHistory } from "@/components/wallet/wallet-action-grid";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";
import { WalletAssetIcon, assetDetailHref } from "@/components/wallet/wallet-asset-icon";

export type WalletRowDTO = {
  asset: WalletAsset;
  title: string;
  subtitle: string;
  balanceDisplay: string;
  valueUsdApprox: string;
  depositHref: string;
  withdrawHref: string;
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
  wallet_link_history: string;
  wallet_section_crypto: string;
  wallet_section_fiat: string;
  wallet_swap_title: string;
  wallet_no_match: string;
  hide_balance: string;
  show_balance: string;
  wallet_assets_title: string;
};

function mask() {
  return "••••••";
}

export function WalletOverview({
  labels,
  totalUsdDisplay,
  assetRows,
}: {
  labels: WalletOverviewLabels;
  totalUsdDisplay: string;
  assetRows: WalletRowDTO[];
}) {
  const pathname = usePathname();
  const onWallet = pathname === "/app/wallet";
  const [q, setQ] = useState("");
  const [hidden, setHidden] = useState(false);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return assetRows;
    return assetRows.filter(
      (r) =>
        r.asset.toLowerCase().includes(s) ||
        r.title.toLowerCase().includes(s) ||
        r.subtitle.toLowerCase().includes(s),
    );
  }, [assetRows, q]);

  return (
    <div className="flex flex-col gap-0 pb-2">
      <section className="wallet-hero wallet-hero-total mt-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--fd-brown)]/80">
            {labels.wallet_est_total}
          </p>
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
        <p className="mt-1 text-[1.75rem] font-black leading-tight tabular-nums text-[color:var(--fd-primary-dark)]">
          {hidden ? mask() : totalUsdDisplay}
        </p>

        <div className="wallet-realm-toggle mt-4 grid grid-cols-3 gap-2">
          <Link
            href="/app/wallet"
            onClick={(e) => {
              if (onWallet) {
                e.preventDefault();
                document.getElementById("wallet-assets")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }}
            className={`wallet-realm-btn wallet-realm-btn-crypto ${onWallet ? "wallet-realm-btn-active" : ""}`}
            aria-current={onWallet ? "page" : undefined}
          >
            {labels.wallet_section_crypto}
          </Link>
          <Link
            href="/app/wallet/fiat"
            className={`wallet-realm-btn wallet-realm-btn-fiat ${pathname.startsWith("/app/wallet/fiat") ? "wallet-realm-btn-active" : ""}`}
            aria-current={pathname.startsWith("/app/wallet/fiat") ? "page" : undefined}
          >
            {labels.wallet_section_fiat}
          </Link>
          <Link
            href="/app/wallet/swap"
            className={`wallet-realm-btn wallet-realm-btn-swap flex items-center justify-center gap-1.5 ${pathname.startsWith("/app/wallet/swap") ? "wallet-realm-btn-active" : ""}`}
            aria-current={pathname.startsWith("/app/wallet/swap") ? "page" : undefined}
          >
            <IconSwapBrand className="h-4 w-4 shrink-0" />
            <span>{labels.wallet_swap_title}</span>
          </Link>
        </div>
      </section>

      <Link href="/app/wallet/history" className="wallet-history-banner mx-0 mt-3 flex items-center gap-3 px-4 py-3 active:scale-[0.99]">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/80 text-[color:var(--fd-primary)] shadow-sm">
          <IconHistory className="h-5 w-5" />
        </span>
        <span className="flex-1 text-sm font-bold text-[color:var(--fd-primary-dark)]">{labels.wallet_link_history}</span>
        <span className="text-[color:var(--fd-primary)]">→</span>
      </Link>

      <section id="wallet-assets" className="mt-4 scroll-mt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {labels.wallet_assets_title}
        </p>
        <label className="relative mb-2 block">
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

        <ul className="flex flex-col gap-2">
          {rows.length === 0 ? (
            <li className="fd-card px-4 py-6 text-center text-sm text-[color:var(--fd-muted)]">
              {labels.wallet_no_match}
            </li>
          ) : (
            rows.map((row) => (
              <li key={row.asset} className="wallet-asset-row fd-card p-3">
                <Link href={assetDetailHref(row.asset)} className="flex items-center gap-3 active:opacity-90">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-white shadow-sm">
                    <WalletAssetIcon asset={row.asset} size={44} className="h-full w-full" />
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
