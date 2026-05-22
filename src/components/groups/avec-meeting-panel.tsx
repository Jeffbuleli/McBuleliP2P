"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecIconShares } from "@/components/groups/avec-icons";
import { avecCls } from "@/components/groups/avec-ui";

export function AvecMeetingPanel({
  shareValue,
  socialFundPerMeeting = 0,
  maxShares,
  canContribute,
  busy,
  onPay,
  paySuccess = false,
}: {
  shareValue: number;
  socialFundPerMeeting?: number;
  maxShares: number;
  canContribute: boolean;
  busy: boolean;
  onPay: (shares: number) => Promise<boolean>;
  paySuccess?: boolean;
}) {
  const { t } = useI18n();
  const [shares, setShares] = useState(1);
  const [justPaid, setJustPaid] = useState(false);
  const sharesTotal = shareValue * shares;
  const meetingTotal = sharesTotal + socialFundPerMeeting;

  async function pay() {
    setJustPaid(false);
    const ok = await onPay(shares);
    if (ok) setJustPaid(true);
  }

  const showPaid = paySuccess || justPaid;

  return (
    <div className="space-y-3">
      <div className={`${avecCls.section} flex items-start gap-3`}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--fd-mint)] text-[color:var(--fd-primary)]">
          <AvecIconShares className="h-6 w-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[color:var(--fd-text)]">{t("avec_tab_meeting")}</p>
          <p className="mt-0.5 text-[10px] leading-snug text-[color:var(--fd-muted)]">
            {t("avec_meeting_hint")}
          </p>
        </div>
      </div>

      <div className={avecCls.section}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
          {t("avec_buy_shares")} · {shareValue.toFixed(2)} USDT
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {Array.from({ length: maxShares }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setShares(n)}
              className={`${avecCls.shareChip} ${shares === n ? avecCls.shareChipOn : avecCls.shareChipOff}`}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className={avecCls.sectionTitle}>{t("avec_meeting_total")}</p>
            <p className="text-2xl font-black tabular-nums text-[color:var(--fd-primary)]">
              {meetingTotal.toFixed(2)}
              <span className="ml-1 text-sm font-bold">USDT</span>
            </p>
            {socialFundPerMeeting > 0 ? (
              <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
                {t("avec_meeting_social_line", { amount: socialFundPerMeeting.toFixed(2) })}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy || !canContribute}
            onClick={() => void pay()}
            className={`${avecCls.btnPrimary} !w-auto shrink-0 px-8`}
          >
            {t("group_dash_contribute")}
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[color:var(--fd-muted)]">
          {t("avec_wallet_debit")}
        </p>
        {showPaid ? (
          <p
            className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-900"
            role="status"
          >
            <span aria-hidden>✓</span>
            {t("group_contribution_success")}
          </p>
        ) : null}
      </div>
    </div>
  );
}
