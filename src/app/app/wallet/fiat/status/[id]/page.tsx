"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ErrorBanner,
  FormPageShell,
  HelperText,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";

type Tx = {
  reference: string;
  kind: "deposit" | "payout";
  status: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  currency: string;
  amount: string;
  provider: string | null;
  phoneNumber: string | null;
  failureCode: string | null;
  failureMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  meta?: Record<string, unknown> | null;
};

export default function WalletFiatTxStatusPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tx, setTx] = useState<Tx | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  const title = useMemo(() => {
    if (!tx) return t("wallet_title");
    return tx.kind === "deposit" ? t("wallet_fiat_deposit_title") : t("wallet_fiat_withdraw_title");
  }, [t, tx]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: any = null;

    async function fetchOnce(refresh: boolean) {
      const url = `/api/wallet/fiat/tx/${encodeURIComponent(id)}${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        if (!cancelled) {
          setErr(typeof data?.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
          setDetail(typeof data?.detail === "string" ? data.detail : null);
          setPolling(false);
        }
        return;
      }
      if (!cancelled) {
        setTx(data.tx as Tx);
        setErr(null);
        setDetail(null);
        const st = (data.tx as Tx).status;
        if (st === "COMPLETED" || st === "FAILED") {
          setPolling(false);
        }
      }
    }

    async function loop() {
      await fetchOnce(true);
      if (cancelled) return;
      timer = setTimeout(loop, 3000);
    }

    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id]);

  return (
    <FormPageShell>
      <Link href="/app/wallet" className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400">
        ← {t("wallet_title")}
      </Link>

      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">{title}</h1>

      <HelperText>
        {tx?.status === "PROCESSING" || tx?.status === "INITIATED"
          ? `${t("wallet_fiat_status_pending_title")}. ${t("wallet_fiat_status_pending_body")}`
          : tx?.status === "COMPLETED"
            ? `${t("wallet_fiat_status_completed")}.`
            : tx?.status === "FAILED"
              ? `${t("wallet_fiat_status_failed")}.`
              : "…"}
      </HelperText>

      {err ? (
        <ErrorBanner>
          <div>{clientErrorText(t, err)}</div>
          {detail ? <div className="mt-2 font-mono text-[11px] opacity-90">{detail}</div> : null}
        </ErrorBanner>
      ) : null}

      {tx ? (
        <div className="rounded-2xl border border-stone-900/10 bg-white/60 p-4 text-sm text-stone-800 dark:border-stone-50/10 dark:bg-stone-950/20 dark:text-stone-200">
          <p>
            <strong>{t("wallet_fiat_status_status")}:</strong> {tx.status}
          </p>
          <p className="mt-1">
            <strong>{t("wallet_fiat_status_type")}:</strong> {tx.kind}
          </p>
          <p className="mt-1">
            <strong>{t("wallet_fiat_status_amount")}:</strong> {tx.amount} {tx.currency}
          </p>
          {tx.provider ? (
            <p className="mt-1">
              <strong>{t("wallet_fiat_status_provider")}:</strong>{" "}
              {typeof tx.meta?.providerLabel === "string" && tx.meta.providerLabel.trim()
                ? tx.meta.providerLabel
                : tx.provider}
            </p>
          ) : null}
          {tx.failureMessage || tx.failureCode ? (
            <p className="mt-2">
              <strong>{t("wallet_fiat_status_reason")}:</strong>{" "}
              {[tx.failureCode, tx.failureMessage].filter(Boolean).join(": ")}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex gap-3">
        <button
          type="button"
          className={primaryBtnClass}
          onClick={() => {
            router.refresh();
          }}
          disabled={!id}
        >
          {polling ? t("wallet_fiat_status_refreshing") : t("wallet_fiat_status_refresh")}
        </button>
        <Link className={primaryBtnClass} href="/app/wallet/history">
          {t("wallet_fiat_status_history")}
        </Link>
      </div>
    </FormPageShell>
  );
}

