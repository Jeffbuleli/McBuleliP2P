"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  IconCheck,
  IconExternalLink,
} from "@/components/community/community-inline-icons";
import { buildersTierVisual } from "@/lib/builders/builders-visual";

type TierRow = {
  tier: string;
  priceUsd: number;
  priceMcb: number | null;
  priceMcbLegacy?: number;
  rank: number;
  feePerksUnlocked?: boolean;
};

type Membership = {
  id: string;
  tier: string;
  status: string;
  paidMcb: string;
  txHash: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  createdAt: string;
};

type Catalog = {
  preview: boolean;
  enabled: boolean;
  badgeMonths: number;
  treasuryAddress: string | null;
  dexUrl: string | null;
  quoteMode?: string;
  mcbUsdRate?: number | null;
  rateSource?: string;
  feePerksMinMcbUsd?: number;
  tiers: TierRow[];
};

type Payload = {
  catalog: Catalog;
  kycApproved: boolean;
  active: Membership | null;
  pending: Membership | null;
  history: Membership[];
};

function tierLabel(
  t: (k: keyof import("@/i18n/messages").Messages) => string,
  tier: string,
): string {
  switch (tier) {
    case "bronze":
      return t("builders_tier_bronze");
    case "silver":
      return t("builders_tier_silver");
    case "gold":
      return t("builders_tier_gold");
    case "diamond":
      return t("builders_tier_diamond");
    case "platinum":
      return t("builders_tier_platinum");
    default:
      return tier;
  }
}

function IconShield({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3l8 4v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V7l8-4z" />
    </svg>
  );
}

function IconBadge({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="9" r="5" />
      <path d="M8.5 13.5L7 21l5-2 5 2-1.5-7.5" />
    </svg>
  );
}

