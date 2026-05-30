import { activityNetworkLabel } from "@/lib/activity-network-label";
import type { EmailLocale } from "@/lib/email/locale";
import type { McBuleliTemplateKind } from "@/lib/email/template-definitions";
import { formatWalletHistoryAmount } from "@/lib/wallet-types";

export type EmailDetailRow = { label: string; value: string };

const LABELS = {
  fr: {
    amount: "Montant",
    network: "Réseau",
    fee: "Frais de retrait",
    total: "Total débité",
    address: "Adresse",
    depositAddress: "Adresse de dépôt",
    txid: "TXID",
    reason: "Motif",
  },
  en: {
    amount: "Amount",
    network: "Network",
    fee: "Withdrawal fee",
    total: "Total debited",
    address: "Address",
    depositAddress: "Deposit address",
    txid: "TXID",
    reason: "Reason",
  },
} as const;

function isDepositConfirmedKind(kind: McBuleliTemplateKind): boolean {
  return kind === "depositUsdt" || kind === "depositPi";
}

function isDepositPendingKind(kind: McBuleliTemplateKind): boolean {
  return kind === "depositPendingUsdt" || kind === "depositPendingPi";
}

function isDepositIntentKind(kind: McBuleliTemplateKind): boolean {
  return kind === "depositIntentUsdt" || kind === "depositIntentPi";
}

function isWithdrawQueuedKind(kind: McBuleliTemplateKind): boolean {
  return kind === "withdrawQueuedUsdt" || kind === "withdrawQueuedPi";
}

function isWithdrawClaimedKind(kind: McBuleliTemplateKind): boolean {
  return kind === "withdrawClaimedUsdt" || kind === "withdrawClaimedPi";
}

function isWithdrawRejectedKind(kind: McBuleliTemplateKind): boolean {
  return kind === "withdrawRejectedUsdt" || kind === "withdrawRejectedPi";
}

export function walletTemplateVariables(
  kind: McBuleliTemplateKind,
): string[] {
  if (isDepositIntentKind(kind)) {
    return ["ACTION_URL", "AMOUNT", "ASSET", "NETWORK", "ADDRESS"];
  }
  if (isDepositConfirmedKind(kind) || isDepositPendingKind(kind)) {
    return ["ACTION_URL", "AMOUNT", "ASSET", "NETWORK", "TXID"];
  }
  if (isWithdrawQueuedKind(kind) || isWithdrawClaimedKind(kind)) {
    return ["ACTION_URL", "AMOUNT", "ASSET", "NETWORK", "FEE", "TOTAL", "ADDRESS"];
  }
  if (isWithdrawRejectedKind(kind)) {
    return [
      "ACTION_URL",
      "AMOUNT",
      "ASSET",
      "NETWORK",
      "FEE",
      "TOTAL",
      "ADDRESS",
      "REASON",
    ];
  }
  return [
    "ACTION_URL",
    "AMOUNT",
    "ASSET",
    "NETWORK",
    "FEE",
    "TOTAL",
    "ADDRESS",
    "TXID",
  ];
}

export function buildWalletDetailRows(args: {
  kind: McBuleliTemplateKind;
  locale: EmailLocale;
  resendPlaceholders?: boolean;
  amount: string;
  asset: string;
  networkCanonical: string;
  fee?: string;
  total?: string;
  address?: string;
  txid?: string;
  reason?: string;
}): EmailDetailRow[] {
  const L = LABELS[args.locale];
  const v = (key: string, fallback: string) =>
    args.resendPlaceholders ? `{{{${key}}}}` : fallback;

  const network =
    args.resendPlaceholders
      ? v("NETWORK", "")
      : activityNetworkLabel(args.locale, args.networkCanonical);

  if (isDepositIntentKind(args.kind)) {
    return [
      {
        label: L.amount,
        value: args.resendPlaceholders
          ? `${v("AMOUNT", "")} ${v("ASSET", "")}`
          : `${args.amount} ${args.asset}`,
      },
      { label: L.network, value: network },
      {
        label: L.depositAddress,
        value: v("ADDRESS", args.address ?? "—"),
      },
    ];
  }

  if (isDepositConfirmedKind(args.kind) || isDepositPendingKind(args.kind)) {
    return [
      {
        label: L.amount,
        value: args.resendPlaceholders
          ? `${v("AMOUNT", "")} ${v("ASSET", "")}`
          : `${args.amount} ${args.asset}`,
      },
      { label: L.network, value: network },
      { label: L.txid, value: v("TXID", args.txid ?? "—") },
    ];
  }

  const rows: EmailDetailRow[] = [
    {
      label: L.amount,
      value: args.resendPlaceholders
        ? `${v("AMOUNT", "")} ${v("ASSET", "")}`
        : `${args.amount} ${args.asset}`,
    },
    { label: L.fee, value: v("FEE", args.fee ?? "—") },
    { label: L.total, value: v("TOTAL", args.total ?? "—") },
    { label: L.network, value: network },
    { label: L.address, value: v("ADDRESS", args.address ?? "—") },
  ];

  if (isWithdrawRejectedKind(args.kind)) {
    rows.push({ label: L.reason, value: v("REASON", args.reason ?? "—") });
    return rows;
  }

  if (!isWithdrawQueuedKind(args.kind) && !isWithdrawClaimedKind(args.kind)) {
    rows.push({ label: L.txid, value: v("TXID", args.txid ?? "—") });
  }
  return rows;
}

export function truncateMiddle(value: string, head = 10, tail = 8): string {
  const s = value.trim();
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function formatCryptoAmount(value: string, asset = ""): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  const n = Number(trimmed);
  if (!Number.isFinite(n)) return trimmed;
  if (asset) return formatWalletHistoryAmount(asset, trimmed);
  const s = n.toLocaleString("en-US", {
    maximumFractionDigits: 8,
    useGrouping: false,
  });
  if (!s.includes(".")) return s;
  return s.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
}

export function withdrawTotalDebited(
  amount: string,
  fee: string,
  asset = "",
): string {
  const a = Number(amount);
  const f = Number(fee);
  if (!Number.isFinite(a) || !Number.isFinite(f)) return amount;
  return formatCryptoAmount(String(a + f), asset);
}
