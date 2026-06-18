"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  IconBankCard,
  IconDepositArrow,
  IconFiatHub,
  IconMobileMoney,
  IconWithdrawArrow,
} from "@/components/wallet/fiat-icons";

type FiatConfig = {
  paused: boolean;
  mobileMoney: boolean;
  card: boolean;
};

type BalanceRow = { asset: "USD" | "CDF"; display: string };

export function FiatHubClient({ balances }: { balances: BalanceRow[] }) {
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

      <div className="wallet-fiat-panel mb-4 flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-[color:var(--fd-brown)]">
          <IconFiatHub className="h-7 w-7" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-brown)]">{t("wallet_fiat_hub_tagline")}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {balances.map((b) => (
              <span key={b.asset} className="wallet-balance-pill">
                <span className="text-[10px] font-bold uppercase">{b.asset}</span>
                <span className="tabular-nums">{b.display.replace(`${b.asset} `, "")}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {cfg?.paused ? (
        <p className="wallet-status-banner wallet-status-banner-warn mb-4">{t("wallet_fiat_paused_hint")}</p>
      ) : null}

      <section className="mt-2">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          <IconMobileMoney className="h-4 w-4" />
          {t("wallet_fiat_rail_momo")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <FiatOpTile href="/app/wallet/fiat/deposit" icon={<IconDepositArrow />} label={t("wallet_action_deposit")} disabled={disabled || !cfg?.mobileMoney} />
          <FiatOpTile href="/app/wallet/fiat/withdraw" icon={<IconWithdrawArrow />} label={t("wallet_action_withdraw")} disabled={disabled || !cfg?.mobileMoney} />
        </div>
      </section>

      <section className="mb-4 mt-4">
        <h2 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          <IconBankCard className="h-4 w-4" />
          {t("wallet_fiat_rail_card")}
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <FiatOpTile href="/app/wallet/fiat/card/deposit" icon={<IconDepositArrow />} label={t("wallet_action_deposit")} disabled={disabled || !cfg?.card} />
          <FiatOpTile href="#" icon={<IconWithdrawArrow />} label={t("wallet_fiat_card_withdraw_soon")} disabled />
        </div>
      </section>
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
      <span className="text-[color:var(--fd-brown)]">{icon}</span>
      <span className="text-center text-xs font-bold text-[color:var(--fd-text)]">{label}</span>
    </Link>
  );
}
