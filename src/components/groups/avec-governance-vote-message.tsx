"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AvecGovernanceBallot } from "@/components/groups/avec-governance-ballot";
import { clientErrorText } from "@/lib/client-error-text";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";

export function parseGovernanceVoteMeta(
  meta: Record<string, unknown> | null,
): GovernanceVoteMeta | null {
  if (!meta || typeof meta.proposalId !== "string") return null;
  return meta as unknown as GovernanceVoteMeta;
}

export function AvecGovernanceVoteMessage({
  groupId,
  myUserId,
  messageType,
  meta,
  createdAt,
  locale,
  isRetry,
  onVoted,
}: {
  groupId: string;
  myUserId?: string;
  messageType: "vote_started" | "vote_progress" | "vote_closed" | "vote_executed";
  meta: GovernanceVoteMeta | null;
  createdAt: string;
  locale: string;
  isRetry?: boolean;
  onVoted?: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("group_gov_vote_fallback")}
      </p>
    );
  }

  const canVote =
    messageType !== "vote_closed" &&
    messageType !== "vote_executed" &&
    meta.status === "voting" &&
    myUserId &&
    myUserId !== meta.authorUserId &&
    new Date(meta.voteClosesAt).getTime() > Date.now();
  const canVoteNow = canVote && !hasVoted;
  const revealTallies = hasVoted || messageType === "vote_closed" || messageType === "vote_executed";
  const quizOptions = useMemo(() => {
    const fromBallot = (meta.ballot?.quizOptions ?? []).filter(Boolean).slice(0, 4);
    const fallback = [
      t("group_gov_vote_yes"),
      t("group_gov_vote_no"),
      t("group_gov_vote_abstain"),
    ];
    const labels = fromBallot.length > 0 ? fromBallot : fallback;
    return labels.slice(0, 3).map((label, idx) => ({
      label: `${t("group_gov_quiz_option_prefix")} ${idx + 1} · ${label}`,
      choice: (idx === 0 ? "yes" : idx === 1 ? "no" : "abstain") as "yes" | "no" | "abstain",
    }));
  }, [meta.ballot?.quizOptions, t]);

  useEffect(() => {
    let off = false;
    if (!myUserId) return;
    if (messageType === "vote_closed" || messageType === "vote_executed") {
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
      if (res.ok) setHasVoted(Boolean((j as { hasVoted?: boolean }).hasVoted));
    })();
    return () => {
      off = true;
    };
  }, [groupId, messageType, meta.proposalId, myUserId]);

  async function vote(choice: "yes" | "no" | "abstain") {
    if (!canVoteNow || busy) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(
        `/api/groups/${groupId}/governance/proposals/${meta!.proposalId}/vote`,
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
      onVoted?.();
      if (meta!.ballot?.targetUserId === myUserId) {
        window.dispatchEvent(new CustomEvent("avec-gov-access-changed"));
      }
    } finally {
      setBusy(false);
    }
  }

  const border =
    messageType === "vote_executed"
      ? "border-emerald-400/80"
      : messageType === "vote_closed"
        ? meta.result === "passed"
          ? "border-emerald-300/80"
          : "border-stone-300/80"
        : "border-violet-300/80";

  return (
    <div
      className={`mx-auto w-full max-w-sm rounded-2xl border-2 border-dashed ${border} bg-gradient-to-br from-violet-50/80 to-[color:var(--fd-card)] p-3 shadow-sm`}
    >
      {isRetry ? (
        <p className="mb-1 text-[9px] font-bold text-stone-700">
          {t("group_gov_vote_retry_badge", { n: String(meta.retryCount ?? 1) })}
        </p>
      ) : null}

      <AvecGovernanceBallot meta={meta} locale={locale} showStatus revealTallies={revealTallies} />

      {canVoteNow ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {quizOptions.map((opt) => (
            <button
              key={opt.choice}
              type="button"
              disabled={busy}
              onClick={() => void vote(opt.choice)}
              className="rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-1.5 text-[10px] font-bold text-[color:var(--fd-text)] disabled:opacity-50"
            >
              {opt.label}
            </button>
          ))}
        </div>
      ) : null}

      {err ? (
        <p className="mt-2 text-[10px] text-rose-600">{clientErrorText(t, err)}</p>
      ) : null}

      {messageType === "vote_closed" ? (
        <p className="mt-2 text-[9px] opacity-60">
          {t("group_gov_vote_closed_at")}{" "}
          {new Date(createdAt).toLocaleString(loc)}
        </p>
      ) : null}
    </div>
  );
}
