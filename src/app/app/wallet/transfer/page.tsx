"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ErrorBanner,
  FieldLabel,
  FormPageShell,
  HelperText,
  inputClass,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { WALLET_ASSETS, type WalletAsset } from "@/lib/wallet-types";
import { clientErrorText } from "@/lib/client-error-text";

export default function WalletTransferPage() {
  const { t } = useI18n();
  const router = useRouter();
  const sp = useSearchParams();
  const [asset, setAsset] = useState<WalletAsset>("USDT");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const a = sp.get("asset");
    if (a && WALLET_ASSETS.includes(a as WalletAsset)) {
      setAsset(a as WalletAsset);
    }
  }, [sp]);

  async function submit() {
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: email, asset, amount, memo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "wallet_transfer_failed");
        return;
      }
      router.push("/app/wallet");
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
        {t("wallet_transfer_title")}
      </h1>
      <HelperText>{t("wallet_fee_internal")}</HelperText>

      <FieldLabel label={t("wallet_transfer_email")}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
      </FieldLabel>

      <FieldLabel label={t("wallet_transfer_asset")}>
        <select value={asset} onChange={(e) => setAsset(e.target.value as WalletAsset)} className={inputClass}>
          {WALLET_ASSETS.filter((a) => a !== "PI_TEST").map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </FieldLabel>

      <FieldLabel label={t("wallet_transfer_amount")}>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" className={inputClass} />
      </FieldLabel>

      <FieldLabel label={t("wallet_memo_motif")}>
        <input value={memo} onChange={(e) => setMemo(e.target.value)} className={inputClass} placeholder={t("wallet_memo_motif_ph")} />
      </FieldLabel>

      {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}

      <button
        type="button"
        disabled={loading || !email.trim() || !amount.trim()}
        onClick={() => void submit()}
        className={primaryBtnClass}
      >
        {loading ? "…" : t("wallet_transfer_submit")}
      </button>
    </FormPageShell>
  );
}
