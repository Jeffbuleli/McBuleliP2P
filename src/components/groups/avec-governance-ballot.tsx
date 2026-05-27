"use client";

import { useI18n } from "@/components/i18n-provider";
import { UserAvatarMark } from "@/components/profile/user-avatar-mark";
import {
  granularRoleI18nKey,
  membershipRoleI18nKey,
  proposalTypeI18nKey,
} from "@/lib/avec/governance/vote-i18n";
import type { GovernanceVoteMeta } from "@/lib/avec/governance/types";

function formatDuration(ms: number, locale: string): string {
  if (ms <= 0) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 48) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function RiskBadge({ tier }: { tier: "A" | "B" | "C" }) {
  const { t } = useI18n();
  const cls =
    tier === "C"
      ? "bg-rose-100 text-rose-900"
      : tier === "B"
        ? "bg-amber-100 text-amber-900"
        : "bg-emerald-100 text-emerald-900";
  const label =
    tier === "C"
      ? t("group_gov_tier_c")
      : tier === "B"
        ? t("group_gov_tier_b")
        : t("group_gov_tier_a");
  return (
    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${cls}`}>{label}</span>
  );
}

function RoleChip({ roleKey }: { roleKey: string }) {
  const { t } = useI18n();
  return (
    <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[9px] font-bold text-stone-800">
      {t(membershipRoleI18nKey(roleKey) as never)}
    </span>
  );
}

function PermChip({ role, added }: { role: string; added: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${
        added ? "bg-emerald-100 text-emerald-900" : "bg-rose-100 text-rose-900"
      }`}
    >
      {added ? "+" : "−"}{" "}
      {t(
        granularRoleI18nKey(role as "treasurer" | "credit_officer" | "secretary") as never,
      )}
    </span>
  );
}

