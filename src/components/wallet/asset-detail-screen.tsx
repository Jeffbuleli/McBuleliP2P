"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  CRYPTO_ASSET_NETWORK_LABEL,
  type WalletCryptoAsset,
} from "@/lib/wallet-crypto-assets";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { ActivityListControls } from "@/components/wallet/activity-list-controls";
import { WalletActivityRow } from "@/components/wallet/wallet-activity-row";
import {
  IconArrowDown,
  IconArrowUp,
  IconSend,
} from "@/components/icons/flow-icons";

type FeedResponse = {
  balance: { display: string; valueUsd: string } | null;
  openDeposit: { id: string; status: string } | null;
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function AssetDetailScreen({ asset }: { asset: WalletCryptoAsset }) {
  const { t, locale } = useI18n();
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
    const res = await fetch(`/api/wallet/${asset}/activity?${q}`, {
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json) {
      setData(json as FeedResponse);
    } else {
      setData(null);
    }
    setLoading(false);
  }, [asset, sort, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const networkLabel = CRYPTO_ASSET_NETWORK_LABEL[asset] ?? asset;
  const depositHref =
    asset === "PI" ? "/app/deposit" : `/app/deposit?asset=${asset}`;
  const withdrawHref = `/app/withdraw?asset=${asset}`;
  const transferHref = `/app/wallet/transfer?asset=${asset}`;

  return (
    <div className="pb-8">
      <WalletSubpageHeader
        title={asset}
        subtitle={networkLabel}
        backHref="/app/wallet"
      />

      <section className="wallet-hero mt-2 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("wallet_asset_balance")}
        </p>
        <p className="mt-1 text-[1.65rem] font-bold tabular-nums text-[color:var(--fd-text)]">
          {hidden ? "••••" : (data?.balance?.display ?? "—")}
        </p>
        <p className="text-sm tabular-nums text-[color:var(--fd-muted)]">
          {hidden ? "••••" : (data?.balance?.valueUsd ?? "")}
        </p>
        <button
          type="button"
          onClick={() => setHidden((h) => !h)}
          className="mt-1 text-[10px] font-semibold text-[color:var(--fd-primary)]"
        >
          {hidden ? t("show_balance") : t("hide_balance")}
        </button>
      </section>

      {data?.openDeposit ? (
        <Link
          href={`/app/deposit/${data.openDeposit.id}`}
          className="fd-card mt-3 flex items-center gap-3 border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)]/80 p-3 active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--fd-primary)] text-white">
            <IconArrowDown className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">
              {t("wallet_open_deposit_title")}
            </p>
            <p className="text-xs text-[color:var(--fd-primary)]">
              {t("wallet_activity_resume")}
            </p>
          </div>
          <span className="text-[color:var(--fd-primary)]" aria-hidden>
            →
          </span>
        </Link>
      ) : null}

      <div className="mt-4 flex justify-between gap-2">
        <ActionChip
          href={depositHref}
          label={t("wallet_action_receive")}
          icon={<IconArrowDown className="h-5 w-5" />}
          accent="amber"
        />
        <ActionChip
          href={transferHref}
          label={t("wallet_action_send")}
          icon={<IconSend className="h-5 w-5" />}
        />
        <ActionChip
          href={withdrawHref}
          label={t("wallet_action_withdraw")}
          icon={<IconArrowUp className="h-5 w-5" />}
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
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[color:var(--fd-mint)]/50" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <p className="fd-card mt-3 py-8 text-center text-sm text-[color:var(--fd-muted)]">
          {t("wallet_history_empty")}
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {data.items.map((item) => (
            <WalletActivityRow key={item.id} item={item} asset={asset} locale={locale} />
          ))}
        </ul>
      )}

      {!loading && data && data.page >= data.totalPages && data.items.length > 0 ? (
        <p className="mt-6 text-center text-xs text-[color:var(--fd-muted)]">
          {t("wallet_end_of_list")}
        </p>
      ) : null}
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
    <Link
      href={href}
      className="flex min-w-0 flex-1 flex-col items-center gap-1.5 active:scale-95"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full shadow-sm ${circle}`}
      >
        {icon}
      </span>
      <span className="max-w-[4.5rem] truncate text-center text-[10px] font-bold text-[color:var(--fd-text)]">
        {label}
      </span>
    </Link>
  );
}
