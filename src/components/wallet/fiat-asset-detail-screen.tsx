"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import { FIAT_ASSET_LABEL, type WalletFiatAsset } from "@/lib/wallet-fiat-assets";
import { fiatDepositHref, fiatWithdrawHref } from "@/lib/wallet-money-routes";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import { ActivityListControls } from "@/components/wallet/activity-list-controls";
import { WalletHistoryRow } from "@/components/wallet/wallet-history-row";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";
import {
  IconArrowDown,
  IconArrowUp,
  IconSend,
} from "@/components/icons/flow-icons";

type FeedResponse = {
  balance: { display: string; valueUsd: string } | null;
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function FiatAssetDetailScreen({ asset }: { asset: WalletFiatAsset }) {
  const { t, locale } = useI18n();
  const lang = locale === "fr" ? "fr" : "en";
  const [hidden, setHidden] = useState(false);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({
      sort,
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(`/api/wallet/${asset}/activity?${q}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    setData(res.ok && json ? (json as FeedResponse) : null);
    setLoading(false);
  }, [asset, sort, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const subtitle = FIAT_ASSET_LABEL[asset][lang];

  return (
    <div className="wallet-theme pb-8">
      <WalletSubpageHeader title={asset} subtitle={subtitle} backHref="/app/wallet" />

      <section className="wallet-hero mt-2 p-4">
        <div className="flex items-center gap-3">
          <WalletAssetIcon asset={asset} size={48} />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
              {t("wallet_asset_balance")}
            </p>
            <p className="mt-0.5 text-[1.65rem] font-bold tabular-nums text-[color:var(--fd-text)]">
              {hidden ? "••••" : (data?.balance?.display ?? "—")}
            </p>
            <p className="text-sm tabular-nums text-[color:var(--fd-muted)]">
              {hidden ? "••••" : (data?.balance?.valueUsd ?? "")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="mt-2 text-[10px] font-semibold text-[color:var(--fd-primary)]"
        >
          {hidden ? t("show_balance") : t("hide_balance")}
        </button>
      </section>

      <div className="mt-4 flex justify-between gap-2">
        <ActionChip
          href={fiatDepositHref(asset)}
          label={t("wallet_action_deposit")}
          icon={<IconArrowDown className="h-5 w-5" />}
          accent="amber"
        />
        <ActionChip
          href={`/app/wallet/transfer?asset=${asset}`}
          label={t("wallet_action_send")}
          icon={<IconSend className="h-5 w-5" />}
        />
        <ActionChip
          href={fiatWithdrawHref(asset)}
          label={t("wallet_action_withdraw")}
          icon={<IconArrowUp className="h-5 w-5" />}
        />
        <ActionChip
          href={`/app/wallet/swap?from=${asset}&to=USDT`}
          label={t("wallet_swap_title")}
          icon={<IconSwapBrand className="h-5 w-5" />}
        />
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("wallet_recent_activity")}
      </p>

      <ActivityListControls
        sort={sort}
        pageSize={pageSize}
        page={page}
        totalPages={data?.totalPages ?? 1}
        total={data?.total ?? 0}
        onSortChange={(s) => {
          setSort(s);
          setPage(1);
        }}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
        onPageChange={setPage}
      />

      {loading ? (
        <div className="mt-3 space-y-2" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-[color:var(--fd-mint)]/50" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <p className="fd-card mt-3 py-8 text-center text-sm text-[color:var(--fd-muted)]">
          {t("wallet_history_empty")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {data.items.map((item) => (
            <WalletHistoryRow key={item.id} item={item} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionChip({
  href,
  label,
  icon,
  accent,
}: {
  href: string;
  label: string;
  icon: ReactNode;
  accent?: "amber";
}) {
  const circle =
    accent === "amber"
      ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-900"
      : "bg-gradient-to-br from-emerald-100 to-emerald-200 text-[color:var(--fd-primary)]";
  return (
    <Link href={href} className="flex min-w-0 flex-1 flex-col items-center gap-1.5 active:scale-95">
      <span className={`flex h-11 w-11 items-center justify-center rounded-full shadow-sm ${circle}`}>
        {icon}
      </span>
      <span className="max-w-[4rem] truncate text-center text-[9px] font-bold text-[color:var(--fd-text)]">
        {label}
      </span>
    </Link>
  );
}
