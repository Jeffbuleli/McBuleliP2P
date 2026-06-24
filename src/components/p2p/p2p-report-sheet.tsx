"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { P2pConfirmSheet } from "@/components/p2p/p2p-confirm-sheet";
import { P2pIllusReport } from "@/components/p2p/p2p-illustrations";
import type { Messages } from "@/i18n/messages";
import { clientErrorText } from "@/lib/client-error-text";
import { FlowError } from "@/components/p2p/p2p-flow-ui";

const REASONS = ["scam", "abuse", "no_payment", "no_release", "other"] as const;

type Props = {
  open: boolean;
  reportedUserId: string;
  orderId?: string;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function P2pReportSheet({
  open,
  reportedUserId,
  orderId,
  onClose,
  onSubmitted,
}: Props) {
  const { t } = useI18n();
  const [reason, setReason] = useState<(typeof REASONS)[number]>("scam");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const res = await fetch("/api/p2p/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId,
          orderId,
          reason,
          details: details.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(typeof data.error === "string" ? data.error : "p2p_report_failed");
        return;
      }
      onSubmitted?.();
      onClose();
      setDetails("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <P2pConfirmSheet
      open={open}
      variant="danger"
      illustration={<P2pIllusReport />}
      title={t("p2p_report_title")}
      subtitle={t("p2p_report_sub")}
      confirmLabel={t("p2p_report_submit")}
      cancelLabel={t("p2p_confirm_common_cancel")}
      busy={busy}
      onClose={onClose}
      onConfirm={() => void submit()}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ${
                reason === r
                  ? "bg-rose-600 text-white ring-rose-600"
                  : "bg-white text-[color:var(--fd-muted)] ring-[color:var(--fd-border)]"
              }`}
            >
              {t(`p2p_report_reason_${r}` as keyof Messages)}
            </button>
          ))}
        </div>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder={t("p2p_report_details_ph")}
          className="w-full rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2 text-xs text-[color:var(--fd-text)]"
        />
        {err ? <FlowError>{clientErrorText(t, err)}</FlowError> : null}
      </div>
    </P2pConfirmSheet>
  );
}
