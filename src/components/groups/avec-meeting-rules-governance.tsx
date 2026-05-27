"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecGovPromptSheet } from "@/components/groups/avec-gov-sheet";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

export function AvecMeetingRulesGovernance({
  groupId,
  maxSharesPerMeeting,
  cycleDurationDays,
  meetingIntervalDays,
  canPropose,
}: {
  groupId: string;
  maxSharesPerMeeting: number;
  cycleDurationDays: number;
  meetingIntervalDays: number;
  canPropose: boolean;
}) {
  const { t } = useI18n();
  const [maxShares, setMaxShares] = useState(String(maxSharesPerMeeting));
  const [cycleDays, setCycleDays] = useState(String(cycleDurationDays));
  const [meetingDays, setMeetingDays] = useState(String(meetingIntervalDays));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [askJustification, setAskJustification] = useState(false);

  async function submit(justification: string) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const payload: Record<string, number> = {};
      const ms = Number(maxShares);
      const cd = Number(cycleDays);
      const md = Number(meetingDays);
      if (Number.isFinite(ms) && ms >= 1 && ms <= 5) payload.maxSharesPerMeeting = ms;
      if (Number.isFinite(cd) && cd >= 30 && cd <= 720) payload.cycleDurationDays = cd;
      if (Number.isFinite(md) && md >= 1 && md <= 31) payload.meetingIntervalDays = md;
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "change_meeting_rules",
          justification: justification.trim(),
          payload,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setAskJustification(false);
      setInfo(t("group_gov_proposal_submitted"));
    } finally {
      setBusy(false);
    }
  }

  if (!canPropose) return null;

  return (
    <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50/80 p-3">
      <p className="text-[10px] font-bold text-stone-900">{t("avec_meeting_rules_gov_title")}</p>
      <p className="mt-0.5 text-[9px] text-stone-700">{t("avec_meeting_rules_gov_hint")}</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <label className="block">
          <span className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_meeting_rules_max_shares")}
          </span>
          <input
            value={maxShares}
            onChange={(e) => setMaxShares(e.target.value)}
            className={`${avecCls.input} mt-0.5 w-full !py-1 text-xs`}
          />
        </label>
        <label className="block">
          <span className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_meeting_rules_cycle_days")}
          </span>
          <input
            value={cycleDays}
            onChange={(e) => setCycleDays(e.target.value)}
            className={`${avecCls.input} mt-0.5 w-full !py-1 text-xs`}
          />
        </label>
        <label className="block">
          <span className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_meeting_rules_interval")}
          </span>
          <input
            value={meetingDays}
            onChange={(e) => setMeetingDays(e.target.value)}
            className={`${avecCls.input} mt-0.5 w-full !py-1 text-xs`}
          />
        </label>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={() => setAskJustification(true)}
        className={`${avecCls.btnPrimary} mt-2 !py-1.5 text-[10px]`}
      >
        {t("avec_meeting_rules_submit")}
      </button>
      <AvecGovPromptSheet
        open={askJustification}
        title={t("avec_meeting_rules_submit")}
        message={t("group_gov_meeting_rules_prompt")}
        busy={busy}
        onCancel={() => setAskJustification(false)}
        onSubmit={(justification) => void submit(justification)}
      />
      {info ? <p className="mt-2 text-[10px] text-emerald-800">{info}</p> : null}
      {err ? (
        <p className="mt-2 text-[10px] text-rose-800">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
