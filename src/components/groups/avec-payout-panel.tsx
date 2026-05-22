"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import type { AvecMemberRow } from "@/components/groups/avec-member-list";
import { clientErrorText } from "@/lib/client-error-text";

export function AvecPayoutPanel({
  groupId,
  members,
  onDone,
}: {
  groupId: string;
  members: AvecMemberRow[];
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [toUserId, setToUserId] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const approved = members.filter((m) => m.status === "approved");

  async function submit() {
    const n = Number(amount.replace(",", "."));
    if (!toUserId || !Number.isFinite(n) || n <= 0) return;
    setBusy(true);
    setErr(null);
    setOk(false);
    try {
      const res = await fetch(`/api/groups/${groupId}/payouts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId, amountUsdt: n }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setOk(true);
      setAmount("");
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={avecCls.section}>
      <p className={avecCls.sectionTitle}>{t("avec_payout_title")}</p>
      <p className="mb-3 text-[10px] text-[color:var(--fd-muted)]">{t("avec_payout_sub")}</p>
      <select
        value={toUserId}
        onChange={(e) => setToUserId(e.target.value)}
        className={`${avecCls.input} mb-2`}
      >
        <option value="">{t("avec_payout_select")}</option>
        {approved.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.email}
          </option>
        ))}
      </select>
      <input
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        inputMode="decimal"
        placeholder="USDT"
        className={avecCls.input}
      />
      {ok ? (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-800" role="status">
          <span aria-hidden>✓</span>
          {t("group_payout_success")}
        </p>
      ) : null}
      {err ? (
        <p className="mt-2 text-xs text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className={`${avecCls.btnPrimary} mt-3`}
      >
        {t("avec_payout_send")}
      </button>
    </div>
  );
}
