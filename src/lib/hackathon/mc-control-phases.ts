import type { McCue } from "@/lib/hackathon/mc-day";
import { KILELO_REMOTE_MEET_SLUG, MC_CUES } from "@/lib/hackathon/mc-day";

export type McControlPhase = {
  id: string;
  labelFr: string;
  hintFr: string;
  /** Cue ids in program order */
  cueIds: string[];
};

export type McSmartAction = {
  id: string;
  labelFr: string;
  hintFr: string;
  phaseId: string;
  variant?: "primary" | "sky" | "amber";
};

function cuesInRange(startId: string, endId: string): string[] {
  const start = MC_CUES.findIndex((c) => c.id === startId);
  const end = MC_CUES.findIndex((c) => c.id === endId);
  if (start < 0 || end < 0) return [];
  const lo = Math.min(start, end);
  const hi = Math.max(start, end);
  return MC_CUES.slice(lo, hi + 1).map((c) => c.id);
}

function partnerCueIds(): string[] {
  return MC_CUES.filter((c) => c.id.startsWith("partner-")).map((c) => c.id);
}

export const MC_CONTROL_PHASES: McControlPhase[] = [
  {
    id: "prep",
    labelFr: "Avant salle",
    hintFr: "Standby puis Patty",
    cueIds: cuesInRange("standby", "patty-open"),
  },
  {
    id: "intro",
    labelFr: "Intro McBuleli IA",
    hintFr: "Qui sommes-nous → Technologies → Règles",
    cueIds: cuesInRange("ai-intro", "ai-rules"),
  },
  {
    id: "partners",
    labelFr: "Vitrine partenaires",
    hintFr: "10 min / org · chrono à chaque appel",
    cueIds: partnerCueIds(),
  },
  {
    id: "bootcamp",
    labelFr: "Bootcamp Jeff",
    hintFr: "Pause photo → Slides On Air",
    cueIds: cuesInRange("break-photo", "jeff-bootcamp"),
  },
  {
    id: "build",
    labelFr: "Build & mentorat",
    hintFr: "Mur Live · équipes en terrain",
    cueIds: cuesInRange("teams", "pitch-prep"),
  },
  {
    id: "demo",
    labelFr: "Mini Demo & jury",
    hintFr: "Pitches · délibération",
    cueIds: cuesInRange("mini-demo", "deliberation"),
  },
  {
    id: "close",
    labelFr: "Prix & clôture",
    hintFr: "Podium → AI → Patty",
    cueIds: cuesInRange("awards", "patty-close"),
  },
];

export const MC_SMART_ACTIONS: McSmartAction[] = [
  {
    id: "kilelo_projector",
    labelFr: "Kilelo · Visio sur Live",
    hintFr: "1 tap · /live = visio · Visio OFF pour couper",
    phaseId: "partners",
    variant: "sky",
  },
  {
    id: "kilelo_prepare",
    labelFr: "Kilelo · Préparer visio",
    hintFr: "Armer la salle · Kilelo peut rejoindre 30 min avant · Live au moment voulu",
    phaseId: "partners",
    variant: "sky",
  },
  {
    id: "kilelo_visio",
    labelFr: "Kilelo · MC + hôte",
    hintFr: "Carte partenaire sur Live + ouvre l'onglet hôte (son salle)",
    phaseId: "partners",
    variant: "sky",
  },
  {
    id: "visio_off",
    labelFr: "Visio OFF",
    hintFr: "Retour MC · couper la visio",
    phaseId: "partners",
    variant: "amber",
  },
  {
    id: "bootcamp_slides",
    labelFr: "Bootcamp · Slides",
    hintFr: "Projecteur Slides + cue Jeff",
    phaseId: "bootcamp",
    variant: "primary",
  },
  {
    id: "build_wall",
    labelFr: "Build · Mur Live",
    hintFr: "Mur équipes + file pitch si active",
    phaseId: "build",
    variant: "primary",
  },
  {
    id: "podium",
    labelFr: "Podium · Prix",
    hintFr: "Mode Prix + cue podium",
    phaseId: "close",
    variant: "primary",
  },
];

export function mcCueById(id: string): McCue | undefined {
  return MC_CUES.find((c) => c.id === id);
}

export function mcPhaseForCueIndex(cueIndex: number): McControlPhase {
  const cue = MC_CUES[cueIndex];
  if (!cue) return MC_CONTROL_PHASES[0]!;
  const hit = MC_CONTROL_PHASES.find((p) => p.cueIds.includes(cue.id));
  return hit ?? MC_CONTROL_PHASES[0]!;
}

export { KILELO_REMOTE_MEET_SLUG };
