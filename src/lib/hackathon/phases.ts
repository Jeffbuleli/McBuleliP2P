/**
 * Canonical McBuleli Hackathon flow.
 * Order: Bootcamp → Team formation → Development → Mentoring → Pitch → Jury → Awards
 * (+ inscription/validation before, incubation after).
 */

export type HackathonActorId =
  | "participants"
  | "teams"
  | "mentors"
  | "jury"
  | "organizers"
  | "partners"
  | "sponsors";

export type HackathonPhaseId =
  | "registration"
  | "validation"
  | "bootcamp"
  | "teams"
  | "development"
  | "mentoring"
  | "pitch"
  | "deliberation"
  | "awards"
  | "incubation";

export type HackathonActor = {
  id: HackathonActorId;
  labelFr: string;
  labelEn: string;
};

export type HackathonPhase = {
  id: HackathonPhaseId;
  order: number;
  /** Core event day sequence (excludes pre/post). */
  core: boolean;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
  actors: HackathonActorId[];
  hubAnchor?: string;
};

export const HACKATHON_ACTORS: Record<HackathonActorId, HackathonActor> = {
  participants: {
    id: "participants",
    labelFr: "Participants",
    labelEn: "Participants",
  },
  teams: { id: "teams", labelFr: "Équipes", labelEn: "Teams" },
  mentors: { id: "mentors", labelFr: "Mentors", labelEn: "Mentors" },
  jury: { id: "jury", labelFr: "Jury", labelEn: "Jury" },
  organizers: {
    id: "organizers",
    labelFr: "McBuleli / Org.",
    labelEn: "McBuleli / Org.",
  },
  partners: { id: "partners", labelFr: "Partenaires", labelEn: "Partners" },
  sponsors: { id: "sponsors", labelFr: "Sponsors", labelEn: "Sponsors" },
};

/** Full journey including pre-event and post-event. */
export const HACKATHON_PHASES: HackathonPhase[] = [
  {
    id: "registration",
    order: 1,
    core: false,
    titleFr: "Inscription",
    titleEn: "Registration",
    bodyFr: "Compte McBuleli, e-mail confirmé, place réservée.",
    bodyEn: "McBuleli account, email confirmed, seat reserved.",
    actors: ["participants", "organizers"],
    hubAnchor: "phase-registration",
  },
  {
    id: "validation",
    order: 2,
    core: false,
    titleFr: "Validation",
    titleEn: "Validation",
    bodyFr: "Paiement confirmé - badge QR envoyé.",
    bodyEn: "Payment confirmed - QR badge issued.",
    actors: ["participants", "organizers"],
    hubAnchor: "phase-registration",
  },
  {
    id: "bootcamp",
    order: 3,
    core: true,
    titleFr: "Bootcamp",
    titleEn: "Bootcamp",
    bodyFr: "Vibe Coding : Design Thinking, Cursor, Claude, Codex & APIs.",
    bodyEn: "Vibe Coding: Design Thinking, Cursor, Claude, Codex & APIs.",
    actors: ["participants", "mentors", "organizers", "partners"],
    hubAnchor: "phase-bootcamp",
  },
  {
    id: "teams",
    order: 4,
    core: true,
    titleFr: "Formation des équipes",
    titleEn: "Team formation",
    bodyFr: "Créer / rejoindre une équipe (rôles uniques, max 5), choix parmi 4 défis, règlement.",
    bodyEn: "Create / join a team (unique roles, max 5), pick among 4 challenges, accept rules.",
    actors: ["participants", "teams", "organizers"],
    hubAnchor: "phase-teams",
  },
  {
    id: "development",
    order: 5,
    core: true,
    titleFr: "Développement",
    titleEn: "Development",
    bodyFr: "Build intensif du prototype (liens, docs, livrables).",
    bodyEn: "Intensive prototype build (links, docs, deliverables).",
    actors: ["teams", "participants"],
    hubAnchor: "phase-development",
  },
  {
    id: "mentoring",
    order: 6,
    core: true,
    titleFr: "Mentorat",
    titleEn: "Mentoring",
    bodyFr: "Demandes de coaching tech / produit / business pendant le build.",
    bodyEn: "Tech / product / business coaching requests during the build.",
    actors: ["teams", "mentors", "partners"],
    hubAnchor: "phase-mentoring",
  },
  {
    id: "pitch",
    order: 7,
    core: true,
    titleFr: "Pitch",
    titleEn: "Pitch",
    bodyFr: "Soumission des livrables, démo et présentation Demo Day.",
    bodyEn: "Submit deliverables, demo and Demo Day presentation.",
    actors: ["teams", "jury", "partners", "sponsors"],
    hubAnchor: "phase-pitch",
  },
  {
    id: "deliberation",
    order: 8,
    core: true,
    titleFr: "Délibération du jury",
    titleEn: "Jury deliberation",
    bodyFr: "Notation selon la grille officielle (Innovation, Impact, Tech…).",
    bodyEn: "Scoring against the official rubric (Innovation, Impact, Tech…).",
    actors: ["jury", "organizers"],
    hubAnchor: "phase-deliberation",
  },
  {
    id: "awards",
    order: 9,
    core: true,
    titleFr: "Remise des prix",
    titleEn: "Awards",
    bodyFr: "Annonce des gagnants, prix partenaires, certificats.",
    bodyEn: "Winners announcement, partner prizes, certificates.",
    actors: ["organizers", "sponsors", "partners", "teams"],
    hubAnchor: "phase-awards",
  },
  {
    id: "incubation",
    order: 10,
    core: false,
    titleFr: "Incubation",
    titleEn: "Incubation",
    bodyFr: "Accompagnement post-événement des projets sélectionnés.",
    bodyEn: "Post-event support for selected projects.",
    actors: ["teams", "partners", "organizers", "sponsors"],
  },
];

