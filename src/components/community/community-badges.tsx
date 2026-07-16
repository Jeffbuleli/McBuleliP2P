import type { ReactNode } from "react";
import type { ReputationLevelId } from "@/lib/community/reputation-levels";
import { REPUTATION_LEVELS } from "@/lib/community/reputation-levels";
import { buildersTierVisual } from "@/lib/builders/builders-visual";

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
          d="M12 3l8 4v6c0 4.5-3.5 8-8 9-4.5-1-8-4.5-8-9V7l8-4z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 12l2 2 4-4"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
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
  const normalized =
    levelId === "ambassador" ? "pillar" : levelId;
  const level =
    REPUTATION_LEVELS.find((l) => l.id === normalized) ?? REPUTATION_LEVELS[0]!;
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

export function BlueCheckBadge({ fr }: { fr: boolean }) {
  return (
    <BadgeShell
      title={fr ? "Abonnement vérifié" : "Verified subscription"}
      className="bg-[#dbeafe] text-[#1d4ed8]"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
      {fr ? "Vérifié" : "Verified"}
    </BadgeShell>
  );
}

export function AdminGoldBadge({ fr }: { fr: boolean }) {
  return (
    <BadgeShell
      title={fr ? "Équipe McBuleli" : "McBuleli team"}
      className="bg-gradient-to-r from-[#fef3c7] to-[#fde68a] text-[#92400e]"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2l2.4 4.8L20 8l-4 3.9.9 5.6L12 15.8 7.1 17.5 8 11.9 4 8l5.6-1.2L12 2z" />
      </svg>
      Admin
    </BadgeShell>
  );
}

export function OnlineDot({ online }: { online: boolean }) {
  if (!online) return null;
  return (
    <span
      className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#22c55e]"
      title="En ligne"
    />
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

/** Paid Builders Program tier (McB) - nobility chip on public profiles. */
export function BuildersTierBadge({
  tier,
  fr,
}: {
  tier: string;
  fr: boolean;
}) {
  const labels: Record<string, { fr: string; en: string }> = {
    bronze: { fr: "Builder Bronze", en: "Bronze Builder" },
    silver: { fr: "Builder Silver", en: "Silver Builder" },
    gold: { fr: "Builder Gold", en: "Gold Builder" },
    diamond: { fr: "Builder Diamond", en: "Diamond Builder" },
    platinum: { fr: "Builder Platinum", en: "Platinum Builder" },
  };
  const label = labels[tier] ?? { fr: "Builder", en: "Builder" };
  const visual = buildersTierVisual(tier);
  return (
    <BadgeShell
      title={fr ? label.fr : label.en}
      className={
        visual?.badgeClass ??
        "bg-amber-50 text-amber-950 ring-1 ring-amber-300/60"
      }
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 2.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 14.8l-4.8 2.6.9-5.4-3.9-3.8 5.4-.8L12 2.5z" />
      </svg>
      {fr ? label.fr : label.en}
    </BadgeShell>
  );
}
