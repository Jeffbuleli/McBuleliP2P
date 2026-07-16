"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useI18n } from "@/components/i18n-provider";
import { interpolate } from "@/i18n/messages";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { IconExternalLink } from "@/components/community/community-inline-icons";
import { buildersTierVisual } from "@/lib/builders/builders-visual";

type TierRow = {
  tier: string;
  priceMcb: number;
  rank: number;
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
        (x) => x.rank > (json.catalog.tiers.find((y) => y.tier === json.active!.tier)?.rank ?? 0),
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

  const selectedPrice =
    data?.catalog.tiers.find((x) => x.tier === tier)?.priceMcb ?? 0;

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

      <p className="mt-2 text-xs leading-relaxed text-[color:var(--fd-muted)]">
        {t("builders_tagline")}
      </p>
      <p className="mt-2 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("builders_philosophy")}
      </p>

      {data.active ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white px-4 py-3">
          <p className="text-sm font-bold text-amber-950">
            {interpolate(t("builders_active"), {
              tier: tierLabel(t, data.active.tier),
            })}
          </p>
          {data.active.expiresAt ? (
            <p className="mt-1 text-[11px] text-amber-900/80">
              {interpolate(t("builders_expires"), {
                date: new Date(data.active.expiresAt).toLocaleDateString(loc),
              })}
            </p>
          ) : null}
        </div>
      ) : null}

      {data.pending ? (
        <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
          <p className="text-sm font-semibold text-sky-900">
            {interpolate(t("builders_pending"), {
              tier: tierLabel(t, data.pending.tier),
            })}
          </p>
          <p className="mt-1 font-mono text-[10px] text-sky-800 break-all">
            {data.pending.txHash}
          </p>
        </div>
      ) : null}

      <section className="mt-6 space-y-2">
        <h2 className="text-sm font-bold text-[color:var(--fd-text)]">
          {t("builders_tiers_title")}
        </h2>
        <ul className="space-y-2">
          {data.catalog.tiers.map((row) => {
            const isActive = data.active?.tier === row.tier;
            const selected = tier === row.tier;
            const visual = buildersTierVisual(row.tier);
            return (
              <li key={row.tier}>
                <button
                  type="button"
                  disabled={!!data.pending || (data.active != null &&
                    (data.catalog.tiers.find((x) => x.tier === data.active!.tier)?.rank ?? 0) >=
                      row.rank)}
                  onClick={() => setTier(row.tier)}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                    selected
                      ? `${visual?.badgeClass ?? "border-[#991B1B] bg-[#991B1B]/5"} ring-2 ring-offset-1`
                      : "border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
                  } disabled:opacity-40`}
                  style={
                    selected && visual
                      ? { boxShadow: `0 0 0 1px ${visual.ring}, 0 0 10px ${visual.glow}` }
                      : undefined
                  }
                >
                  <span>
                    <span className="block text-sm font-bold text-[color:var(--fd-text)]">
                      {tierLabel(t, row.tier)}
                      {isActive ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase opacity-80">
                          {t("builders_current")}
                        </span>
                      ) : null}
                    </span>
                    <span className="text-[10px] text-[color:var(--fd-muted)]">
                      {interpolate(t("builders_valid_months"), {
                        months: data.catalog.badgeMonths,
                      })}
                    </span>
                  </span>
                  <span
                    className="tabular-nums text-sm font-bold"
                    style={visual ? { color: visual.ring } : undefined}
                  >
                    {row.priceMcb} McB
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
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-[#991B1B]/30 bg-[#991B1B] py-3 text-sm font-bold text-white"
        >
          {t("builders_buy_dex")}
          <IconExternalLink className="h-4 w-4" />
        </a>
      ) : (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("builders_dex_soon")}
        </p>
      )}

      {data.catalog.treasuryAddress ? (
        <p className="mt-3 text-[11px] leading-relaxed text-[color:var(--fd-muted)]">
          {t("builders_send_to")}{" "}
          <span className="font-mono text-[10px] break-all text-[color:var(--fd-text)]">
            {data.catalog.treasuryAddress}
          </span>
        </p>
      ) : (
        <p className="mt-3 text-[11px] text-[color:var(--fd-muted)]">
          {t("builders_treasury_pending")}
        </p>
      )}

      {!data.catalog.enabled ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {t("builders_preview_notice")}
        </p>
      ) : null}

      {!data.kycApproved ? (
        <p className="mt-4 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-2 text-xs">
          {t("builders_kyc_required")}{" "}
          <Link href="/app/profile/kyc" className="font-bold text-[color:var(--fd-primary)]">
            KYC →
          </Link>
        </p>
      ) : data.catalog.enabled && !data.pending ? (
        <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-3">
          {err ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
              {err}
            </p>
          ) : null}
          <p className="text-[11px] text-[color:var(--fd-muted)]">
            {interpolate(t("builders_pay_hint"), {
              amount: String(selectedPrice),
              tier: tierLabel(t, tier),
            })}
          </p>
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
              placeholder="0x… (optional)"
              className="mt-1 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 font-mono text-sm outline-none focus:border-[color:var(--fd-primary)]"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#991B1B] py-2.5 text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? "…" : t("builders_submit")}
          </button>
        </form>
      ) : null}

      <p className="mt-6 text-[10px] leading-relaxed text-[color:var(--fd-muted)]">
        {t("builders_disclaimer")}
      </p>
      <Link
        href="/whitepaper"
        className="mt-2 block text-center text-[11px] font-bold text-[color:var(--fd-primary)]"
      >
        {t("points_whitepaper_link")} →
      </Link>
    </div>
  );
}
