"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import type { WalletActivityItem } from "@/lib/wallet-activity-feed";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { ActivityListControls } from "@/components/wallet/activity-list-controls";
import { WalletHistoryRow } from "@/components/wallet/wallet-history-row";
import { HistoryVisualIcon, IconInbox } from "@/components/icons/flow-icons";
import { IconSwapBrand } from "@/components/wallet/icon-swap-brand";
import { WalletAssetIcon } from "@/components/wallet/wallet-asset-icon";
import { WalletIconDropdown } from "@/components/wallet/wallet-icon-dropdown";
import { HUD_PANEL_LG, HudFrame } from "@/components/ui/hud-frame";

const REALM_OPTIONS = [
  { id: "", key: "wallet_history_all" as const },
  { id: "crypto", key: "wallet_section_crypto" as const },
  { id: "fiat", key: "wallet_section_fiat" as const },
] as const;

const TYPE_OPTIONS = [
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

function typeOptionIcon(id: string, visual: (typeof TYPE_OPTIONS)[number]["visual"]) {
  if (id === "swap") return <IconSwapBrand className="h-5 w-5 shrink-0" />;
  return <HistoryVisualIcon visual={visual} className="h-5 w-5 shrink-0" />;
}

export default function WalletHistoryPage() {
  const { t, locale } = useI18n();
  const searchParams = useSearchParams();
  const initialRealm = searchParams.get("realm") ?? "";
  const initialCategory = searchParams.get("category") ?? "";
  const initialAsset = searchParams.get("asset") ?? "";

  const [realm, setRealm] = useState(initialRealm);
  const [category, setCategory] = useState(initialCategory);
  const [asset, setAsset] = useState(initialAsset);
  const [sort, setSort] = useState<"newest" | "oldest">("newest");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<FeedResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRealm(initialRealm);
    setCategory(initialCategory);
    setAsset(initialAsset);
    setPage(1);
  }, [initialRealm, initialCategory, initialAsset]);

  useEffect(() => {
    if (realm === "crypto" && (asset === "USD" || asset === "CDF")) setAsset("");
    if (realm === "fiat" && (asset === "USDT" || asset === "PI")) setAsset("");
  }, [realm, asset]);

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

  const assetOptions =
    realm === "fiat" ? FIAT_ASSETS : realm === "crypto" ? CRYPTO_ASSETS : ALL_ASSETS;

  const realmDropdownOptions = useMemo(
    () =>
      REALM_OPTIONS.map((c) => ({
        id: c.id,
        label: t(c.key),
        icon:
          c.id === "crypto" ? (
            <WalletAssetIcon asset="USDT" size={22} />
          ) : c.id === "fiat" ? (
            <WalletAssetIcon asset="USD" size={22} />
          ) : (
            <HistoryVisualIcon visual="other" className="h-5 w-5 shrink-0" />
          ),
      })),
    [t],
  );

  const typeDropdownOptions = useMemo(
    () =>
      TYPE_OPTIONS.map((c) => ({
        id: c.id,
        label: t(c.key),
        icon: typeOptionIcon(c.id, c.visual),
      })),
    [t],
  );

  const assetDropdownOptions = useMemo(
    () => [
      {
        id: "",
        label: t("wallet_history_all"),
        icon: <HistoryVisualIcon visual="other" className="h-5 w-5 shrink-0" />,
      },
      ...assetOptions.map((a) => ({
        id: a,
        label: a,
        icon: <WalletAssetIcon asset={a} size={22} />,
      })),
    ],
    [assetOptions, t],
  );

  function pickAsset(next: string) {
    setAsset(next);
    setPage(1);
    if (!next) return;
    if (next === "USD" || next === "CDF") {
      if (realm === "crypto") setRealm("fiat");
    } else if (realm === "fiat") {
      setRealm("crypto");
    }
  }

  function pickRealm(next: string) {
    setRealm(next);
    setPage(1);
    if (next === "crypto" && (asset === "USD" || asset === "CDF")) setAsset("");
    if (next === "fiat" && (asset === "USDT" || asset === "PI")) setAsset("");
  }

  return (
    <div className="wallet-theme px-4 pb-10">
      <WalletSubpageHeader title={t("wallet_history_title")} backHref="/app/wallet" />

      <HudFrame accent="cyan" className={`${HUD_PANEL_LG} relative z-20 mb-4 overflow-visible`}>
        <div className="grid gap-3 overflow-visible p-3 sm:grid-cols-3">
          <WalletIconDropdown
            label={t("wallet_history_realm_label")}
            labelClass="text-amber-400/80"
            value={realm}
            onChange={pickRealm}
            options={realmDropdownOptions}
          />

          <WalletIconDropdown
            label={t("wallet_history_type_label")}
            labelClass="text-cyan-400/80"
            value={category}
            onChange={(next) => {
              setCategory(next);
              setPage(1);
            }}
            options={typeDropdownOptions}
          />

          <WalletIconDropdown
            label={t("wallet_history_asset")}
            labelClass="text-emerald-400/80"
            value={asset}
            onChange={pickAsset}
            options={assetDropdownOptions}
          />
        </div>
      </HudFrame>

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
            <div key={i} className="h-16 animate-pulse rounded-xl border border-white/8 bg-cyan-500/8" />
          ))}
        </div>
      ) : !data?.items.length ? (
        <HudFrame accent="cyan" className={`${HUD_PANEL_LG} mt-3`}>
          <div className="flex flex-col items-center p-8 text-center">
            <span
              className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/12 text-cyan-300"
              aria-hidden
            >
              <IconInbox className="h-7 w-7" />
            </span>
            <p className="text-sm font-semibold text-[color:var(--fd-muted)]">{t("wallet_history_empty")}</p>
          </div>
        </HudFrame>
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
