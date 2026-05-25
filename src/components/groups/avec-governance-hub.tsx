"use client";

import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { avecCls } from "@/components/groups/avec-ui";
import { clientErrorText } from "@/lib/client-error-text";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";

export function AvecGovernanceHub({
  groupId,
  myUserId,
  canAdmin,
  onOpenDialogue,
}: {
  groupId: string;
  myUserId?: string;
  canAdmin: boolean;
  onOpenDialogue?: () => void;
}) {
  const { t } = useI18n();
  const [proposals, setProposals] = useState<GovernanceVoteMeta[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/groups/${groupId}/governance/proposals`, {
      cache: "no-store",
    });
    const j = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray((j as { proposals?: GovernanceVoteMeta[] }).proposals)) {
      setProposals((j as { proposals: GovernanceVoteMeta[] }).proposals);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openVotes = proposals.filter((p) => p.status === "voting");

  async function cancelProposal(proposalId: string) {
    if (!window.confirm(t("group_gov_cancel_confirm"))) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/governance/proposals/${proposalId}/cancel`,
        { method: "POST" },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (openVotes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-3">
      <p className="text-[10px] font-bold text-indigo-950">{t("avec_gov_hub_title")}</p>
      <p className="mt-0.5 text-[9px] text-indigo-900/90">{t("avec_gov_hub_hint")}</p>
      <ul className="mt-2 max-h-[32vh] space-y-2 overflow-y-auto">
        {openVotes.map((p) => {
          const canCancel =
            myUserId &&
            (p.authorUserId === myUserId || canAdmin);
          return (
            <li
              key={p.proposalId}
              className="rounded-xl border border-indigo-100 bg-white/80 px-3 py-2"
            >
              <p className="text-xs font-bold text-[color:var(--fd-text)]">{p.title}</p>
              <p className="mt-0.5 text-[9px] text-[color:var(--fd-muted)]">
                {t("group_gov_vote_closes_at")}:{" "}
                {new Date(p.voteClosesAt).toLocaleString()}
              </p>
              <p className="mt-0.5 font-mono text-[9px] tabular-nums text-indigo-800">
                {p.yesCount} {t("group_gov_vote_yes")} · {p.noCount}{" "}
                {t("group_gov_vote_no")} · {t("group_gov_vote_quorum")}{" "}
                {p.yesCount + p.noCount + p.abstainCount}/{p.requiredQuorum}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {onOpenDialogue ? (
                  <button
                    type="button"
                    onClick={onOpenDialogue}
                    className="rounded-full bg-indigo-800 px-2.5 py-1 text-[9px] font-bold text-white"
                  >
                    {t("group_gov_vote_in_dialogue")}
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void cancelProposal(p.proposalId)}
                    className="rounded-full border border-rose-300 px-2.5 py-1 text-[9px] font-bold text-rose-800"
                  >
                    {t("group_gov_cancel_proposal")}
                  </button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
      {err ? (
        <p className="mt-2 text-[10px] text-rose-800">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
