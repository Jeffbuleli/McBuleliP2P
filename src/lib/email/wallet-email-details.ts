import { activityNetworkLabel } from "@/lib/activity-network-label";
import type { EmailLocale } from "@/lib/email/locale";
import type { McBuleliTemplateKind } from "@/lib/email/template-definitions";

export type EmailDetailRow = { label: string; value: string };

const LABELS = {
  fr: {
    amount: "Montant",
    network: "Réseau",
    fee: "Frais de retrait",
    total: "Total débité",
    address: "Adresse",
    txid: "TXID",
  },
  en: {
    amount: "Amount",
    network: "Network",
    fee: "Withdrawal fee",
    total: "Total debited",
    address: "Address",
    txid: "TXID",
  },
} as const;

function isDepositKind(kind: McBuleliTemplateKind): boolean {
  return kind === "depositUsdt" || kind === "depositPi";
}

function isWithdrawQueuedKind(kind: McBuleliTemplateKind): boolean {
  return kind === "withdrawQueuedUsdt" || kind === "withdrawQueuedPi";
}

export function walletTemplateVariables(
  kind: McBuleliTemplateKind,
): string[] {
  if (isDepositKind(kind)) {
    return ["ACTION_URL", "AMOUNT", "ASSET", "NETWORK", "TXID"];
  }
  if (isWithdrawQueuedKind(kind)) {
    return ["ACTION_URL", "AMOUNT", "ASSET", "NETWORK", "FEE", "TOTAL", "ADDRESS"];
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
}): EmailDetailRow[] {
  const L = LABELS[args.locale];
  const v = (key: string, fallback: string) =>
    args.resendPlaceholders ? `{{{${key}}}}` : fallback;

  const network =
    args.resendPlaceholders
      ? v("NETWORK", "")
      : activityNetworkLabel(args.locale, args.networkCanonical);

  if (isDepositKind(args.kind)) {
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
  if (!isWithdrawQueuedKind(args.kind)) {
    rows.push({ label: L.txid, value: v("TXID", args.txid ?? "—") });
  }
  return rows;
}

export function truncateMiddle(value: string, head = 10, tail = 8): string {
  const s = value.trim();
  if (s.length <= head + tail + 1) return s;
  return `${s.slice(0, head)}…${s.slice(-tail)}`;
}

export function formatCryptoAmount(value: string): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return value.trim();
  return n
    .toLocaleString("en-US", {
      maximumFractionDigits: 8,
      useGrouping: false,
    })
    .replace(/\.?0+$/, "");
}

export function withdrawTotalDebited(amount: string, fee: string): string {
  const a = Number(amount);
  const f = Number(fee);
  if (!Number.isFinite(a) || !Number.isFinite(f)) return amount;
  return formatCryptoAmount(String(a + f));
}
