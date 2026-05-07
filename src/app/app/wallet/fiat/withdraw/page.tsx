"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ErrorBanner,
  FieldLabel,
  FormPageShell,
  HelperText,
  inputClass,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import type { Messages } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";

type ProviderOption = { provider: string; label: string };

export default function WalletFiatWithdrawPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [asset, setAsset] = useState<"USD" | "CDF">("USD");
  const [gross, setGross] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [provider, setProvider] = useState("");
  const [providers, setProviders] = useState<ProviderOption[]>([]);
  const [providersLoading, setProvidersLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pct = Math.round(FIAT_FEE_RATE * 100);

  const summary = useMemo(() => {
    const g = Number(gross);
    if (!Number.isFinite(g) || g <= 0) return null;
    const fee = g * FIAT_FEE_RATE;
    const net = g - fee;
    return { fee, net, g };
  }, [gross]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setProvidersLoading(true);
      try {
        const url = `/api/config/pawapay/active-conf?country=COD&operationType=PAYOUT&currency=${asset}`;
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
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/fiat/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, grossAmount: gross, phoneNumber, provider }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
        return;
      }
      router.push("/app/wallet/history");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <FormPageShell>
      <Link href="/app/wallet" className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400">
        ← {t("wallet_title")}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {t("wallet_fiat_withdraw_title")}
      </h1>
      <p className="text-sm text-stone-600 dark:text-stone-400">
        {t("wallet_fiat_withdraw_intro", { pct })}
      </p>

      <FieldLabel label={t("wallet_transfer_asset")}>
        <select value={asset} onChange={(e) => setAsset(e.target.value as "USD" | "CDF")} className={inputClass}>
          <option value="USD">USD</option>
          <option value="CDF">CDF</option>
        </select>
      </FieldLabel>

      <FieldLabel label={t("wallet_fiat_gross")}>
        <input value={gross} onChange={(e) => setGross(e.target.value)} inputMode="decimal" className={inputClass} />
      </FieldLabel>

      <FieldLabel label={t("wallet_phone_number")}>
        <input
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          inputMode="tel"
          placeholder="99xxxxxxx ou 24399xxxxxxx"
          className={inputClass}
        />
      </FieldLabel>

      <FieldLabel label={t("wallet_mobile_money_provider")}>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value)}
          disabled={providersLoading || providers.length === 0}
          className={`${inputClass} disabled:opacity-60`}
        >
          {providers.length === 0 ? <option value="">{providersLoading ? "…" : "—"}</option> : null}
          {providers.map((p) => (
            <option key={p.provider} value={p.provider}>
              {p.label}
            </option>
          ))}
        </select>
      </FieldLabel>

      {summary ? (
        <div className="rounded-2xl border border-emerald-900/15 bg-emerald-50/70 p-4 text-sm dark:border-emerald-800/30 dark:bg-emerald-950/30">
          <p>
            {t("wallet_fiat_fee")}:{" "}
            <strong className="tabular-nums">
              {summary.fee.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
              {asset}
            </strong>
          </p>
          <p className="mt-2">
            {t("wallet_fiat_net")}:{" "}
            <strong className="tabular-nums">
              {summary.net.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 2 })}{" "}
              {asset}
            </strong>
          </p>
        </div>
      ) : null}

      <HelperText>{t("wallet_fiat_ops_note")}</HelperText>

      {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}

      <button
        type="button"
        disabled={loading || !summary || !phoneNumber.trim() || !provider.trim()}
        onClick={() => void submit()}
        className={primaryBtnClass}
      >
        {loading ? "…" : t("wallet_fiat_submit")}
      </button>
    </FormPageShell>
  );
}
