"use client";

import type { PartnerOrgStatus } from "@/lib/hackathon/partner-chat";

const META: Record<
  Exclude<PartnerOrgStatus, "rejected">,
  { labelFr: string; labelEn: string; titleFr: string; titleEn: string }
> = {
  confirmed: {
    labelFr: "Confirmé",
    labelEn: "Confirmed",
    titleFr: "Partenariat confirmé",
    titleEn: "Partnership confirmed",
  },
  in_progress: {
    labelFr: "En cours",
    labelEn: "In progress",
    titleFr: "Échanges en cours",
    titleEn: "Discussions in progress",
  },
  undetermined: {
    labelFr: "Pas encore déterminé",
    labelEn: "Undetermined",
    titleFr: "Statut pas encore déterminé",
    titleEn: "Status not yet determined",
  },
};

export function partnerStatusLabel(
  status: PartnerOrgStatus,
  isFr: boolean,
): string {
  if (status === "rejected") return isFr ? "Rejeté" : "Rejected";
  return isFr ? META[status].labelFr : META[status].labelEn;
}

export function HackathonPartnerStatusBadge({
  status,
  compact = false,
  isFr = true,
  showLabel = false,
}: {
  status: PartnerOrgStatus;
  compact?: boolean;
  isFr?: boolean;
  showLabel?: boolean;
}) {
  if (status === "rejected") return null;
  const meta = META[status];
  const title = isFr ? meta.titleFr : meta.titleEn;
  const size = compact ? 14 : 18;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${compact ? "" : ""}`}
      title={title}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 18 18"
        aria-label={title}
        role="img"
        className="shrink-0"
      >
        {status === "confirmed" ? (
          <>
            <circle cx="9" cy="9" r="8" fill="#059669" />
            <path
              d="M5.2 9.1l2.3 2.3 5.2-5.2"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : null}
        {status === "in_progress" ? (
          <>
            <circle cx="9" cy="9" r="8" fill="#d97706" />
            <circle cx="5.2" cy="9" r="1.35" fill="#fff" />
            <circle cx="9" cy="9" r="1.35" fill="#fff" />
            <circle cx="12.8" cy="9" r="1.35" fill="#fff" />
          </>
        ) : null}
        {status === "undetermined" ? (
          <>
            <circle cx="9" cy="9" r="8" fill="#78716c" />
            <text
              x="9"
              y="12.2"
              textAnchor="middle"
              fill="#fff"
              fontSize="11"
              fontWeight="700"
              fontFamily="system-ui,sans-serif"
            >
              ?
            </text>
          </>
        ) : null}
      </svg>
      {showLabel ? (
        <span className="text-[11px] font-semibold text-[color:var(--hk-muted)]">
          {isFr ? meta.labelFr : meta.labelEn}
        </span>
      ) : null}
    </span>
  );
}

export function HackathonPartnerStatusLegend({ isFr }: { isFr: boolean }) {
  const items: Exclude<PartnerOrgStatus, "rejected">[] = [
    "confirmed",
    "in_progress",
    "undetermined",
  ];
  return (
    <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] px-4 py-3">
      {items.map((s) => (
        <li key={s} className="flex items-center gap-2 text-xs text-[color:var(--hk-muted)]">
          <HackathonPartnerStatusBadge status={s} isFr={isFr} />
          <span>
            <span className="font-semibold text-[color:var(--hk-fg)]">
              {isFr ? META[s].labelFr : META[s].labelEn}
            </span>
            {" - "}
            {isFr ? META[s].titleFr : META[s].titleEn}
          </span>
        </li>
      ))}
    </ul>
  );
}
