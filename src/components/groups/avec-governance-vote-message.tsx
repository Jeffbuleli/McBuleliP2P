"use client";

import { useState } from "react";
import { useI18n } from "@/components/i18n-provider";
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
  onVoted,
}: {
  groupId: string;
  myUserId?: string;
  messageType: "vote_started" | "vote_progress" | "vote_closed";
  meta: GovernanceVoteMeta | null;
  createdAt: string;
  locale: string;
  onVoted?: () => void;
}) {
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const loc = locale === "fr" ? "fr-FR" : "en-US";

  if (!meta) {
    return (
      <p className="text-center text-[10px] text-[color:var(--fd-muted)]">
        {t("group_gov_vote_fallback")}
      </p>
    );
  }

  const participated = meta.yesCount + meta.noCount + meta.abstainCount;
  const pct = Math.min(
    100,
    Math.round((participated / Math.max(1, meta.requiredQuorum)) * 100),
  );
  const canVote =
    messageType !== "vote_closed" &&
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
      onVoted?.();
    } finally {
      setBusy(false);
    }
  }

  const badgeKey =
    messageType === "vote_closed"
      ? meta.result === "passed"
        ? "group_gov_vote_passed_badge"
        : meta.result === "rejected"
          ? "group_gov_vote_rejected_badge"
          : "group_gov_vote_expired_badge"
      : "group_gov_vote_open_badge";

  const border =
    messageType === "vote_closed"
      ? meta.result === "passed"
        ? "border-emerald-300/80"
        : "border-stone-300/80"
      : "border-violet-300/80";

  return (
    <div
      className={`mx-auto w-full max-w-sm rounded-2xl border-2 border-dashed ${border} bg-gradient-to-br from-violet-50/80 to-[color:var(--fd-card)] p-3 shadow-sm`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-violet-900">
        {t(badgeKey)}
      </p>
      <p className="mt-1 text-sm font-bold text-[color:var(--fd-text)]">{meta.title}</p>
      <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
        {t("group_gov_vote_by")} {meta.authorDisplay}
      </p>
      {meta.financialImpactUsdt != null ? (
        <p className="mt-1 text-lg font-black tabular-nums text-violet-950">
          {meta.financialImpactUsdt.toFixed(2)}{" "}
          <span className="text-xs font-bold">USDT</span>
        </p>
      ) : null}
      {meta.beneficiaryDisplay ? (
        <p className="text-[10px] text-[color:var(--fd-muted)]">
          → {meta.beneficiaryDisplay}
        </p>
      ) : null}

      <div className="mt-2">
        <div className="mb-1 flex justify-between text-[9px] text-[color:var(--fd-muted)]">
          <span>{t("group_gov_vote_quorum")}</span>
          <span>
            {participated} / {meta.requiredQuorum}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-stone-200">
          <div
            className="h-full rounded-full bg-violet-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1 text-[9px] text-[color:var(--fd-muted)]">
          {t("group_gov_vote_tally")
            .replace("{yes}", String(meta.yesCount))
            .replace("{no}", String(meta.noCount))
            .replace("{abstain}", String(meta.abstainCount))}
        </p>
      </div>

      {canVote ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("yes")}
            className="rounded-xl bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("group_gov_vote_yes")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("no")}
            className="rounded-xl bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white disabled:opacity-50"
          >
            {t("group_gov_vote_no")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void vote("abstain")}
            className="rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] px-3 py-1.5 text-[10px] font-bold disabled:opacity-50"
          >
            {t("group_gov_vote_abstain")}
          </button>
        </div>
      ) : null}

      {err ? (
        <p className="mt-2 text-[10px] text-rose-600">{clientErrorText(t, err)}</p>
      ) : null}

      <p className="mt-2 text-[9px] opacity-60">
        {messageType === "vote_closed"
          ? t("group_gov_vote_closed_at")
          : t("group_gov_vote_closes_at")}{" "}
        {new Date(
          messageType === "vote_closed" ? createdAt : meta.voteClosesAt,
        ).toLocaleString(loc)}
      </p>
    </div>
  );
}