function IconClock({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

export function BuildersProgramClient() {
  const { t, locale } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const [data, setData] = useState<Payload | null>(null);
  const [loadErr, setLoadErr] = useState(false);
  const [tier, setTier] = useState("bronze");
  const [txHash, setTxHash] = useState("");
  const [wallet, setWallet] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoadErr(false);
    const res = await fetch("/api/builders/me", { credentials: "same-origin" });
    if (!res.ok) {
      setLoadErr(true);
      setData(null);
      return;
    }
    const json = (await res.json()) as Payload;
    setData(json);
    if (json.active) {
      const next = json.catalog.tiers.find(
        (x) =>
          x.rank >
          (json.catalog.tiers.find((y) => y.tier === json.active!.tier)?.rank ??
            0),
      );
      if (next) setTier(next.tier);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function errorMessage(code: string): string {
    const map: Record<string, keyof import("@/i18n/messages").Messages> = {
      builders_disabled: "builders_error_disabled",
      builders_invalid_tier: "builders_error_tier",
      builders_invalid_tx: "builders_error_tx",
      builders_invalid_address: "builders_error_address",
      builders_kyc_required: "builders_error_kyc",
      builders_pending_exists: "builders_error_pending",
      builders_tier_not_upgrade: "builders_error_upgrade",
      builders_tx_used: "builders_error_tx_used",
      builders_mcb_rate_unavailable: "builders_error_rate",
    };
    const k = map[code];
    return k ? t(k) : t("builders_error_generic");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data?.catalog.enabled) return;
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/builders/me", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tier,
          txHash: txHash.trim(),
          walletAddress: wallet.trim() || undefined,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      if (!res.ok) {
        setErr(errorMessage(body.message ?? "builders_error_generic"));
        return;
      }
      setTxHash("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  const selected = data?.catalog.tiers.find((x) => x.tier === tier);
  const selectedPriceUsd = selected?.priceUsd ?? 0;
  const selectedPriceMcb = selected?.priceMcb ?? null;
  const activeRank =
    data?.active != null
      ? (data.catalog.tiers.find((x) => x.tier === data.active!.tier)?.rank ?? 0)
      : 0;

  if (!data && !loadErr) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-[color:var(--fd-muted)]">
        …
      </div>
    );
  }

  if (loadErr || !data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WalletSubpageHeader title={t("builders_title")} backHref="/app/community" />
        <p className="mt-6 text-sm text-rose-700">{t("builders_load_error")}</p>
      </div>
    );
  }

  if (!data.catalog.preview) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <WalletSubpageHeader title={t("builders_title")} backHref="/app/community" />
        <p className="mt-6 text-sm text-[color:var(--fd-muted)]">{t("builders_hidden")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 pb-24 pt-2">
      <WalletSubpageHeader title={t("builders_title")} backHref="/app/community" />

      <div className="mt-3">
        <p className="text-base font-bold tracking-tight text-[color:var(--fd-text)]">
          {t("builders_tagline")}
        </p>
        <p className="mt-1 text-sm text-[color:var(--fd-muted)]">
          {t("builders_philosophy")}
        </p>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        <li className="flex items-center gap-2.5 text-[12px] text-[color:var(--fd-muted)]">
          <IconBadge className="h-4 w-4 shrink-0 text-[color:var(--fd-primary)]" />
          <span>{t("builders_note_status")}</span>
        </li>
        <li className="flex items-center gap-2.5 text-[12px] text-[color:var(--fd-muted)]">
          <IconShield className="h-4 w-4 shrink-0 text-[color:var(--fd-primary)]" />
          <span>{t("builders_note_not_role")}</span>
        </li>
        <li className="flex items-center gap-2.5 text-[12px] text-[color:var(--fd-muted)]">
          <IconClock className="h-4 w-4 shrink-0 text-[color:var(--fd-primary)]" />
          <span>
            {interpolate(t("builders_valid_months"), {
              months: data.catalog.badgeMonths,
            })}
          </span>
        </li>
      </ul>

      {data.active ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
            <IconCheck className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[color:var(--fd-text)]">
              {interpolate(t("builders_active"), {
                tier: tierLabel(t, data.active.tier),
              })}
            </p>
            {data.active.expiresAt ? (
              <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
                {interpolate(t("builders_expires"), {
                  date: new Date(data.active.expiresAt).toLocaleDateString(loc),
                })}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {data.pending ? (
        <div className="mt-4 rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-4 py-3">
          <p className="text-sm font-semibold text-[color:var(--fd-text)]">
            {interpolate(t("builders_pending"), {
              tier: tierLabel(t, data.pending.tier),
            })}
          </p>
          {data.pending.txHash ? (
            <p className="mt-1 truncate font-mono text-[10px] text-[color:var(--fd-muted)]">
              {data.pending.txHash}
            </p>
          ) : null}
        </div>
      ) : null}

      <section className="mt-6">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
          {t("builders_tiers_title")}
        </h2>
        <ul className="mt-2 space-y-2">
          {data.catalog.tiers.map((row) => {
            const isActive = data.active?.tier === row.tier;
            const isSelected = tier === row.tier;
            const visual = buildersTierVisual(row.tier);
            const locked = !!data.pending || (data.active != null && activeRank >= row.rank);
            return (
              <li key={row.tier}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => setTier(row.tier)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition active:scale-[0.99] disabled:opacity-40 ${
                    isSelected
                      ? "border-[color:var(--fd-primary)] bg-[color:var(--fd-mint)]/40"
                      : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
                  }`}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        isSelected ? "bg-[color:var(--fd-primary)]" : "bg-[#d6d3d1]"
                      }`}
                      style={
                        visual && isSelected ? { backgroundColor: visual.ring } : undefined
                      }
                      aria-hidden
                    />
                    <span>
                      <span className="flex items-center gap-2 text-sm font-bold text-[color:var(--fd-text)]">
                        {tierLabel(t, row.tier)}
                        {isActive ? (
                          <span className="rounded bg-[color:var(--fd-mint)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
                            {t("builders_current")}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block tabular-nums text-sm font-bold text-[color:var(--fd-text)]">
                      ${row.priceUsd}
                    </span>
                    <span className="block text-[10px] tabular-nums text-[color:var(--fd-muted)]">
                      {row.priceMcb != null
                        ? `≈ ${row.priceMcb.toLocaleString()} McB`
                        : t("builders_mcb_quote_pending")}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      {data.catalog.dexUrl ? (
        <a
          href={data.catalog.dexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--fd-primary)] text-sm font-bold text-white transition hover:opacity-95 active:scale-[0.99]"
        >
          {t("builders_buy_dex")}
          <IconExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-4 text-center text-[12px] text-[color:var(--fd-muted)]">
          {t("builders_dex_soon")}
        </p>
      )}

      {data.catalog.treasuryAddress ? (
        <div className="mt-3 rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[color:var(--fd-muted)]">
            {t("builders_send_to")}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-[color:var(--fd-text)]">
            {data.catalog.treasuryAddress}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-center text-[11px] text-[color:var(--fd-muted)]">
          {t("builders_treasury_pending")}
        </p>
      )}

      {!data.catalog.enabled ? (
        <p className="mt-4 text-center text-[12px] text-[color:var(--fd-muted)]">
          {t("builders_preview_notice")}
        </p>
      ) : null}

      {!data.kycApproved ? (
        <p className="mt-4 rounded-xl border border-[color:var(--fd-border)] px-3 py-2.5 text-xs text-[color:var(--fd-text)]">
          {t("builders_kyc_required")}{" "}
          <Link href="/app/profile/kyc" className="font-bold text-[color:var(--fd-primary)]">
            KYC →
          </Link>
        </p>
      ) : data.catalog.enabled && !data.pending ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-5 space-y-3">
          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {err}
            </p>
          ) : null}
          <p className="text-[12px] text-[color:var(--fd-muted)]">
            {selectedPriceMcb != null
              ? interpolate(t("builders_pay_hint_usd"), {
                  usd: String(selectedPriceUsd),
                  amount: selectedPriceMcb.toLocaleString(),
                  tier: tierLabel(t, tier),
                })
              : t("builders_mcb_quote_pending")}
          </p>
          {selected?.feePerksUnlocked === false ? (
            <p className="text-[11px] text-[color:var(--fd-muted)]">
              {t("builders_fee_perks_locked")}
            </p>
          ) : null}
          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("builders_tx_label")}
            </span>
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="0x…"
              required
              className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 font-mono text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-[color:var(--fd-muted)]">
              {t("builders_wallet_label")}
            </span>
            <input
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x…"
              className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 font-mono text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="flex min-h-[48px] w-full items-center justify-center rounded-2xl bg-[color:var(--fd-primary)] text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? "…" : t("builders_submit")}
          </button>
        </form>
      ) : null}

      <p className="mt-8 text-center text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("builders_disclaimer")}
      </p>
      <Link
        href="/whitepaper"
        className="mt-2 block text-center text-[11px] font-semibold text-[color:var(--fd-primary)]"
      >
        {t("points_whitepaper_link")}
      </Link>
    </div>
  );
}
