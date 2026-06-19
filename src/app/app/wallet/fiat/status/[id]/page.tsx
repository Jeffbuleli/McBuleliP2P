"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ErrorBanner,
  FormCard,
  primaryBtnClass,
} from "@/components/forms/standard-form";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconBankCard, IconMobileMoney } from "@/components/wallet/fiat-icons";
import { FiatChannelIcon, resolveFiatChannelId } from "@/components/wallet/fiat-channel-icon";
import { freshpayMethodLabel } from "@/lib/cod-mobile-providers";
import { StatusPill } from "@/components/wallet/transaction-progress";

type Tx = {
  reference: string;
  kind: "deposit" | "payout";
  status: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  currency: string;
  amount: string;
  provider: string | null;
  failureMessage: string | null;
  meta?: Record<string, unknown> | null;
};

const STEPS = [
  { id: "init", label: "Init" },
  { id: "wait", label: "Wait" },
  { id: "done", label: "Done" },
];

export default function WalletFiatTxStatusPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [tx, setTx] = useState<Tx | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const rail = tx?.meta?.rail === "card" || tx?.provider === "card" ? "card" : "momo";
  const title =
    tx?.kind === "payout"
      ? t("wallet_fiat_withdraw_title")
      : rail === "card"
        ? t("wallet_fiat_card_deposit_title")
        : t("wallet_fiat_deposit_title");

  const terminal = tx?.status === "COMPLETED" || tx?.status === "FAILED";

  const stepIndex = useMemo(() => {
    if (!tx) return 0;
    if (terminal) return 2;
    return 1;
  }, [tx, terminal]);

  const channelLabel = useMemo(() => {
    if (!tx) return "";
    const fromMeta = typeof tx.meta?.providerLabel === "string" ? tx.meta.providerLabel : null;
    if (fromMeta) return fromMeta;
    if (tx.provider) return freshpayMethodLabel(tx.provider, locale === "fr" ? "fr" : "en");
    return rail === "card" ? "Visa" : "";
  }, [tx, rail, locale]);

  const fetchOnce = useCallback(
    async (refresh: boolean) => {
      if (!id) return;
      const url = `/api/wallet/fiat/tx/${encodeURIComponent(id)}${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data?.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
        setPolling(false);
        return;
      }
      const next = data.tx as Tx;
      setTx(next);
      setErr(null);
      if (next.status === "COMPLETED" || next.status === "FAILED") {
        setPolling(false);
      }
    },
    [id],
  );

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function loop() {
      if (cancelled) return;
      await fetchOnce(true);
      if (cancelled) return;
      timer = setTimeout(loop, 3000);
    }

    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [id, fetchOnce]);

  const pill =
    tx?.status === "COMPLETED"
      ? { variant: "success" as const, label: t("wallet_fiat_status_completed") }
      : tx?.status === "FAILED"
        ? { variant: "failed" as const, label: t("wallet_fiat_status_failed") }
        : { variant: "processing" as const, label: t("wallet_fiat_status_pending_title") };

  async function manualRefresh() {
    setRefreshing(true);
    await fetchOnce(true);
    setRefreshing(false);
  }

  return (
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={title} backHref="/app/wallet/fiat" />

      <FormCard>
        <div className="mb-3 flex items-center gap-2 text-[color:var(--fd-primary)]">
          {rail === "card" ? <IconBankCard /> : <IconMobileMoney />}
          <StatusPill variant={pill.variant} label={pill.label} />
        </div>

        <FiatStepper
          steps={STEPS.map((s, i) => ({
            id: s.id,
            label: [t("wallet_fiat_step_init"), t("wallet_fiat_step_wait"), t("wallet_fiat_step_done")][i]!,
          }))}
          current={stepIndex}
          finished={terminal}
        />

        {tx ? (
          <div className="rounded-2xl bg-[color:var(--fd-mint)]/40 p-3 text-sm tabular-nums">
            <div className="flex items-center gap-2">
              <FiatChannelIcon
                channel={resolveFiatChannelId({ provider: tx.provider, rail })}
                className="h-7 w-7 text-[10px]"
              />
              <div>
                <p className="font-bold">
                  {tx.amount} {tx.currency}
                </p>
                {channelLabel ? (
                  <p className="text-[11px] text-[color:var(--fd-muted)]">{channelLabel}</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {tx?.status === "COMPLETED" ? (
          <p className="text-xs font-semibold text-[color:var(--fd-primary)]">
            {tx.kind === "payout" ? t("wallet_fiat_withdraw_done") : t("wallet_fiat_deposit_done")}
          </p>
        ) : null}

        {tx?.status === "FAILED" && tx.failureMessage ? (
          <p className="text-xs text-[color:var(--fd-danger,#b91c1c)]">{tx.failureMessage}</p>
        ) : null}

        {!terminal ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("wallet_fiat_status_pending_body")}</p>
        ) : null}

        {err ? <ErrorBanner>{clientErrorText(t, err)}</ErrorBanner> : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={primaryBtnClass}
            onClick={() => void manualRefresh()}
            disabled={!id || refreshing}
          >
            {refreshing || polling ? t("wallet_fiat_status_refreshing") : t("wallet_fiat_status_refresh")}
          </button>
          <Link className={primaryBtnClass} href="/app/wallet/history">
            {t("wallet_fiat_status_history")}
          </Link>
          {terminal ? (
            <button type="button" className={primaryBtnClass} onClick={() => router.push("/app/wallet")}>
              {t("wallet_fiat_status_wallet")}
            </button>
          ) : null}
        </div>
      </FormCard>
    </div>
  );
}
