"use client";

import QRCode from "react-qr-code";
import { useI18n } from "@/components/i18n-provider";
import { ProfileIdCopy } from "@/components/profile/profile-id-copy";
import { walletPayUri } from "@/lib/wallet-pay-uri";

export function ProfilePayQrCard({ userId }: { userId: string }) {
  const { t } = useI18n();
  const uri = walletPayUri(userId);

  return (
    <section className="fd-card flex flex-col items-center px-4 py-5 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("profile_pay_qr_title")}
      </p>
      <p className="mt-1 max-w-[16rem] text-[11px] leading-snug text-[color:var(--fd-muted)]">
        {t("profile_pay_qr_hint")}
      </p>
      <div className="mt-4 rounded-2xl border border-[color:var(--fd-border)] bg-white p-3 shadow-sm">
        <QRCode value={uri} size={148} level="M" />
      </div>
      <div className="mt-3 flex max-w-full items-center gap-1.5 rounded-full border border-[color:var(--fd-border)] bg-stone-50 px-2.5 py-1">
        <span className="truncate font-mono text-[10px] text-[color:var(--fd-muted)]">
          {userId.slice(0, 8)}…
        </span>
        <ProfileIdCopy
          id={userId}
          copyLabel={t("profile_id_copy")}
          copiedLabel={t("profile_id_copied")}
          variant="light"
        />
      </div>
    </section>
  );
}
