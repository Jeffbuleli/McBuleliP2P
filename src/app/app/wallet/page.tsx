import { getDictionary, interpolate } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { getStakingValuationUsd } from "@/lib/staking-service";
import { getWalletUserState } from "@/lib/wallet-user-state";
import { formatWalletAssetBalance } from "@/lib/wallet-balance-format";
import type { WalletAsset } from "@/lib/wallet-types";
import type { Locale } from "@/i18n/locale";
import {
  WalletOverview,
  type ServicePromoDTO,
  type StakingPromoDTO,
  type WalletOverviewLabels,
  type WalletRowDTO,
} from "@/components/mobile/wallet-overview";
import { WalletServicePromos } from "@/components/mobile/wallet-service-promos";
import { getDb, groupSavingsGroups, groupSavingsMemberships } from "@/db";
import { eq } from "drizzle-orm";
import { poolNewDepositsEnabled } from "@/lib/pool-features";

export const dynamic = "force-dynamic";

const NAME: Record<WalletAsset, Record<"en" | "fr", string>> = {
  USDT: { en: "Tether · USDT", fr: "Tether · USDT" },
  PI: { en: "Pi Network", fr: "Pi Network" },
  PI_TEST: {
    en: "Pi Test · training (Pi Network sandbox)",
    fr: "Pi Test · entraînement (bac à sable Pi)",
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
    row.asset === "PI_TEST"
      ? "/app/wallet/pi-test"
      : `/app/deposit?asset=${row.asset}`;
  const withdrawHref =
    row.asset === "PI"
      ? "/app/withdraw?asset=PI"
      : row.asset === "PI_TEST"
        ? "/app/wallet/pi-test"
        : "/app/withdraw";

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

  const poolPromo: ServicePromoDTO | null = poolNewDepositsEnabled()
    ? {
        href: "/app/wallet/pool",
        title: d.pool_title,
        tagline: d.pool_tagline,
        cta: d.pool_cta,
        metaLine: d.pool_meta_line,
        tone: "emerald",
        icon: "pool",
      }
    : null;

  let avecGroupsTotal = 0;
  let avecGroupsActive = 0;
  let avecGroupsOverdue = 0;
  const avecPromoBase = {
    href: "/app/wallet/groups",
    title: d.group_avec_title,
    tagline: d.group_avec_tagline,
    cta: d.group_avec_cta,
    metaLine: interpolate(d.group_avec_meta, { total: 0, active: 0, overdue: 0 }),
    tone: "amber" as const,
    icon: "avec" as const,
    rightPrimary: "0",
    rightSecondary: d.group_avec_tagline,
  };
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

    const allGroups = mine.filter(
      (m) => m.type === "avec" || m.type === "likelimba",
    );
    const active = allGroups.filter((m) => m.gStatus === "active").length;
    const overdue = allGroups.filter((m) => m.subStatus !== "active").length;

    avecGroupsTotal = allGroups.length;
    avecGroupsActive = active;
    avecGroupsOverdue = overdue;
  } catch {
    // If DB is unavailable in a build context, keep wallet usable.
  }

  const cryptoRows = state.lines
    .filter((l) => l.asset === "USDT" || l.asset === "PI")
    .map((l) => toRow(l, locale, lang));

  const labels: WalletOverviewLabels = {
    wallet_title: d.wallet_title,
    wallet_asset_list: d.wallet_asset_list,
    wallet_asset_balance: d.wallet_asset_balance,
    wallet_col_usd: d.wallet_col_usd,
    wallet_no_match: d.wallet_no_match,
    wallet_est_total: d.wallet_est_total,
    wallet_search_placeholder: d.wallet_search_placeholder,
    wallet_action_deposit: d.wallet_action_deposit,
    wallet_action_withdraw: d.wallet_action_withdraw,
    wallet_action_send: d.wallet_action_send,
    wallet_link_history: d.wallet_link_history,
    hide_balance: d.hide_balance,
    show_balance: d.show_balance,
    wallet_crypto_only_hint: d.wallet_crypto_only_hint,
  };

  return (
    <>
      <WalletOverview
        labels={labels}
        totalUsdDisplay={totalUsdDisplay}
        cryptoRows={cryptoRows}
      />
      <WalletServicePromos
        stakingPromo={stakingPromo}
        poolPromo={poolPromo}
        avecPromo={{
          ...avecPromoBase,
          metaLine: interpolate(d.group_avec_meta, {
            total: avecGroupsTotal,
            active: avecGroupsActive,
            overdue: avecGroupsOverdue,
          }),
          rightPrimary: String(avecGroupsTotal),
          rightSecondary: d.group_avec_tagline,
        }}
      />
    </>
  );
}
