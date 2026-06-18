"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { ActivityListControls } from "@/components/wallet/activity-list-controls";
import { WalletHistoryRow } from "@/components/wallet/wallet-history-row";
import { HistoryVisualIcon, IconInbox } from "@/components/icons/flow-icons";

const REALM_CHIPS = [
  { id: "", key: "wallet_history_all" as const },
  { id: "crypto", key: "wallet_section_crypto" as const },
  { id: "fiat", key: "wallet_section_fiat" as const },
] as const;

const TYPE_CHIPS = [
  { id: "", key: "wallet_history_all" as const, visual: "other" as const },
  { id: "receive", key: "wallet_history_cat_receive" as const, visual: "receive" as const },
  { id: "send", key: "wallet_history_cat_send" as const, visual: "send" as const },
  { id: "withdraw", key: "wallet_history_cat_withdraw" as const, visual: "withdraw" as const },
  { id: "swap", key: "wallet_history_cat_swap" as const, visual: "swap" as const },
  { id: "p2p", key: "wallet_history_cat_p2p" as const, visual: "p2p" as const },
] as const;

const CRYPTO_ASSETS = ["USDT", "PI"] as const;
const FIAT_ASSETS = ["USD", "CDF"] as const;
const ALL_ASSETS = [...CRYPTO_ASSETS, ...FIAT_ASSETS] as const;

type FeedResponse = {
  items: WalletActivityItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export default function WalletHistoryPage() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const initialRealm = searchParams.get("realm") ?? "";
  const initialCategory = searchParams.get("category") ?? "";

  const [realm, setRealm] = useState(initialRealm);
  const [category, setCategory] = useState(initialCategory);
  const [asset, setAsset] = useState("");
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRealm(initialRealm);
    setCategory(initialCategory);
    setPage(1);
  }, [initialRealm, initialCategory]);

  const load = useCallback(async () => {
    setLoading(true);
    const q = new URLSearchParams({ sort, page: String(page), pageSize: String(pageSize) });
    if (realm) q.set("realm", realm);
    if (category) q.set("category", category);
    if (asset) q.set("asset", asset);
    const res = await fetch(`/api/wallet/history/feed?${q.toString()}`, { cache: "no-store" });
    const json = await res.json().catch(() => null);
    setData(res.ok && json ? (json as FeedResponse) : null);
    setLoading(false);
  }, [realm, category, asset, sort, page, pageSize]);

  useEffect(() => {
    void load();
  }, [load]);

  const assetChips =
    realm === "fiat" ? FIAT_ASSETS : realm === "crypto" ? CRYPTO_ASSETS : ALL_ASSETS;

  return (
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={t("wallet_history_title")} backHref="/app/wallet" />

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("wallet_history_realm_label")}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {REALM_CHIPS.map((c) => {
          const active = realm === c.id;
          return (
            <button
              key={c.id || "all"}
              type="button"
              onClick={() => {
                setRealm(c.id);
                setAsset("");
                setPage(1);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                  ? "bg-[color:var(--fd-brown)] text-white"
                  : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
              }`}
            >
              {t(c.key)}
            </button>
          );
        })}
      </div>

      <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("wallet_history_type_label")}
      </p>
      <div className="mb-3 flex flex-wrap gap-2">
        {TYPE_CHIPS.map((c) => {
          const active = category === c.id;
          return (
            <button
              key={c.id || "all-type"}
              type="button"
              onClick={() => {
                setCategory(c.id);
                setPage(1);
              }}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold ${
                active
                  ? "bg-[color:var(--fd-primary)] text-white"
                  : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
              }`}
            >
              {c.id ? <HistoryVisualIcon visual={c.visual} className="h-3.5 w-3.5" /> : null}
              {t(c.key)}
            </button>
          );
        })}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setAsset("");
            setPage(1);
          }}
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            !asset
              ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/25"
              : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
          }`}
        >
          {t("wallet_history_all")}
        </button>
        {assetChips.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => {
              setAsset(a);
              setPage(1);
            }}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              asset === a
                ? "bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)] ring-1 ring-[color:var(--fd-primary)]/25"
                : "bg-[color:var(--fd-card)] text-[color:var(--fd-muted)] ring-1 ring-[color:var(--fd-border)]"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

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
        <div className="fd-card mt-3 flex flex-col items-center p-8 text-center">
          <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]" aria-hidden>
            <IconInbox className="h-7 w-7" />
          </span>
          <p className="text-sm font-semibold text-[color:var(--fd-muted)]">{t("wallet_history_empty")}</p>
        </div>
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
