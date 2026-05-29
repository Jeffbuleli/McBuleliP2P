import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { appBaseUrl } from "@/lib/email/config";
import type { EmailLocale } from "@/lib/email/locale";
import { sendMcBuleliWalletCryptoEmail } from "@/lib/email/send-wallet-crypto";
import type { McBuleliTemplateKind } from "@/lib/email/template-definitions";
import { activityNetworkLabel } from "@/lib/activity-network-label";
import {
  buildWalletDetailRows,
  formatCryptoAmount,
  truncateMiddle,
  withdrawTotalDebited,
} from "@/lib/email/wallet-email-details";

const DEFAULT_LOCALE: EmailLocale = "fr";

async function userEmail(userId: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const email = row?.email?.trim();
  return email || null;
}

function assetKind(
  asset: string,
  usdtKind: McBuleliTemplateKind,
  piKind: McBuleliTemplateKind,
): McBuleliTemplateKind {
  return asset.toUpperCase() === "PI" ? piKind : usdtKind;
}

function logEmailError(label: string, err: unknown) {
  console.error(`[email] ${label}`, err);
}

export async function notifyDepositConfirmedEmail(args: {
  userId: string;
  depositId: string;
  asset: string;
  amount: string;
  networkCanonical: string;
  txid: string;
  locale?: EmailLocale;
}): Promise<void> {
  const to = await userEmail(args.userId);
  if (!to) return;

  const locale = args.locale ?? DEFAULT_LOCALE;
  const asset = args.asset.toUpperCase();
  const kind = assetKind(args.asset, "depositUsdt", "depositPi");
  const amount = formatCryptoAmount(args.amount);
  const network = activityNetworkLabel(locale, args.networkCanonical);
  const txid = args.txid.trim();

  try {
    await sendMcBuleliWalletCryptoEmail({
      to,
      kind,
      locale,
      actionUrl: `${appBaseUrl()}/app/deposit/${args.depositId}`,
      variables: {
        AMOUNT: amount,
        ASSET: asset,
        NETWORK: network,
        TXID: txid,
      },
      detailRows: buildWalletDetailRows({
        kind,
        locale,
        amount,
        asset,
        networkCanonical: args.networkCanonical,
        txid,
      }),
    });
  } catch (e) {
    logEmailError("deposit_confirmed", e);
  }
}

export async function notifyWithdrawalQueuedEmail(args: {
  userId: string;
  withdrawalId: string;
  asset: string;
  amount: string;
  fee: string;
  networkCanonical: string;
  address: string;
  locale?: EmailLocale;
}): Promise<void> {
  const to = await userEmail(args.userId);
  if (!to) return;

  const locale = args.locale ?? DEFAULT_LOCALE;
  const asset = args.asset.toUpperCase();
  const kind = assetKind(
    args.asset,
    "withdrawQueuedUsdt",
    "withdrawQueuedPi",
  );
  const amount = formatCryptoAmount(args.amount);
  const fee = formatCryptoAmount(args.fee);
  const total = withdrawTotalDebited(args.amount, args.fee);
  const network = activityNetworkLabel(locale, args.networkCanonical);
  const address = truncateMiddle(args.address.trim(), 12, 10);

  try {
    await sendMcBuleliWalletCryptoEmail({
      to,
      kind,
      locale,
      actionUrl: `${appBaseUrl()}/app/wallet/activity/withdraw/${args.withdrawalId}`,
      variables: {
        AMOUNT: amount,
        ASSET: asset,
        NETWORK: network,
        FEE: fee,
        TOTAL: total,
        ADDRESS: address,
      },
      detailRows: buildWalletDetailRows({
        kind,
        locale,
        amount,
        asset,
        networkCanonical: args.networkCanonical,
        fee,
        total,
        address,
      }),
    });
  } catch (e) {
    logEmailError("withdrawal_queued", e);
  }
}

export async function notifyWithdrawalCompletedEmail(args: {
  userId: string;
  withdrawalId: string;
  asset: string;
  amount: string;
  fee: string;
  networkCanonical: string;
  address: string;
  txid: string;
  locale?: EmailLocale;
}): Promise<void> {
  const to = await userEmail(args.userId);
  if (!to) return;

  const locale = args.locale ?? DEFAULT_LOCALE;
  const asset = args.asset.toUpperCase();
  const kind = assetKind(args.asset, "withdrawUsdt", "withdrawPi");
  const amount = formatCryptoAmount(args.amount);
  const fee = formatCryptoAmount(args.fee);
  const total = withdrawTotalDebited(args.amount, args.fee);
  const network = activityNetworkLabel(locale, args.networkCanonical);
  const address = truncateMiddle(args.address.trim(), 12, 10);
  const txid = args.txid.trim();

  try {
    await sendMcBuleliWalletCryptoEmail({
      to,
      kind,
      locale,
      actionUrl: `${appBaseUrl()}/app/wallet/activity/withdraw/${args.withdrawalId}`,
      variables: {
        AMOUNT: amount,
        ASSET: asset,
        NETWORK: network,
        FEE: fee,
        TOTAL: total,
        ADDRESS: address,
        TXID: txid,
      },
      detailRows: buildWalletDetailRows({
        kind,
        locale,
        amount,
        asset,
        networkCanonical: args.networkCanonical,
        fee,
        total,
        address,
        txid,
      }),
    });
  } catch (e) {
    logEmailError("withdrawal_completed", e);
  }
}
