"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { IlluCollectiveVote } from "@/components/groups/avec-illustrations";
import { clientErrorText } from "@/lib/client-error-text";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";
import { DEFAULT_GOVERNANCE_RULES } from "@/lib/avec/governance/rules";

export function AvecVueGovernanceCard({
  groupId,
  myUserId,
  meta,
  onVoted,
}: {
  groupId: string;
  myUserId?: string;
  meta: GovernanceVoteMeta;
  onVoted?: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const participated = meta.yesCount + meta.noCount + meta.abstainCount;
  const pct = Math.min(
    100,
    Math.round((participated / Math.max(1, meta.requiredQuorum)) * 100),
  );
  const canVote =
    meta.status === "voting" &&
    myUserId &&
    myUserId !== meta.authorUserId &&
    new Date(meta.voteClosesAt).getTime() > Date.now();

  async function vote(choice: "yes" | "no" | "abstain") {
    if (!canVote || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/governance/proposals/${meta.proposalId}/vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr((j as { error?: string }).error ?? "group_action_failed");
        return;
      }
      onVoted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-violet-300/70 bg-gradient-to-br from-violet-50/90 to-white p-3 shadow-sm">
      <div className="flex gap-3">
        <span className="shrink-0 text-violet-800/80">
          <IlluCollectiveVote className="h-16 w-20" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-bold uppercase tracking-wide text-violet-900">
            {t("avec_vue_vote_live")}
          </p>
          <p className="truncate text-sm font-bold text-[color:var(--fd-text)]">{meta.title}</p>
          {meta.financialImpactUsdt != null ? (
            <p className="text-lg font-black tabular-nums text-violet-950">
              {meta.financialImpactUsdt.toFixed(0)} USDT
            </p>
          ) : null}
        </div>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[9px] text-[color:var(--fd-muted)]">
          <span>{participated}/{meta.requiredQuorum}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-violet-600 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      {canVote ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("yes")}
            className="rounded-xl bg-emerald-600 py-2 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("group_gov_vote_yes")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("no")}
            className="rounded-xl bg-rose-600 py-2 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("group_gov_vote_no")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("abstain")}
            className="rounded-xl border border-stone-300 bg-white py-2 text-[10px] font-bold disabled:opacity-50"
          >
            {t("group_gov_vote_abstain")}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[9px] text-[color:var(--fd-muted)]">
          {t("avec_vue_vote_rule").replace(
            "{amount}",
            String(DEFAULT_GOVERNANCE_RULES.criticalWithdrawalUsdt),
          )}
        </p>
      )}
      {err ? (
        <p className="mt-1 text-[9px] text-rose-600">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
