"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import { p2pStatusLabelKey } from "@/components/p2p/p2p-status-badge";
import { StatusPill } from "@/components/wallet/transaction-progress";

const ASSET_ICON: Record<string, string> = {
  USDT: "/assets/crypto/usdt.png",
  PI: "/assets/crypto/pi.png",
};

export type P2pOrderRow = {
  id: string;
  asset: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoAmount: string;
  status: string;
  role: "maker" | "taker";
};

function statusPillVariant(
  status: string,
): "success" | "failed" | "pending" | "processing" {
  if (status === "released") return "success";
  if (status === "cancelled" || status === "expired" || status === "refunded") {
    return "failed";
  }
  if (status === "disputed") return "failed";
  if (status === "paid") return "processing";
  return "pending";
}

export function P2pOrderListRow({
  order,
  fmt,
  locale,
}: {
  order: P2pOrderRow;
  fmt: (n: string, cur: string) => string;
  locale: string;
}) {
  const { t } = useI18n();
  const icon = ASSET_ICON[order.asset];
  return (
    <li>
      <Link
        href={`/app/p2p/order/${order.id}`}
        className="flex items-center gap-3 rounded-2xl border border-stone-700 bg-stone-900 p-3 transition active:scale-[0.99]"
      >
        {icon ? (
          <Image src={icon} alt="" width={40} height={40} className="rounded-full" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--fd-mint)] text-xs font-bold">
            {order.asset}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tabular-nums text-stone-50">
            {fmt(order.fiatAmount, order.fiatCurrency)} → {order.cryptoAmount} {order.asset}
          </p>
          <p className="text-[10px] text-stone-400">
            {order.role === "maker" ? t("p2p_home_role_maker") : t("p2p_home_role_taker")}
          </p>
        </div>
        <StatusPill
          variant={statusPillVariant(order.status)}
          label={t(p2pStatusLabelKey(order.status))}
        />
      </Link>
    </li>
  );
}
