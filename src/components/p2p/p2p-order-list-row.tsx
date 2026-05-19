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
        className="fd-card flex items-center gap-3 p-3 transition active:scale-[0.99]"
      >
        {icon ? (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)]">
            <Image src={icon} alt="" width={36} height={36} className="rounded-full" />
          </span>
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-xs font-bold text-[color:var(--fd-primary)]">
            {order.asset}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold tabular-nums text-[color:var(--fd-text)]">
            {fmt(order.fiatAmount, order.fiatCurrency)} → {order.cryptoAmount} {order.asset}
          </p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
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
