/**
 * Single inventory of /hackathon/* surfaces — audience + job.
 * Consumed by /hackathon/ops so we stop stacking orphan tools.
 */

export type HackathonSurfaceAudience =
  | "public"
  | "participant"
  | "partner"
  | "ops"
  | "internal";

export type HackathonSurface = {
  id: string;
  href: string;
  labelFr: string;
  labelEn: string;
  jobFr: string;
  jobEn: string;
  audience: HackathonSurfaceAudience;
  /** Highlight on ops hub Day 1 strip */
  day1Primary?: boolean;
};

export const HACKATHON_SURFACES: HackathonSurface[] = [
  {
    id: "landing",
    href: "/hackathon",
    labelFr: "Landing",
    labelEn: "Landing",
    jobFr: "Inscription & marketing",
    jobEn: "Signup & marketing",
    audience: "public",
  },
  {
    id: "espace",
    href: "/hackathon/espace",
    labelFr: "Mon espace",
    labelEn: "My hub",
    jobFr: "Parcours builder : équipe, défis, livrables",
    jobEn: "Builder journey: team, challenges, deliverables",
    audience: "participant",
  },
  {
    id: "chat",
    href: "/hackathon/chat",
    labelFr: "Échange partenaires",
    labelEn: "Partner exchange",
    jobFr: "Chat + préparation orgs partenaires",
    jobEn: "Chat + partner org prep",
    audience: "partner",
  },
  {
    id: "ops",
    href: "/hackathon/ops",
    labelFr: "Ops jour",
    labelEn: "Day ops",
    jobFr: "Hub unique équipe McBuleli (favori Jour 1)",
    jobEn: "Single McBuleli team hub (Day 1 bookmark)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "mc",
    href: "/hackathon/mc",
    labelFr: "MC console",
    labelEn: "MC console",
    jobFr: "Piloter McBuleli AI (cues, chrono, urgence)",
    jobEn: "Drive McBuleli AI (cues, timer, override)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "mc-stage",
    href: "/hackathon/mc/stage",
    labelFr: "MC scène",
    labelEn: "MC stage",
    jobFr: "Projecteur tempo / modération (matin & transitions)",
    jobEn: "Projector for tempo / moderation (morning & transitions)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "slides",
    href: "/hackathon/slides",
    labelFr: "Slides",
    labelEn: "Slides",
    jobFr: "Préparer / présenter un deck (bootcamp Jeff)",
    jobEn: "Prepare / present a deck (Jeff bootcamp)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "live",
    href: "/hackathon/live",
    labelFr: "Live",
    labelEn: "Live",
    jobFr: "Mur salle + projecteur slides quand On Air (pas le MC)",
    jobEn: "Room wall + slide projector when On Air (not the MC)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "jury",
    href: "/hackathon/jury",
    labelFr: "Jury",
    labelEn: "Jury",
    jobFr: "Notation / délibération",
    jobEn: "Scoring / deliberation",
    audience: "partner",
  },
  {
    id: "budget",
    href: "/hackathon/budget",
    labelFr: "Budget",
    labelEn: "Budget",
    jobFr: "Vue budget événement (interne)",
    jobEn: "Event budget view (internal)",
    audience: "internal",
  },
  {
    id: "ambassadeur",
    href: "/hackathon/ambassadeur",
    labelFr: "Ambassadeur",
    labelEn: "Ambassador",
    jobFr: "Outil promo campus",
    jobEn: "Campus promo tool",
    audience: "public",
  },
  {
    id: "admin",
    href: "/admin/hackathon",
    labelFr: "Admin hackathon",
    labelEn: "Hackathon admin",
    jobFr: "Back-office édition",
    jobEn: "Edition back-office",
    audience: "ops",
  },
  {
    id: "scan",
    href: "/admin/hackathon/scan",
    labelFr: "Scan badges",
    labelEn: "Badge scan",
    jobFr: "Contrôle entrée / présence",
    jobEn: "Door / presence check",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "partner-prep-preview",
    href: "/hackathon/partner-prep-preview",
    labelFr: "Aperçu prep partenaires",
    labelEn: "Partner prep preview",
    jobFr: "Dev / QA briefs (non indexé)",
    jobEn: "Dev / QA briefs (noindex)",
    audience: "internal",
  },
];

export const HACKATHON_DAY1_CHECKLIST_FR = [
  "Projecteur matin → MC scène (Patty ouvre, AI modère, talks 10′).",
  "Bootcamp Jeff → Slides présent + Live On Air (même deck). Couper MC scène.",
  "Builders → Mon espace. Partenaires → Chat. Salle → Scan + ordre.",
  "Build / mentors → MC pour rappels tempo si besoin ; Live = mur salle.",
  "Clôture → MC scène (synthèse AI) puis Patty. Un seul projecteur à la fois.",
] as const;

export const HACKATHON_DAY1_CHECKLIST_EN = [
  "Morning projector → MC stage (Patty opens, AI moderates, 10′ talks).",
  "Jeff bootcamp → Slides present + Live On Air (same deck). Turn off MC stage.",
  "Builders → My hub. Partners → Chat. Door team → Scan + room order.",
  "Build / mentors → MC for tempo cues if needed; Live = room wall.",
  "Close → MC stage (AI wrap) then Patty. One projector at a time.",
] as const;

export function surfacesByAudience(
  audience: HackathonSurfaceAudience | HackathonSurfaceAudience[],
): HackathonSurface[] {
  const set = new Set(Array.isArray(audience) ? audience : [audience]);
  return HACKATHON_SURFACES.filter((s) => set.has(s.audience));
}

export function day1PrimarySurfaces(): HackathonSurface[] {
  return HACKATHON_SURFACES.filter((s) => s.day1Primary && s.id !== "ops");
}
