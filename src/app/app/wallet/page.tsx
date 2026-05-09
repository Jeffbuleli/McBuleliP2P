import { getDictionary, interpolate } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";
import { getStakingValuationUsd } from "@/lib/staking-service";
import { getWalletUserState } from "@/lib/wallet-user-state";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { formatWalletAssetBalance } from "@/lib/wallet-balance-format";
import type { WalletAsset } from "@/lib/wallet-types";
import { EXTERNAL_WITHDRAW_FEE_USDT } from "@/lib/withdraw-fees";
import type { Locale } from "@/i18n/locale";
import {
  WalletOverview,
  type ServicePromoDTO,
  type StakingPromoDTO,
  type WalletOverviewLabels,
  type WalletRowDTO,
} from "@/components/mobile/wallet-overview";
import { WalletServicePromos } from "@/components/mobile/wallet-service-promos";
import { PiWalletPaymentSection } from "@/components/pi/pi-wallet-payment";
import { getDb, groupSavingsGroups, groupSavingsMemberships } from "@/db";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

const NAME: Record<WalletAsset, Record<"en" | "fr", string>> = {
  USDT: { en: "Tether · USDT", fr: "Tether · USDT" },
  PI: { en: "Pi Network", fr: "Pi Network" },
  PI_TEST: {
    en: "Pi Test · sandbox (not on-chain Pi)",
    fr: "Pi Test · bac à sable (pas du Pi déposé)",
  },
  USD: { en: "US Dollar", fr: "Dollar US" },
  CDF: { en: "Congolese franc", fr: "Franc congolais" },
};

function toRow(
  row: NonNullable<Awaited<ReturnType<typeof getWalletUserState>>>["lines"][0],
  locale: Locale,
  lang: "en" | "fr",
): WalletRowDTO {
  const depositHref =
    row.asset === "USDT"
      ? "/app/deposit"
      : row.asset === "PI"
        ? "/app/wallet#pi-topup"
        : row.asset === "PI_TEST"
          ? "/admin/settings/pi"
          : "/app/wallet/fiat/deposit";
  const withdrawHref =
    row.asset === "USDT" || row.asset === "PI"
      ? "/app/withdraw"
      : row.asset === "PI_TEST"
        ? "/admin/settings/pi"
      : "/app/wallet/fiat/withdraw";

  return {
    asset: row.asset,
    title: row.asset === "PI_TEST" ? "Pi Test" : row.asset,
    subtitle: NAME[row.asset][lang],
    balanceDisplay: formatWalletAssetBalance(row.balanceNum, row.asset, locale),
    valueUsdApprox: row.valueUsdDisplay,
    depositHref,
    withdrawHref,
  };
}

