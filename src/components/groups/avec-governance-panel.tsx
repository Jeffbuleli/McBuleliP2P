"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import { groupRoleLabel } from "@/lib/group-role-label";
import { p2pDisplayName } from "@/lib/p2p-display";
import { DEFAULT_GOVERNANCE_RULES } from "@/lib/avec/governance/rules";
import type { GovernanceMode } from "@/lib/avec/governance/types";

type MemberRow = {
  userId: string;
  role: string;
  email: string;
  displayName?: string | null;
};

export function AvecGovernancePanel({
  groupId,
  governanceMode,
  canAdmin,
  canPropose,
  adminMembers,
  busy,
  onModeSaved,
  onProposalCreated,
}: {
  groupId: string;
  governanceMode: GovernanceMode | string;
  canAdmin: boolean;
  canPropose: boolean;
  adminMembers: MemberRow[];
  busy: boolean;
  onModeSaved: () => void;
  onProposalCreated: () => void;
}) {
  const { t } = useI18n();
  const [mode, setMode] = useState<GovernanceMode>(
    (governanceMode as GovernanceMode) || "legacy",
  );
  const [modeBusy, setModeBusy] = useState(false);
  const [modeErr, setModeErr] = useState<string | null>(null);

  const [revokeTarget, setRevokeTarget] = useState("");
  const [revokeJustification, setRevokeJustification] = useState("");
  const [interestRate, setInterestRate] = useState("10");
  const [rateJustification, setRateJustification] = useState("");
  const [propBusy, setPropBusy] = useState(false);
  const [propErr, setPropErr] = useState<string | null>(null);
  const [propOk, setPropOk] = useState<string | null>(null);

  useEffect(() => {
    setMode((governanceMode as GovernanceMode) || "legacy");
  }, [governanceMode]);

  const modeNote =
    mode === "legacy"
      ? t("group_gov_mode_legacy_note")
      : mode === "hybrid"
        ? t("group_gov_mode_hybrid_note").replace(
            "{amount}",
            String(DEFAULT_GOVERNANCE_RULES.criticalWithdrawalUsdt),
          )
        : t("group_gov_mode_full_note");

  async function saveMode() {
    if (!canAdmin) return;
    setModeBusy(true);
    setModeErr(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ governanceMode: mode }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setModeErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      onModeSaved();
    } finally {
      setModeBusy(false);
    }
  }

  async function createProposal(
    type: "revoke_admin" | "change_interest_rate",
    payload: Record<string, unknown>,
    justification: string,
  ) {
    setPropBusy(true);
    setPropErr(null);
    setPropOk(null);
    try {
      const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, justification, payload }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPropErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      setPropOk(t("group_gov_proposal_created"));
      onProposalCreated();
    } finally {
      setPropBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {canAdmin ? (
        <div className="rounded-xl border border-violet-200/80 bg-violet-50/50 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-900">
            {t("group_gov_mode_title")}
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-[color:var(--fd-muted)]">
            {modeNote}
          </p>
          <select
            value={mode}
            disabled={modeBusy || busy}
            onChange={(e) => setMode(e.target.value as GovernanceMode)}
            className="mt-2 w-full rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-2 text-xs font-semibold"
          >
            <option value="legacy">{t("group_gov_mode_legacy")}</option>
            <option value="hybrid">{t("group_gov_mode_hybrid")}</option>
            <option value="full">{t("group_gov_mode_full")}</option>
          </select>
          <button
            type="button"
            disabled={modeBusy || busy}
            onClick={() => void saveMode()}
            className={`${avecCls.btnPrimary} mt-2`}
          >
            {t("group_gov_mode_save")}
          </button>
          {modeErr ? (
            <p className="mt-2 text-[10px] text-rose-600">{clientErrorText(t, modeErr)}</p>
          ) : null}
        </div>
      ) : null}

      {canPropose && mode !== "legacy" ? (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--fd-primary)]">
            {t("group_gov_proposals_title")}
          </p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">
            {t("group_gov_proposals_note")}
          </p>

          <div className="rounded-xl border border-[color:var(--fd-border)] p-3">
            <p className="text-xs font-bold">{t("group_gov_proposal_revoke_title")}</p>
            <select
              value={revokeTarget}
              disabled={propBusy}
              onChange={(e) => setRevokeTarget(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[color:var(--fd-border)] px-2 py-1.5 text-xs"
            >
              <option value="">{t("group_gov_proposal_select_admin")}</option>
              {adminMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {p2pDisplayName({
                    email: m.email,
                    displayName: m.displayName ?? null,
                    avatarUrl: null,
                    piUsername: null,
                  })}{" "}
                  ({groupRoleLabel(t, m.role)})
                </option>
              ))}
            </select>
            <textarea
              value={revokeJustification}
              disabled={propBusy}
              onChange={(e) => setRevokeJustification(e.target.value)}
              placeholder={t("group_gov_proposal_justification_ph")}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[color:var(--fd-border)] px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={propBusy || !revokeTarget || revokeJustification.trim().length < 10}
              onClick={() =>
                void createProposal(
                  "revoke_admin",
                  { targetUserId: revokeTarget },
                  revokeJustification.trim(),
                )
              }
              className={`${avecCls.btnGhost} mt-2 w-full text-[10px]`}
            >
              {t("group_gov_proposal_revoke_btn")}
            </button>
          </div>

          <div className="rounded-xl border border-[color:var(--fd-border)] p-3">
            <p className="text-xs font-bold">{t("group_gov_proposal_rate_title")}</p>
            <input
              type="number"
              min={1}
              max={30}
              step={0.5}
              value={interestRate}
              disabled={propBusy}
              onChange={(e) => setInterestRate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-[color:var(--fd-border)] px-2 py-1.5 text-xs"
            />
            <textarea
              value={rateJustification}
              disabled={propBusy}
              onChange={(e) => setRateJustification(e.target.value)}
              placeholder={t("group_gov_proposal_justification_ph")}
              rows={2}
              className="mt-2 w-full rounded-lg border border-[color:var(--fd-border)] px-2 py-1.5 text-xs"
            />
            <button
              type="button"
              disabled={propBusy || rateJustification.trim().length < 10}
              onClick={() =>
                void createProposal(
                  "change_interest_rate",
                  { interestRatePctTotal: Number(interestRate) },
                  rateJustification.trim(),
                )
              }
              className={`${avecCls.btnGhost} mt-2 w-full text-[10px]`}
            >
              {t("group_gov_proposal_rate_btn")}
            </button>
          </div>

          {propErr ? (
            <p className="text-[10px] text-rose-600">{clientErrorText(t, propErr)}</p>
          ) : null}
          {propOk ? (
            <p className="text-[10px] font-bold text-emerald-700">{propOk}</p>
          ) : null}
        </div>
      ) : mode === "legacy" && canPropose ? (
        <p className="text-[10px] text-[color:var(--fd-muted)]">{t("group_gov_mode_legacy_note")}</p>
      ) : null}
    </div>
  );
}