export function corePhases(): HackathonPhase[] {
  return HACKATHON_PHASES.filter((p) => p.core);
}

export function actorLabel(id: HackathonActorId, isFr: boolean): string {
  const a = HACKATHON_ACTORS[id];
  return isFr ? a.labelFr : a.labelEn;
}

/**
 * Derive the participant's current phase from hub state.
 * Soft progression: furthest unlocked step the user should focus on.
 */
export function deriveCurrentPhaseId(input: {
  isPaid: boolean;
  hasRegistration: boolean;
  teamStatus: string | null;
  hasChallenge: boolean;
  rulesAccepted: boolean;
  hasOpenMentorRequest: boolean;
}): HackathonPhaseId {
  if (!input.hasRegistration) return "registration";
  if (!input.isPaid) return "validation";

  const status = input.teamStatus;
  if (!status) return "bootcamp";
  if (status === "forming" || !input.hasChallenge || !input.rulesAccepted) {
    return "teams";
  }
  if (status === "ready") return "development";
  if (status === "building") {
    return input.hasOpenMentorRequest ? "mentoring" : "development";
  }
  if (status === "submitted") return "pitch";
  if (status === "presented") return "deliberation";
  if (status === "judged") return "awards";
  return "development";
}

/** Soft unlocks for hub actions (not hard calendar locks). */
export function phaseUnlocks(input: {
  isPaid: boolean;
  teamStatus: string | null;
  hasChallenge: boolean;
  rulesAccepted: boolean;
}) {
  const teamReady =
    Boolean(input.teamStatus) && input.hasChallenge && input.rulesAccepted;
  const status = input.teamStatus;
  const pastBuilding =
    status === "building" ||
    status === "submitted" ||
    status === "presented" ||
    status === "judged";

  return {
    canFormTeam: input.isPaid,
    canPickChallenge: input.isPaid && Boolean(input.teamStatus),
    canAcceptRules: input.isPaid && Boolean(input.teamStatus),
    canStartBuild: teamReady,
    canRequestMentor: teamReady && (status === "ready" || pastBuilding),
    canSubmitDeliverables: teamReady && pastBuilding,
    showJuryLink:
      status === "submitted" ||
      status === "presented" ||
      status === "judged",
  };
}
