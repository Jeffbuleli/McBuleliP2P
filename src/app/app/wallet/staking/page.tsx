"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { StakingHowSteps } from "@/components/wallet/staking-how-steps";
import {
  StakingHeroIllustration,
  StakingIllEmpty,
} from "@/components/wallet/staking-illustrations";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { clientErrorText } from "@/lib/client-error-text";
import type { StakingChainAsset } from "@/lib/staking-config";
import { maturityRewardAmount } from "@/lib/staking-math";

type TermRow = { days: number; aprPercent: number };

type Catalog = Record<
  StakingChainAsset,
  { minPrincipal: number; terms: TermRow[] }
>;

type StakeRow = {
  id: string;
  asset: string;
  principal: string;
  aprAnnual: string;
  termDays: number;
  startedAt: string;
  endsAt: string;
  status: string;
};

type WalletLine = {
  asset: string;
  balance: string;
  balanceNum: number;
};

const ASSETS: StakingChainAsset[] = ["USDT", "PI"];

const fieldCls =
  "mt-1.5 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2.5 text-sm text-[color:var(--fd-text)] outline-none focus:border-[color:var(--fd-primary)] focus:ring-2 focus:ring-[color:var(--fd-primary)]/15";

export default function WalletStakingPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [stakes, setStakes] = useState<StakeRow[] | null>(null);
  const [walletLines, setWalletLines] = useState<WalletLine[] | null>(null);
  const [asset, setAsset] = useState<StakingChainAsset>("USDT");
  const [termDays, setTermDays] = useState(30);
  const [amount, setAmount] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState(false);

  const loc = locale === "fr" ? "fr-FR" : "en-US";

  const loadData = useCallback(async () => {
    setLoadErr(false);
    const [rMe, rSum] = await Promise.all([
      fetch("/api/staking/me"),
      fetch("/api/wallet/summary"),
    ]);
    if (!rMe.ok || !rSum.ok) {
      setLoadErr(true);
      setCatalog(null);
      setStakes(null);
      setWalletLines(null);
      return;
    }
    const me = (await rMe.json()) as { catalog: Catalog; stakes: StakeRow[] };
    const sum = (await rSum.json()) as { lines: WalletLine[] };
    setCatalog(me.catalog);
    setStakes(me.stakes);
    setWalletLines(sum.lines);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!catalog) return;
    const ok = catalog[asset].terms.some((x) => x.days === termDays);
    if (!ok) {
      const f = catalog[asset].terms[0]?.days;
      if (f != null) setTermDays(f);
    }
  }, [catalog, asset, termDays]);

  const terms = catalog?.[asset]?.terms ?? [];
  const selectedTerm = terms.find((x) => x.days === termDays) ?? terms[0];
  const apr = selectedTerm?.aprPercent ?? 0;
  const minPrincipal = catalog?.[asset]?.minPrincipal ?? 0;

  const availableStr = useMemo(() => {
    const line = walletLines?.find((l) => l.asset === asset);
    return line?.balance ?? "0";
  }, [walletLines, asset]);

  const principalNum = useMemo(() => {
    const p = Number(amount.replace(",", "."));
    return Number.isFinite(p) && p > 0 ? p : null;
  }, [amount]);

  const estReward = useMemo(() => {
    if (principalNum == null) return null;
    return maturityRewardAmount(principalNum, apr, termDays);
  }, [principalNum, apr, termDays]);

  const estTotal = useMemo(() => {
    if (principalNum == null || estReward == null) return null;
    return principalNum + estReward;
  }, [principalNum, estReward]);

  const estEndUtc = useMemo(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + termDays);
    return d.toLocaleString(loc, {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [termDays, loc]);

  function onAssetChange(next: StakingChainAsset) {
    setAsset(next);
    const first = catalog?.[next]?.terms[0];
    if (first) setTermDays(first.days);
  }

  async function confirm() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, amount: amount.trim(), termDays }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        const key =
          typeof data.error === "string" ? data.error : "staking_create_failed";
        setErr(key);
        return;
      }
      router.push("/app/wallet");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    catalog &&
    accepted &&
    amount.trim() &&
    Number(amount.replace(",", ".")) > 0 &&
    !loading;

  function errText(key: string): string {
    return clientErrorText(t, key);
  }

  if (loadErr) {
    return (
      <div className="wallet-theme mx-auto max-w-lg space-y-4 pb-10 pt-2">
        <Link
          href="/app/wallet"
          className="text-sm font-medium text-[color:var(--fd-primary)] underline"
        >
          ← {t("wallet_title")}
        </Link>
        <p className="text-sm text-rose-700">{t("staking_create_failed")}</p>
      </div>
    );
  }

  const activeCount = stakes?.length ?? 0;

  return (
    <div className="wallet-theme space-y-3 pb-10">
      <WalletSubpageHeader
        title={t("staking_title")}
        subtitle={t("staking_page_intro")}
        badge={
          activeCount > 0 ? (
            <span className="rounded-full bg-[color:var(--fd-mint)] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[color:var(--fd-primary)]">
              {t("staking_active_count", { count: activeCount })}
            </span>
          ) : undefined
        }
      />

      <div className="fd-card flex items-center gap-4 p-4">
        <StakingHeroIllustration className="h-[4.5rem] w-[4.5rem] shrink-0" />
        <p className="text-xs leading-relaxed text-[color:var(--fd-muted)]">
          {t("staking_wallet_teaser")}
        </p>
      </div>

      <StakingHowSteps />

      <p className="flex items-start gap-2 rounded-xl border border-amber-200/80 bg-amber-50/80 px-3 py-2.5 text-[11px] leading-snug text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-100">
        <span className="mt-0.5 shrink-0 font-bold" aria-hidden>
          !
        </span>
        {t("staking_risk_short")}
      </p>

      <div className="fd-card space-y-4 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("staking_submit")}
        </p>

        <label className="block">
          <span className="text-xs font-semibold text-[color:var(--fd-text)]">
            {t("staking_asset")}
          </span>
          <select
            value={asset}
            onChange={(e) => onAssetChange(e.target.value as StakingChainAsset)}
            disabled={!catalog}
            className={fieldCls}
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold text-[color:var(--fd-text)]">
            {t("staking_term")}
          </span>
          <select
            value={termDays}
            onChange={(e) => setTermDays(Number(e.target.value))}
            disabled={!catalog || terms.length === 0}
            className={fieldCls}
          >
            {terms.map((term) => (
              <option key={term.days} value={term.days}>
                {t("staking_days", { days: term.days, apr: term.aprPercent })}
              </option>
            ))}
          </select>
        </label>

        <p className="text-[11px] text-[color:var(--fd-muted)]">
          {t("wallet_asset_balance")}:{" "}
          <span className="font-mono tabular-nums text-[color:var(--fd-text)]">
            {availableStr} {asset}
          </span>
          {" · "}
          min {minPrincipal} {asset}
        </p>

        <label className="block">
          <span className="text-xs font-semibold text-[color:var(--fd-text)]">
            {t("staking_amount")}
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            disabled={!catalog}
            className={`${fieldCls} text-lg tabular-nums`}
            placeholder="0"
          />
        </label>

        <div className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {t("staking_est_reward")}
              </p>
              <p className="mt-1 font-mono text-base font-bold tabular-nums text-[color:var(--fd-primary)]">
                {estReward != null ? (
                  <>
                    +
                    {estReward.toLocaleString(loc, { maximumFractionDigits: 8 })}{" "}
                    {asset}
                  </>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
                {t("staking_est_total")}
              </p>
              <p className="mt-1 font-mono text-base font-semibold tabular-nums text-[color:var(--fd-text)]">
                {estTotal != null ? (
                  <>
                    {estTotal.toLocaleString(loc, { maximumFractionDigits: 8 })}{" "}
                    {asset}
                  </>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
          <p className="mt-2 border-t border-[color:var(--fd-border)] pt-2 text-[11px] text-[color:var(--fd-muted)]">
            {t("staking_est_end")}: {estEndUtc} UTC
          </p>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-[11px] leading-snug text-[color:var(--fd-muted)]">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[color:var(--fd-border)]"
          />
          <span>{t("staking_accept")}</span>
        </label>

        {err ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
            {errText(err)}
          </p>
        ) : null}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => void confirm()}
          className="w-full rounded-2xl bg-[color:var(--fd-primary)] py-3.5 text-base font-bold text-white shadow-sm disabled:opacity-40"
        >
          {loading ? "…" : t("staking_submit")}
        </button>
      </div>

      <section>
        <p className="mb-2 px-0.5 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("staking_active")}
        </p>
        {!stakes?.length ? (
          <div className="fd-card flex flex-col items-center gap-2 px-4 py-8 text-center">
            <StakingIllEmpty />
            <p className="text-sm text-[color:var(--fd-muted)]">{t("staking_none")}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stakes.map((s) => (
              <li
                key={s.id}
                className="fd-card flex items-center justify-between gap-3 p-3"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold tabular-nums text-[color:var(--fd-text)]">
                    {s.principal} {s.asset}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
                    {s.termDays}d · {s.aprAnnual}% APR
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase text-[color:var(--fd-muted)]">
                    UTC
                  </p>
                  <p className="text-[11px] tabular-nums text-[color:var(--fd-text)]">
                    {new Date(s.endsAt).toLocaleDateString(loc, { timeZone: "UTC" })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
