"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { McBuleliPoweredFooter } from "@/components/brand/mcbuleli-powered-footer";
import { WalletSubpageHeader } from "@/components/wallet/wallet-subpage-header";
import {
  IconBankCard,
  IconDepositArrow,
  IconMobileMoney,
  IconWithdrawArrow,
} from "@/components/wallet/fiat-icons";

type FiatConfig = {
  paused: boolean;
  mobileMoney: boolean;
  card: boolean;
};

export function FiatHubClient() {
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
    <div className="wallet-theme flex min-h-[70vh] flex-col pb-4">
      <WalletSubpageHeader title={t("wallet_fiat_hub_title")} backHref="/app/wallet" />

      <p className="mb-4 text-sm font-semibold text-[color:var(--fd-brown)]">{t("wallet_fiat_hub_tagline")}</p>

      {cfg?.paused ? (
        <p className="wallet-status-banner wallet-status-banner-warn mb-4">{t("wallet_fiat_paused_hint")}</p>
      ) : null}

      <section className="mt-1">
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
        <p className="mt-2 text-[10px] leading-snug text-[color:var(--fd-muted)]">
          {t("wallet_fiat_card_withdraw_soon_hint")}
        </p>
      </section>

      <div className="mt-auto">
        <McBuleliPoweredFooter />
      </div>
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
