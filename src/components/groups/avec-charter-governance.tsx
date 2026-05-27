"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecGovPromptSheet } from "@/components/groups/avec-gov-sheet";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";

export function AvecCharterGovernance({
  groupId,
  publicDescription,
  address,
  contactPhone,
  contactEmail,
  canPropose,
}: {
  groupId: string;
  publicDescription?: string | null;
  address?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  canPropose: boolean;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [askJustification, setAskJustification] = useState(false);

  async function submit(justification: string) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "change_charter",
          justification: justification.trim(),
          payload: {
            publicDescription: publicDescription ?? "",
            address: address ?? "",
            contactPhone: contactPhone ?? "",
            contactEmail: contactEmail ?? "",
          },
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
    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-3">
      <p className="text-[10px] font-bold text-slate-900">{t("avec_charter_gov_title")}</p>
      <p className="mt-0.5 text-[9px] text-slate-700">{t("avec_charter_gov_hint")}</p>
      <button
        type="button"
        disabled={busy}
        onClick={() => setAskJustification(true)}
        className={`${avecCls.btnPrimary} mt-2 !py-1.5 text-[10px]`}
      >
        {t("avec_charter_gov_submit")}
      </button>
      <AvecGovPromptSheet
        open={askJustification}
        title={t("avec_charter_gov_submit")}
        message={t("group_gov_charter_prompt")}
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
