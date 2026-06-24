"use client";

import QRCode from "react-qr-code";
import { useI18n } from "@/components/i18n-provider";
import { buildP2pMomoQrPayload } from "@/lib/p2p-momo-qr";

export function P2pMomoPayQr({
  phone,
  amount,
  currency,
  orderId,
  payeeName,
}: {
  phone: string;
  amount: string;
  currency: string;
  orderId: string;
  payeeName?: string | null;
}) {
  const { t } = useI18n();
  const payload = buildP2pMomoQrPayload({ phone, amount, currency, orderId, payeeName });

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-[color:var(--fd-border)] bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("p2p_momo_qr_title")}
      </p>
      <div className="rounded-xl bg-white p-2 ring-1 ring-[color:var(--fd-border)]">
        <QRCode value={payload} size={148} level="M" />
      </div>
      <p className="text-center text-[10px] font-semibold text-[color:var(--fd-muted)]">
        {t("p2p_momo_qr_hint")}
      </p>
    </div>
  );
}
