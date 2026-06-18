"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  IconBankCard,
  IconDepositArrow,
  IconFiatHub,
  IconHistoryClock,
  IconMobileMoney,
  IconWithdrawArrow,
} from "@/components/wallet/fiat-icons";

type FiatConfig = {
  paused: boolean;
  mobileMoney: boolean;
  card: boolean;
};

type BalanceRow = { asset: "USD" | "CDF"; display: string };

export function FiatHubClient({
  balances,
}: {
  balances: BalanceRow[];
}) {
  const { t } = useI18n();
  const [cfg, setCfg] = useState<FiatConfig | null>(null);

  useEffect(() => {
    void fetch("/api/wallet/fiat/config")
      .then((r) => r.json())
      .then((j) => setCfg(j))
      .catch(() => setCfg({ paused: true, mobileMoney: false, card: false }));
  }, []);

  const disabled = cfg?.paused || (!cfg?.mobileMoney && !cfg?.card);

  return (
    <div className="wallet-theme pb-10">
      <WalletSubpageHeader title={t("wallet_fiat_hub_title")} backHref="/app/wallet" />

      <div className="fd-card mb-4 flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <IconFiatHub className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("wallet_fiat_hub_tagline")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {balances.map((b) => (
              <span
                key={b.asset}
                className="rounded-full bg-[color:var(--fd-card)] px-2.5 py-0.5 text-xs font-bold tabular-nums ring-1 ring-[color:var(--fd-border)]"
              >
                {b.display}
              </span>
            ))}
          </div>
        </div>
      </div>

      {cfg?.paused ? (
        <p className="mb-4 rounded-2xl border border-amber-300/50 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          {t("wallet_fiat_paused_hint")}
        </p>
      ) : null}

      <section className="mb-4">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          <IconMobileMoney className="h-4 w-4" />
          {t("wallet_fiat_rail_momo")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <FiatOpTile
            href="/app/wallet/fiat/deposit?rail=momo"
            icon={<IconDepositArrow />}
            label={t("wallet_action_deposit")}
            disabled={disabled || !cfg?.mobileMoney}
          />
          <FiatOpTile
            href="/app/wallet/fiat/withdraw?rail=momo"
            icon={<IconWithdrawArrow />}
            label={t("wallet_action_withdraw")}
            disabled={disabled || !cfg?.mobileMoney}
          />
        </div>
      </section>

      <section className="mb-4">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          <IconBankCard className="h-4 w-4" />
          {t("wallet_fiat_rail_card")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <FiatOpTile
            href="/app/wallet/fiat/card/deposit"
            icon={<IconDepositArrow />}
            label={t("wallet_action_deposit")}
            disabled={disabled || !cfg?.card}
          />
          <FiatOpTile
            href="/app/wallet/fiat/withdraw?rail=card"
            icon={<IconWithdrawArrow />}
            label={t("wallet_fiat_card_withdraw_soon")}
            disabled
          />
        </div>
      </section>

      <Link
        href="/app/wallet/history?category=fiat"
        className="fd-card flex items-center gap-3 p-3 active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <IconHistoryClock />
        </span>
        <span className="text-sm font-bold text-[color:var(--fd-text)]">{t("wallet_fiat_hub_history")}</span>
      </Link>
    </div>
  );
}

function FiatOpTile({
  href,
  icon,
  label,
  disabled,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="fd-card flex flex-col items-center gap-2 p-4 opacity-45">
        <span className="text-[color:var(--fd-primary)]">{icon}</span>
        <span className="text-center text-xs font-bold text-[color:var(--fd-muted)]">{label}</span>
      </div>
    );
  }
  return (
    <Link href={href} className="fd-card flex flex-col items-center gap-2 p-4 active:scale-[0.98]">
      <span className="text-[color:var(--fd-primary)]">{icon}</span>
      <span className="text-center text-xs font-bold text-[color:var(--fd-text)]">{label}</span>
    </Link>
  );
}
