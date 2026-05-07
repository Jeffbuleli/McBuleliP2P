"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { clientErrorText } from "@/lib/client-error-text";

type ProviderOption = { provider: string; label: string };

export default function WalletFiatDepositClient() {
  const { t, locale } = useI18n();
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okId, setOkId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pct = Math.round(FIAT_FEE_RATE * 100);
  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    if (net <= 0) return null;
    return { fee, net, g };
  }, [gross]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProvidersLoading(true);
      try {
        const url = `/api/config/pawapay/active-conf?country=COD&operationType=DEPOSIT&currency=${asset}`;
        const res = await fetch(url);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.ok) {
          if (!cancelled) setProviders([]);
          return;
        }
        const cod = (data.countries as Array<any> | undefined)?.find((c) => c?.country === "COD");
        const list = (cod?.providers as Array<any> | undefined) ?? [];
        const opts: ProviderOption[] = list
          .filter((p) => Array.isArray(p?.currencies) && p.currencies.length > 0)
          .map((p) => ({
            provider: String(p.provider),
            label: String(p.displayName ?? p.provider),
          }))
          .sort((a, b) => a.label.localeCompare(b.label));
        if (!cancelled) {
          setProviders(opts);
          if (opts.length && !opts.some((x) => x.provider === provider)) {
            setProvider(opts[0]!.provider);
          }
        }
      } finally {
        if (!cancelled) setProvidersLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset]);

  async function submit() {
    setErr(null);
    setOkId(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, grossAmount: gross, phoneNumber, provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_pawapay_deposit_failed");
        return;
      }
      if (typeof data.depositId === "string") setOkId(data.depositId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/60">
      <div className="grid gap-3">
        <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("wallet_transfer_asset")}
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value as "USD" | "CDF")}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          >
            <option value="USD">USD</option>
            <option value="CDF">CDF</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("wallet_fiat_gross")}
          <input
            value={gross}
            onChange={(e) => setGross(e.target.value)}
            inputMode="decimal"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg tabular-nums dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>

        <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("wallet_phone_number")}
          <input
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            inputMode="tel"
            placeholder="99xxxxxxx ou 24399xxxxxxx"
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100"
          />
        </label>

        <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
          {t("wallet_mobile_money_provider")}
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            disabled={providersLoading || providers.length === 0}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 disabled:opacity-60"
          >
            {providers.length === 0 ? (
              <option value="">{providersLoading ? "…" : "—"}</option>
            ) : null}
            {providers.map((p) => (
              <option key={p.provider} value={p.provider}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {summary ? (
          <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
            <p className="text-stone-700 dark:text-stone-200">
              {t("wallet_fiat_fee", { pct })}:{" "}
              <strong className="tabular-nums text-stone-900 dark:text-stone-100">
                {summary.fee.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
                {asset}
              </strong>
            </p>
            <p className="mt-2 text-stone-700 dark:text-stone-200">
              {t("wallet_fiat_net")}:{" "}
              <strong className="tabular-nums text-stone-900 dark:text-stone-100">
                {summary.net.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
                {asset}
              </strong>
            </p>
          </div>
        ) : null}

        {err ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
            {clientErrorText(t, err)}
          </p>
        ) : null}

        {okId ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-950 dark:bg-emerald-950/40 dark:text-emerald-100">
            Deposit initiated. ID: <span className="font-mono">{okId}</span>
          </p>
        ) : null}

        <button
          type="button"
          disabled={loading || !summary || !phoneNumber.trim() || !provider.trim()}
          onClick={() => void submit()}
          className="w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40"
        >
          {loading ? "…" : t("wallet_fiat_deposit_submit")}
        </button>
      </div>
    </div>
  );
}

