"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { IlluCollectiveVote } from "@/components/groups/avec-illustrations";
import { clientErrorText } from "@/lib/client-error-text";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";

function isCandidateVoteType(type: GovernanceVoteMeta["proposalType"]): boolean {
  return (
    type === "appoint_admin" ||
    type === "revoke_admin" ||
    type === "revoke_member" ||
    type === "set_co_admins" ||
    type === "set_committee" ||
    type === "set_granular_roles"
  );
}

export function AvecVueGovernanceCard({
  groupId,
  myUserId,
  meta,
  locale = "en",
  onVoted,
}: {
  groupId: string;
  myUserId?: string;
  meta: GovernanceVoteMeta;
  locale?: string;
  onVoted?: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [myChoice, setMyChoice] = useState<
    "yes" | "no" | "abstain" | "option_1" | "option_2" | "option_3" | "option_4" | null
  >(null);

  const canVote =
    meta.status === "voting" &&
    myUserId &&
    myUserId !== meta.authorUserId &&
    new Date(meta.voteClosesAt).getTime() > Date.now();
  const candidateVote = isCandidateVoteType(meta.proposalType);
  const canVoteNow = canVote && !hasVoted;
  const quizOptions = useMemo(() => {
    const fromBallot = (meta.ballot?.quizOptions ?? []).filter(Boolean).slice(0, 4);
    const fallback = [t("group_gov_vote_yes"), t("group_gov_vote_no"), t("group_gov_vote_abstain"), "Option 4"];
    const labels = fromBallot.length > 0 ? fromBallot : fallback;
    return labels.slice(0, 4).map((label, idx) => ({
      label: `${t(
        candidateVote ? "group_gov_quiz_candidate_prefix" : "group_gov_quiz_proposal_prefix",
      )} ${idx + 1} · ${label}`,
      choice: (idx === 0
        ? "option_1"
        : idx === 1
          ? "option_2"
          : idx === 2
            ? "option_3"
            : "option_4") as "option_1" | "option_2" | "option_3" | "option_4",
    }));
  }, [candidateVote, meta.ballot?.quizOptions, t]);

  useEffect(() => {
    let off = false;
    if (!myUserId) return;
    if (meta.status !== "voting") {
      setHasVoted(true);
      return;
    }
    void (async () => {
      const res = await fetch(
        `/api/groups/${groupId}/governance/proposals/${meta.proposalId}/vote`,
        { cache: "no-store" },
      );
      const j = await res.json().catch(() => ({}));
      if (off) return;
      if (res.ok) {
        setHasVoted(Boolean((j as { hasVoted?: boolean }).hasVoted));
        setMyChoice((j as { choice?: typeof myChoice }).choice ?? null);
      }
    })();
    return () => {
      off = true;
    };
  }, [groupId, meta.proposalId, meta.status, myUserId]);

  async function vote(choice: "yes" | "no" | "abstain" | "option_1" | "option_2" | "option_3" | "option_4") {
    if (!canVoteNow || busy) return;
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
      setHasVoted(true);
      setMyChoice(choice);
      onVoted?.();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border-2 border-violet-300/70 bg-gradient-to-br from-violet-50/90 to-white p-3 shadow-sm">
      <div className="mb-2 flex gap-2">
        <span className="shrink-0 text-violet-800/80">
          <IlluCollectiveVote className="h-12 w-16" />
        </span>
        <p className="text-[9px] font-bold uppercase tracking-wide text-violet-900">
          {t("avec_vue_vote_live")}
        </p>
      </div>
      <p className="text-xs font-bold text-[color:var(--fd-text)]">{meta.title}</p>
      <p className="mt-1 text-[10px] text-[color:var(--fd-muted)]">{t("group_gov_quiz_pick_one")}</p>
      <div className="mt-2 grid grid-cols-1 gap-2">
        {quizOptions.map((opt) => (
          <button
            key={opt.choice}
            type="button"
            disabled={busy || !canVoteNow}
            onClick={() => void vote(opt.choice)}
            className="rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2 text-left text-[10px] font-bold text-[color:var(--fd-text)] disabled:opacity-60"
          >
            {myChoice === opt.choice ? "✓ " : ""}{opt.label}
          </button>
        ))}
      </div>
      {!hasVoted && meta.status === "voting" ? (
        <p className="mt-2 text-[9px] text-[color:var(--fd-muted)]">
          {t("group_gov_results_hidden_until_vote")}
        </p>
      ) : (
        <>
          {(meta.optionTallies ?? []).length > 0 ? (
            <div className="mt-2 space-y-1">
              {(meta.optionTallies ?? []).map((row, idx) => (
                <p key={row.choice} className="text-[9px] text-[color:var(--fd-muted)]">
                  {t(
                    candidateVote ? "group_gov_quiz_candidate_prefix" : "group_gov_quiz_proposal_prefix",
                  )}{" "}
                  {idx + 1} · {row.label}: {row.count}
                </p>
              ))}
              {meta.winningLabel ? (
                <p className="text-[9px] font-bold text-emerald-700">
                  {candidateVote
                    ? `${t("group_gov_quiz_winner")}: ${meta.winningLabel}`
                    : `${t("group_gov_quiz_proposal_prefix")} ${
                        (meta.optionTallies ?? []).findIndex((x) => x.label === meta.winningLabel) + 1
                      }: ${t("group_gov_quiz_validated")}`}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-[9px] text-[color:var(--fd-muted)]">
              {t("group_gov_vote_tally")
                .replace("{yes}", String(meta.yesCount))
                .replace("{no}", String(meta.noCount))
                .replace("{abstain}", String(meta.abstainCount))}
            </p>
          )}
        </>
      )}
      {err ? (
        <p className="mt-1 text-[9px] text-rose-600">{clientErrorText(t, err)}</p>
      ) : null}
    </div>
  );
}
