/**
 * Single inventory of /hackathon/* surfaces - audience + job.
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
    day1Primary: true,
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
    labelFr: "Télécommande Live",
    labelEn: "Live remote",
    jobFr: "Piloter /hackathon/live (modes, cues, visio, chrono)",
    jobEn: "Drive /hackathon/live (modes, cues, visio, timer)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "mc-stage",
    href: "/hackathon/live",
    labelFr: "Projecteur salle",
    labelEn: "Room projector",
    jobFr: "Alias de /hackathon/live (redirect /mc/stage)",
    jobEn: "Alias of /hackathon/live (/mc/stage redirects)",
    audience: "ops",
  },
  {
    id: "slides",
    href: "/hackathon/slides",
    labelFr: "Slides",
    labelEn: "Slides",
    jobFr: "Contrôle deck bootcamp (On Air → Live mode Slides)",
    jobEn: "Bootcamp deck control (On Air → Live Slides mode)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "live",
    href: "/hackathon/live",
    labelFr: "Live (projecteur)",
    labelEn: "Live (projector)",
    jobFr: "Écran unique salle - bascule via console MC",
    jobEn: "Single room screen - switch via MC console",
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
    day1Primary: true,
  },
  {
    id: "infos",
    href: "/hackathon/infos",
    labelFr: "Infos pratiques",
    labelEn: "Practical info",
    jobFr: "Lieu, WiFi, matériel, déroulé",
    jobEn: "Venue, WiFi, gear, schedule",
    audience: "participant",
  },
  {
    id: "runbook",
    href: "/hackathon/ops/runbook",
    labelFr: "Runbook ops",
    labelEn: "Ops runbook",
    jobFr: "Checklist imprimable Jour 1 (PDF)",
    jobEn: "Printable Day 1 checklist (PDF)",
    audience: "ops",
    day1Primary: true,
  },
  {
    id: "certificat",
    href: "/hackathon/espace#phase-certificates",
    labelFr: "Certificats",
    labelEn: "Certificates",
    jobFr: "Émission + impression PDF (Mon espace)",
    jobEn: "Issue + PDF print (My hub)",
    audience: "ops",
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
    href: "/hackathon/scan",
    labelFr: "Télécommande Porte",
    labelEn: "Door remote",
    jobFr: "Contrôle entrée · scan QR badges",
    jobEn: "Door check · QR badge scan",
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
  "Projecteur unique = /hackathon/live (ne change plus d'URL).",
  "Sur Live mode MC : cliquer une fois pour activer la voix McBuleli IA.",
  "Matin : console MC → mode MC (Patty, talks, transitions).",
  "Kilelo visio : Jeancy sur /meet/kilelo-hackathon-live · ops /host → son salle · Live reste MC.",
  "Bootcamp : Jeff Present + Passer On Air → mode Slides auto.",
  "Build : mode Mur. Mini Demo : cue MC → mode MC.",
  "Prix : cue Podium → mode Prix (top 3 jury). Clôture : Patty.",
] as const;

export const HACKATHON_DAY1_CHECKLIST_EN = [
  "Single projector = /hackathon/live (do not change the URL).",
  "On Live MC mode: click once to unlock McBuleli IA voice.",
  "Morning: MC console → MC mode (Patty, talks, transitions).",
  "Kilelo remote: Jeancy on /meet/kilelo-hackathon-live · ops /host → room audio · Live stays MC.",
  "Bootcamp: Jeff Present + Go On Air → Slides mode auto.",
  "Build: Wall mode. Mini Demo: MC cue → MC mode.",
  "Awards: Podium cue → Awards mode (jury top 3). Close: Patty.",
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