export default async function WalletPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();
  const d = getDictionary(locale);
  const lang = locale === "fr" ? "fr" : "en";

  if (!userId) {
    return null;
  }

  const stakeVal = await getStakingValuationUsd(userId);
  const state = await getWalletUserState(userId, locale);
  if (!state) {
    return null;
  }

  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const piTestUsd =
    state.lines.find((l) => l.asset === "PI_TEST")?.valueUsd ?? 0;
  const walletUsd =
    state.totalUsd - piTestUsd;
  const mergedUsd =
    walletUsd +
    stakeVal.principalUsd +
    stakeVal.accruedInterestUsd;
  const totalUsdDisplay = mergedUsd.toLocaleString(loc, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  const fmtUsd = (n: number) =>
    n.toLocaleString(loc, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    });

  const stakingPromo: StakingPromoDTO = {
    href: "/app/wallet/staking",
    title: d.staking_title,
    tagline: d.staking_wallet_teaser,
    cta: d.staking_cta,
    activeLine: interpolate(d.staking_active_count, {
      count: stakeVal.activeCount,
    }),
    lockedLabel: d.staking_locked_value,
    lockedDisplay: fmtUsd(stakeVal.principalUsd),
    accruedLabel: d.staking_accrued_value,
    accruedDisplay: fmtUsd(stakeVal.accruedInterestUsd),
    riskShort: d.staking_risk_short,
  };

  const groupPromos: ServicePromoDTO[] = [
    {
      href: "/app/wallet/pool",
      title: d.pool_title,
      tagline: d.pool_tagline,
      cta: d.pool_cta,
      metaLine: d.pool_meta_line,
      tone: "emerald",
    },
    {
      href: "/app/wallet/groups?type=likelimba",
      title: d.group_like_title,
      tagline: d.group_like_tagline,
      cta: d.group_like_cta,
      metaLine: interpolate(d.group_like_meta, { total: 0, active: 0, overdue: 0 }),
      tone: "emerald",
    },
    {
      href: "/app/wallet/groups?type=avec",
      title: d.group_avec_title,
      tagline: d.group_avec_tagline,
      cta: d.group_avec_cta,
      metaLine: interpolate(d.group_avec_meta, { total: 0, active: 0, overdue: 0 }),
      tone: "amber",
    },
    {
      href: "/app/wallet/loans",
      title: d.loans_title,
      tagline: d.loans_tagline,
      cta: d.loans_cta,
      metaLine: d.loans_meta_line,
      tone: "amber",
    },
  ];
  try {
    const db = getDb();
    const memberships = await db
      .select({
        groupId: groupSavingsMemberships.groupId,
        role: groupSavingsMemberships.role,
        status: groupSavingsMemberships.status,
        type: groupSavingsGroups.type,
        gStatus: groupSavingsGroups.status,
        subStatus: groupSavingsGroups.subscriptionStatus,
      })
      .from(groupSavingsMemberships)
      .innerJoin(
        groupSavingsGroups,
        eq(groupSavingsMemberships.groupId, groupSavingsGroups.id),
      )
      .where(eq(groupSavingsMemberships.userId, userId))
      .limit(200);

    const mine = memberships.filter((m) => m.status === "approved");
    const counts = (type: string) => {
      const xs = mine.filter((m) => m.type === type);
      const active = xs.filter((m) => m.gStatus === "active").length;
      const pending = xs.filter((m) => m.gStatus === "pending").length;
      const suspended = xs.filter((m) => m.gStatus === "suspended").length;
      const overdue = xs.filter((m) => m.subStatus !== "active").length;
      return { total: xs.length, active, pending, suspended, overdue };
    };

    const cLike = counts("likelimba");
    const cAvec = counts("avec");

    groupPromos[1] = {
      ...groupPromos[1]!,
      metaLine: interpolate(d.group_like_meta, {
        total: cLike.total,
        active: cLike.active,
        overdue: cLike.overdue,
      }),
    };
    groupPromos[2] = {
      ...groupPromos[2]!,
      metaLine: interpolate(d.group_avec_meta, {
        total: cAvec.total,
        active: cAvec.active,
        overdue: cAvec.overdue,
      }),
    };
  } catch {
    // If DB is unavailable in a build context, keep wallet usable.
  }

  const pct = Math.round(FIAT_FEE_RATE * 100);
  const feeFiat = interpolate(d.wallet_fee_fiat, { pct });
  const feeCrypto = interpolate(d.wallet_fee_crypto_out, {
    feeUsd: EXTERNAL_WITHDRAW_FEE_USDT,
  });

  const cryptoRows = state.lines
    .filter((l) => l.asset === "USDT" || l.asset === "PI")
    .map((l) => toRow(l, locale, lang));
  const fiatRows = state.lines
    .filter((l) => l.asset === "USD" || l.asset === "CDF")
    .map((l) => toRow(l, locale, lang));

  const fiatDepositWithdrawPaused = isFiatDepositWithdrawPaused();

  const labels: WalletOverviewLabels = {
    wallet_title: d.wallet_title,
    wallet_asset_list: d.wallet_asset_list,
    wallet_asset_balance: d.wallet_asset_balance,
    wallet_col_usd: d.wallet_col_usd,
    wallet_no_match: d.wallet_no_match,
    wallet_balance_hint: d.wallet_balance_hint,
    wallet_est_total: d.wallet_est_total,
    wallet_tab_crypto: d.wallet_tab_crypto,
    wallet_tab_account: d.wallet_tab_account,
    wallet_tab_crypto_sub: d.wallet_tab_crypto_sub,
    wallet_tab_account_sub: d.wallet_tab_account_sub,
    wallet_search_placeholder: d.wallet_search_placeholder,
    wallet_add_funds: d.wallet_add_funds,
    wallet_quick_withdraw: d.wallet_quick_withdraw,
    wallet_quick_send: d.wallet_quick_send,
    wallet_row_send: d.wallet_row_send,
    wallet_link_history: d.wallet_link_history,
    wallet_fees_expand: d.wallet_fees_expand,
    wallet_fees_collapse: d.wallet_fees_collapse,
    wallet_fees_title: d.wallet_fees_title,
    wallet_hub_actions: d.wallet_hub_actions,
    hide_balance: d.hide_balance,
    show_balance: d.show_balance,
    feeBulletLines: [
      feeFiat,
      feeCrypto,
      d.wallet_fee_internal,
      d.wallet_crypto_deposit_free,
    ],
    wallet_fiat_paused_hint: d.wallet_fiat_paused_hint,
  };

  return (
    <>
      <WalletOverview
        labels={labels}
        totalUsdDisplay={totalUsdDisplay}
        cryptoRows={cryptoRows}
        fiatRows={fiatRows}
        fiatDepositWithdrawPaused={fiatDepositWithdrawPaused}
      />
      <div id="pi-topup" className="scroll-mt-4">
        <PiWalletPaymentSection />
      </div>
      <WalletServicePromos
        stakingPromo={stakingPromo}
        servicePromos={groupPromos}
      />
    </>
  );
}