export function AvecGovernanceBallot({
  meta,
  locale,
  compact,
  showStatus = true,
}: {
  meta: GovernanceVoteMeta;
  locale: string;
  compact?: boolean;
  showStatus?: boolean;
}) {
  const { t } = useI18n();
  const loc = locale === "fr" ? "fr-FR" : "en-US";
  const ballot = meta.ballot;
  const participated = meta.yesCount + meta.noCount + meta.abstainCount;
  const quorumPct = Math.min(
    100,
    Math.round((participated / Math.max(1, meta.requiredQuorum)) * 100),
  );
  const majorityPct = meta.majorityProgressPct ?? 0;
  const timeLeft = meta.timeRemainingMs ?? 0;
  const isTie =
    meta.result === "rejected" &&
    meta.yesCount === meta.noCount &&
    meta.yesCount + meta.noCount > 0;

  const statusKey =
    meta.status === "executed"
      ? "group_gov_vote_executed_badge"
      : meta.status === "voting"
        ? "group_gov_vote_open_badge"
        : meta.result === "passed"
          ? "group_gov_vote_passed_badge"
          : meta.result === "rejected"
            ? "group_gov_vote_rejected_badge"
            : meta.result === "expired"
              ? "group_gov_vote_expired_badge"
              : "group_gov_vote_open_badge";

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex flex-wrap items-center gap-1.5">
        {showStatus ? (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-bold text-violet-900">
            {t(statusKey)}
          </span>
        ) : null}
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[9px] font-bold text-indigo-900">
          {t(proposalTypeI18nKey(meta.proposalType) as never)}
        </span>
        {meta.riskTier ? <RiskBadge tier={meta.riskTier} /> : null}
        {meta.voteAudience === "committee" ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-900">
            {t("group_gov_committee_vote_badge")}
          </span>
        ) : null}
        {(meta.retryCount ?? 0) > 0 ? (
          <span className="rounded-full bg-stone-200 px-2 py-0.5 text-[9px] font-bold text-stone-800">
            {t("group_gov_vote_retry_badge", { n: String(meta.retryCount ?? 1) })}
          </span>
        ) : null}
      </div>

      <div>
        <p className={`font-bold text-[color:var(--fd-text)] ${compact ? "text-xs" : "text-sm"}`}>
          {meta.title}
        </p>
        <p className="mt-0.5 text-[10px] text-[color:var(--fd-muted)]">
          {t("group_gov_vote_by")} {meta.authorDisplay}
        </p>
      </div>

      {(ballot?.targetDisplay || meta.beneficiaryDisplay) && (
        <div className="flex items-center gap-2 rounded-xl bg-stone-50/90 px-2.5 py-2">
          <UserAvatarMark email="" avatarUrl={null} sizeClass="h-8 w-8 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
              {t("group_gov_ballot_member")}
            </p>
            <p className="truncate text-xs font-bold text-[color:var(--fd-text)]">
              {ballot?.targetDisplay ?? meta.beneficiaryDisplay}
            </p>
            {(ballot?.oldRole || ballot?.newRole) && (
              <div className="mt-1 flex flex-wrap items-center gap-1">
                {ballot.oldRole ? <RoleChip roleKey={ballot.oldRole} /> : null}
                {ballot.oldRole && ballot.newRole ? (
                  <span className="text-[10px] text-[color:var(--fd-muted)]">→</span>
                ) : null}
                {ballot.newRole ? <RoleChip roleKey={ballot.newRole} /> : null}
              </div>
            )}
          </div>
        </div>
      )}

      {ballot?.permissionsAdded?.length || ballot?.permissionsRemoved?.length ? (
        <div className="rounded-xl border border-[color:var(--fd-border)] px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_gov_ballot_permissions")}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {ballot.permissionsAdded?.map((r) => (
              <PermChip key={`+${r}`} role={r} added />
            ))}
            {ballot.permissionsRemoved?.map((r) => (
              <PermChip key={`-${r}`} role={r} added={false} />
            ))}
          </div>
        </div>
      ) : null}

      {(meta.financialImpactUsdt != null || ballot?.impactLines?.length) && (
        <div className="rounded-xl bg-violet-50/80 px-2.5 py-2">
          <p className="text-[9px] font-bold uppercase text-violet-800">
            {t("group_gov_ballot_financial")}
          </p>
          {meta.financialImpactUsdt != null ? (
            <p className="mt-0.5 text-lg font-black tabular-nums text-violet-950">
              {meta.financialImpactUsdt.toFixed(2)}{" "}
              <span className="text-xs font-bold">USDT</span>
            </p>
          ) : null}
          {ballot?.impactLines?.map((line) => (
            <p key={line} className="text-[10px] text-violet-900/90">
              {line}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-stone-50 px-2 py-1.5">
          <p className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_gov_ballot_quorum")}
          </p>
          <p className="text-xs font-bold tabular-nums">
            {participated}/{meta.requiredQuorum}
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-violet-500"
              style={{ width: `${quorumPct}%` }}
            />
          </div>
        </div>
        <div className="rounded-xl bg-stone-50 px-2 py-1.5">
          <p className="text-[8px] font-bold uppercase text-[color:var(--fd-muted)]">
            {t("group_gov_ballot_majority")}
          </p>
          <p className="text-xs font-bold tabular-nums">
            {majorityPct}% / {meta.requiredMajorityPct}%
          </p>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-stone-200">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${Math.min(100, majorityPct)}%` }}
            />
          </div>
        </div>
      </div>

      <p className="text-[9px] tabular-nums text-[color:var(--fd-muted)]">
        {t("group_gov_vote_tally")
          .replace("{yes}", String(meta.yesCount))
          .replace("{no}", String(meta.noCount))
          .replace("{abstain}", String(meta.abstainCount))}
      </p>

      {meta.status === "voting" && timeLeft > 0 ? (
        <p className="text-[10px] font-bold text-violet-900">
          ⏱ {t("group_gov_ballot_time_left")}: {formatDuration(timeLeft, loc)}
        </p>
      ) : null}

      {meta.voteClosesAt ? (
        <p className="text-[9px] opacity-60">
          {meta.status === "voting" ? t("group_gov_vote_closes_at") : t("group_gov_vote_closed_at")}{" "}
          {new Date(meta.voteClosesAt).toLocaleString(loc)}
        </p>
      ) : null}

      {isTie ? (
        <p className="rounded-lg bg-amber-50 px-2 py-1 text-[9px] text-amber-900">
          {t("group_gov_ballot_tie_note")}
        </p>
      ) : null}

      {meta.status === "executed" && ballot?.targetUserId ? (
        <p className="rounded-lg bg-emerald-50 px-2 py-1 text-[9px] text-emerald-900">
          {t("group_gov_ballot_applied")}
        </p>
      ) : null}
    </div>
  );
}
