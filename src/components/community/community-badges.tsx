import type { ReactNode } from "react";
import type { ReputationLevelId } from "@/lib/community/reputation-levels";
import { REPUTATION_LEVELS } from "@/lib/community/reputation-levels";

function BadgeShell({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title: string;
  className?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex h-4 items-center gap-0.5 rounded px-1 text-[9px] font-bold uppercase tracking-wide ${className}`}
    >
      {children}
    </span>
  );
}

export function KycVerifiedBadge({ fr }: { fr: boolean }) {
  return (
    <BadgeShell
      title={fr ? "KYC vérifié" : "KYC verified"}
      className="bg-[#e8f3ee] text-[#305f33]"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 12l2 2 4-4M12 3l8 4v6c0 4-3.5 7-8 8-4.5-1-8-8V7l8-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
      KYC
    </BadgeShell>
  );
}

export function ReputationLevelBadge({
  levelId,
  fr,
}: {
  levelId: ReputationLevelId | string;
  fr: boolean;
}) {
  const level =
    REPUTATION_LEVELS.find((l) => l.id === levelId) ?? REPUTATION_LEVELS[0]!;
  if (level.id === "member") return null;
  return (
    <BadgeShell
      title={fr ? level.labelFr : level.labelEn}
      className="bg-[#f5f5f4] text-[#57534e]"
    >
      {fr ? level.labelFr : level.labelEn}
    </BadgeShell>
  );
}

export function CommunityBadgeIcon({ slug }: { slug: string }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 2 };
  if (slug === "contributor") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15.8 7.1 17.5 8 11.9 4 8l5.6-1.2L12 2z" {...c} />
      </svg>
    );
  }
  if (slug === "mentor" || slug === "signal_pro") {
    return (
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 19h16M6 16l4-8 4 5 4-9" {...c} strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="8" r="4" {...c} />
      <path d="M6 20c0-4 2.7-6 6-6s6 2 6 6" {...c} />
    </svg>
  );
}
