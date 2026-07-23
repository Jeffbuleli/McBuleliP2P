"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/i18n-provider";
import { clientErrorText } from "@/lib/client-error-text";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import { FiatStepper } from "@/components/wallet/fiat-stepper";
import { IconBankCard, IconMobileMoney } from "@/components/wallet/fiat-icons";
import { FiatChannelIcon, resolveFiatChannelId } from "@/components/wallet/fiat-channel-icon";
import { freshpayMethodLabel } from "@/lib/cod-mobile-providers";
import { StatusPill } from "@/components/wallet/transaction-progress";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import {
  WalletErrorBanner,
  WalletFormCard,
  WalletStatusBanner,
  walletGhostBtnClass,
  walletPrimaryBtnClass,
} from "@/components/wallet/wallet-form";

export type FiatTxStatus = {
  reference: string;
  kind: "deposit" | "payout";
  status: "INITIATED" | "PROCESSING" | "COMPLETED" | "FAILED";
  currency: string;
  amount: string;
  provider: string | null;
  failureMessage: string | null;
  meta?: Record<string, unknown> | null;
};

const STEPS = ["init", "wait", "done"] as const;

export function FiatTxStatusScreen({
  txId,
  cardReturn = false,
}: {
  txId: string;
  cardReturn?: boolean;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [tx, setTx] = useState<FiatTxStatus | null>(null);
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
    return rail === "card" ? "Visa · Mastercard" : "";
  }, [tx, rail, locale]);

  const fetchOnce = useCallback(
    async (refresh: boolean): Promise<FiatTxStatus["status"] | null> => {
      const url = `/api/wallet/fiat/tx/${encodeURIComponent(txId)}${refresh ? "?refresh=1" : ""}`;
      const res = await fetch(url, {
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) {
        setErr(typeof data?.error === "string" ? data.error : "wallet_fiat_withdraw_failed");
        setPolling(false);
        return null;
      }
      const next = data.tx as FiatTxStatus;
      setTx(next);
      setErr(null);
      if (next.status === "COMPLETED" || next.status === "FAILED") {
        setPolling(false);
      }
      return next.status;
    },
    [txId],
  );

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let ticks = 0;

    async function loop() {
      if (cancelled) return;
      const status = await fetchOnce(true);
      if (cancelled) return;
      if (!status || status === "COMPLETED" || status === "FAILED") return;
      ticks += 1;
      const delay = cardReturn && ticks < 30 ? 1000 : 3000;
      timer = setTimeout(loop, delay);
    }

    void loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [fetchOnce, cardReturn]);

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
      <WalletSubpageHeader title={title} backHref="/app/wallet" />

      <WalletFormCard>
        <div className="flex items-center gap-2 text-[color:var(--fd-primary)]">
          {rail === "card" ? <IconBankCard /> : <IconMobileMoney />}
          <StatusPill variant={pill.variant} label={pill.label} />
        </div>

        <FiatStepper
          steps={STEPS.map((id, i) => ({
            id,
            label: [t("wallet_fiat_step_init"), t("wallet_fiat_step_wait"), t("wallet_fiat_step_done")][i]!,
          }))}
          current={stepIndex}
          finished={terminal}
        />

        {tx ? (
          <div className="flex items-center gap-3 rounded-2xl bg-[color:var(--fd-mint)]/35 p-3">
            <FiatChannelIcon
              channel={resolveFiatChannelId({ provider: tx.provider, rail })}
              className="h-9 w-9 text-[11px]"
            />
            <div className="min-w-0">
              <p className="text-lg font-bold tabular-nums text-[color:var(--fd-text)]">
                {tx.amount} {tx.currency}
              </p>
              {channelLabel ? (
                <p className="truncate text-xs text-[color:var(--fd-muted)]">{channelLabel}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        {tx?.status === "COMPLETED" ? (
          <WalletStatusBanner tone="success">
            {tx.kind === "payout" ? t("wallet_fiat_withdraw_done") : t("wallet_fiat_deposit_done")}
          </WalletStatusBanner>
        ) : null}

        {tx?.status === "FAILED" && tx.failureMessage ? (
          <WalletErrorBanner>{clientErrorText(t, tx.failureMessage)}</WalletErrorBanner>
        ) : null}

        {!terminal ? (
          <p className="text-xs text-[color:var(--fd-muted)]">{t("wallet_fiat_status_pending_body")}</p>
        ) : null}

        {err ? <WalletErrorBanner>{clientErrorText(t, err)}</WalletErrorBanner> : null}

        <div className="grid gap-2">
          <button
            type="button"
            className={walletGhostBtnClass}
            onClick={() => void manualRefresh()}
            disabled={refreshing}
          >
            {refreshing || polling ? t("wallet_fiat_status_refreshing") : t("wallet_fiat_status_refresh")}
          </button>
          <Link href="/app/wallet/history" className={`${walletPrimaryBtnClass} block text-center`}>
            {t("wallet_fiat_status_history")}
          </Link>
          {terminal ? (
            <button type="button" className={walletPrimaryBtnClass} onClick={() => router.push("/app/wallet")}>
              {t("wallet_fiat_status_wallet")}
            </button>
          ) : null}
        </div>
      </WalletFormCard>

      <div className="mt-6">
        <McBuleliPoweredFooter />
      </div>
    </div>
  );
}
