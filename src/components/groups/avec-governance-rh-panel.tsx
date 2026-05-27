"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecGovPromptSheet } from "@/components/groups/avec-gov-sheet";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import { p2pDisplayName } from "@/lib/p2p-display";
import { groupRoleLabel } from "@/lib/group-role-label";

type MemberRow = {
  userId: string;
  role: string;
  email: string;
  displayName?: string | null;
};

export function AvecGovernanceRhPanel({
  groupId,
  members,
  myUserId,
}: {
  groupId: string;
  members: MemberRow[];
  myUserId: string;
}) {
  const { t } = useI18n();
  const [revokeTarget, setRevokeTarget] = useState("");
  const [appointTarget, setAppointTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [promptType, setPromptType] = useState<"revoke_admin" | "appoint_admin" | null>(null);

  const coAdmins = useMemo(
    () => members.filter((m) => m.role === "co_admin"),
    [members],
  );
  const appointCandidates = useMemo(
    () => members.filter((m) => m.role !== "admin"),
    [members],
  );

  function memberLabel(m: MemberRow): string {
    return p2pDisplayName({
      email: m.email,
      displayName: m.displayName ?? null,
      avatarUrl: null,
      piUsername: null,
    });
  }

  async function submit(
    type: "revoke_admin" | "appoint_admin",
    targetUserId: string,
    justification: string,
  ) {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          justification: justification.trim(),
          payload: { targetUserId },
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setPromptType(null);
      setInfo(t("group_gov_proposal_submitted"));
      if (type === "revoke_admin") setRevokeTarget("");
      else setAppointTarget("");
    } finally {
      setBusy(false);
    }
  }

  if (coAdmins.length === 0 && appointCandidates.length <= 1) return null;

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-violet-50/40 p-3">
      <p className="text-[10px] font-bold text-violet-950">{t("avec_gov_rh_title")}</p>
      <p className="mt-0.5 text-[9px] text-violet-900/90">{t("avec_gov_rh_hint")}</p>

      {coAdmins.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_gov_rh_revoke_co_admin")}
          </p>
          <select
            value={revokeTarget}
            onChange={(e) => setRevokeTarget(e.target.value)}
            disabled={busy}
            className={`${avecCls.input} w-full !py-1.5 text-xs`}
          >
            <option value="">{t("avec_gov_rh_select_member")}</option>
            {coAdmins.map((m) => (
              <option key={m.userId} value={m.userId} disabled={m.userId === myUserId}>
                {memberLabel(m)} · {groupRoleLabel(t, m.role)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !revokeTarget}
            onClick={() => setPromptType("revoke_admin")}
            className="rounded-full bg-violet-800 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("avec_gov_rh_revoke_submit")}
          </button>
        </div>
      ) : null}

      {appointCandidates.length > 0 ? (
        <div className="mt-3 space-y-1.5">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("avec_gov_rh_appoint_admin")}
          </p>
          <select
            value={appointTarget}
            onChange={(e) => setAppointTarget(e.target.value)}
            disabled={busy}
            className={`${avecCls.input} w-full !py-1.5 text-xs`}
          >
            <option value="">{t("avec_gov_rh_select_member")}</option>
            {appointCandidates.map((m) => (
              <option key={m.userId} value={m.userId}>
                {memberLabel(m)} · {groupRoleLabel(t, m.role)}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={busy || !appointTarget}
            onClick={() => setPromptType("appoint_admin")}
            className="rounded-full bg-[color:var(--fd-primary)] px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("avec_gov_rh_appoint_submit")}
          </button>
        </div>
      ) : null}

      {info ? <p className="mt-2 text-[10px] text-emerald-800">{info}</p> : null}
      {err ? (
        <p className="mt-2 text-[10px] text-rose-800">{clientErrorText(t, err)}</p>
      ) : null}
      <AvecGovPromptSheet
        open={Boolean(promptType)}
        title={
          promptType === "revoke_admin"
            ? t("avec_gov_rh_revoke_submit")
            : t("avec_gov_rh_appoint_submit")
        }
        message={
          promptType === "revoke_admin"
            ? t("group_gov_revoke_admin_prompt")
            : t("group_gov_appoint_admin_prompt")
        }
        busy={busy}
        onCancel={() => setPromptType(null)}
        onSubmit={(justification) => {
          if (promptType === "revoke_admin" && revokeTarget) {
            void submit("revoke_admin", revokeTarget, justification);
          } else if (promptType === "appoint_admin" && appointTarget) {
            void submit("appoint_admin", appointTarget, justification);
          }
        }}
      />
    </div>
  );
}
