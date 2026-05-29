"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { Messages } from "@/i18n/messages";
import type { StakingChainAsset } from "@/lib/staking-config";
import { maturityRewardAmount } from "@/lib/staking-math";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { clientErrorText } from "@/lib/client-error-text";

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
    return d.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [termDays, locale]);

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
        const key = typeof data.error === "string" ? data.error : "staking_create_failed";
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
      <div className="mx-auto max-w-lg space-y-4 pb-10 pt-2">
        <Link
          href="/app/wallet"
          className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
        >
          ← {t("wallet_title")}
        </Link>
        <p className="text-sm text-rose-800 dark:text-rose-200">{t("staking_create_failed")}</p>
      </div>
    );
  }

  return (
    <div className="wallet-theme space-y-4 pb-10">
      <WalletSubpageHeader title={t("staking_title")} />

      <section className="fd-card p-4">
        <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold text-[color:var(--fd-muted)]">
          <div>
            <p className="text-xl" aria-hidden>
              🔒
            </p>
            <p className="mt-1">{t("staking_how_1")}</p>
          </div>
          <div>
            <p className="text-xl" aria-hidden>
              📈
            </p>
            <p className="mt-1">{t("staking_how_2")}</p>
          </div>
          <div>
            <p className="text-xl" aria-hidden>
              ⏱
            </p>
            <p className="mt-1">{t("staking_how_3")}</p>
          </div>
          <div>
            <p className="text-xl" aria-hidden>
              ✅
            </p>
            <p className="mt-1">{t("staking_how_4")}</p>
          </div>
        </div>
      </section>

      <div className="fd-card flex items-center gap-2 px-3 py-2">
        <span className="text-lg" aria-hidden>
          ⚠️
        </span>
        <p className="text-[11px] font-medium text-[color:var(--fd-primary)]">{t("staking_risk_short")}</p>
      </div>

      <div className="fd-card border border-emerald-200/60 bg-emerald-50/50 p-4 dark:border-emerald-800/40 dark:bg-emerald-950/20">
        <p className="text-xs leading-relaxed text-[color:var(--fd-text)]">{t("staking_roadmap_note")}</p>
      </div>

      <div className="fd-card space-y-3 p-4">
      <label className="block text-sm font-bold text-[color:var(--fd-text)]">
        {t("staking_asset")}
        <select
          value={asset}
          onChange={(e) => onAssetChange(e.target.value as StakingChainAsset)}
          disabled={!catalog}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {ASSETS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("staking_term")}
        <select
          value={termDays}
          onChange={(e) => setTermDays(Number(e.target.value))}
          disabled={!catalog || terms.length === 0}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
        >
          {terms.map((term) => (
            <option key={term.days} value={term.days}>
              {t("staking_days", { days: term.days, apr: term.aprPercent })}
            </option>
          ))}
        </select>
      </label>

      <p className="text-xs text-stone-500 dark:text-stone-400">
        {t("wallet_asset_balance")}:{" "}
        <span className="font-mono tabular-nums text-stone-800 dark:text-stone-200">
          {availableStr} {asset}
        </span>
        {" · "}
        min {minPrincipal} {asset}
      </p>

      <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
        {t("staking_amount")}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          disabled={!catalog}
          className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          placeholder="0"
        />
      </label>

      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/80 p-3 dark:border-emerald-800/50 dark:bg-emerald-950/30">
        <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
          {t("staking_est_reward")}
        </p>
        <p className="mt-1 tabular-nums text-lg font-bold text-emerald-950 dark:text-emerald-100">
          {estReward != null ? (
            <>
              +{estReward.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                maximumFractionDigits: 8,
              })}{" "}
              {asset}
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          {t("staking_est_total")}
        </p>
        <p className="mt-0.5 tabular-nums text-base font-semibold text-stone-900 dark:text-stone-100">
          {estTotal != null ? (
            <>
              {estTotal.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                maximumFractionDigits: 8,
              })}{" "}
              {asset}
            </>
          ) : (
            "—"
          )}
        </p>
        <p className="mt-2 text-[11px] text-stone-600 dark:text-stone-400">
          {t("staking_est_end")}: {estEndUtc} UTC
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-stone-700 dark:text-stone-300">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 rounded border-stone-400"
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
        className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
      >
        {loading ? "…" : t("staking_submit")}
      </button>
      </div>

      <section className="pt-2">
        <p className="mb-2 text-xs font-bold uppercase text-[color:var(--fd-muted)]">{t("staking_active")}</p>
        {!stakes?.length ? (
          <div className="fd-card p-6 text-center text-2xl" aria-hidden>
            ⛓
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {stakes.map((s) => (
              <li key={s.id} className="fd-card p-3 text-sm">
                <p className="font-medium text-stone-900 dark:text-stone-100">
                  {s.principal} {s.asset} · {s.termDays}d @ {s.aprAnnual}%
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  {new Date(s.endsAt).toLocaleString(locale === "fr" ? "fr-FR" : "en-US", {
                    timeZone: "UTC",
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}{" "}
                  UTC
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
