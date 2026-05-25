"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

export function AvecLoanRatesGovernance({
  groupId,
  interestPct,
  penaltyPct,
  canPropose,
  onDone,
}: {
  groupId: string;
  interestPct: number;
  penaltyPct: number;
  canPropose: boolean;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const [newInterest, setNewInterest] = useState(String(interestPct));
  const [newPenalty, setNewPenalty] = useState(String(penaltyPct));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function propose(type: "change_interest_rate" | "change_penalty_rate") {
    const isInterest = type === "change_interest_rate";
    const n = Number((isInterest ? newInterest : newPenalty).replace(",", "."));
    if (!Number.isFinite(n)) return;
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          justification: isInterest
            ? t("group_gov_interest_rate_justification", { rate: n.toFixed(0) })
            : t("group_gov_penalty_rate_justification", { rate: n.toFixed(0) }),
          payload: isInterest
            ? { interestRatePctTotal: n }
            : { penaltyRatePctTotal: n },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setInfo(t("group_gov_proposal_submitted"));
      onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-2xl border border-violet-200/80 bg-violet-50/40 p-3">
      <p className="text-[10px] font-bold text-violet-900">{t("avec_loan_rates_gov_title")}</p>
      <p className="mt-0.5 text-[9px] text-violet-800">{t("avec_loan_rates_gov_hint")}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_loan_rate_interest")}
          </span>
          <input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            inputMode="decimal"
            disabled={!canPropose || busy}
            className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
          />
        </label>
        <label className="block">
          <span className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_loan_rate_penalty")}
          </span>
          <input
            value={newPenalty}
            onChange={(e) => setNewPenalty(e.target.value)}
            inputMode="decimal"
            disabled={!canPropose || busy}
            className={`${avecCls.input} mt-0.5 w-full !py-1.5 text-xs`}
          />
        </label>
      </div>
      {canPropose ? (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void propose("change_interest_rate")}
            className="rounded-full bg-violet-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("avec_loan_propose_interest")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void propose("change_penalty_rate")}
            className="rounded-full border border-violet-300 bg-white px-3 py-1.5 text-[10px] font-bold text-violet-900 disabled:opacity-50"
          >
            {t("avec_loan_propose_penalty")}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[9px] text-[color:var(--fd-muted)]">{t("avec_loan_rates_members_hint")}</p>
      )}
      {info ? <p className="mt-2 text-[10px] font-semibold text-emerald-800">{info}</p> : null}
      {err ? (
        <p className="mt-2 text-[10px] text-rose-700">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
