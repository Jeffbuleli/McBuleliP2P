/**
 * McBuleli AI MC / moderator cues for Day 1 (28 Aug 2026).
 * Operator console drives the stage display; humans (Patty, Jeff, salle) hand off with fixed phrases.
 */
import {
  DAY1_BOOTCAMP,
  PARTNER_TALK_MINUTES,
  partnerDayBriefForSlug,
} from "@/lib/hackathon/partner-day-brief";

export const MC_EVENT_DATE_FR = "Vendredi 28 août 2026";
export const MC_VENUE_FR = "Silikin Village";

/** Magic handoff phrases - whole team learns these. */
export const MC_MAGIC_PHRASES = {
  pattyToAi:
    "Bienvenue au McBuleli Hackathon. Nous accueillons McBuleli AI pour présenter McBuleli et modérer le déroulé.",
  humanToAi: "Merci McBuleli AI.",
  aiToPatty: "Je passe la parole à Mme Patty B.",
  aiToJeff: "Je passe la parole à Jeff Buleli pour le bootcamp.",
} as const;

export type McCueKind =
  | "standby"
  | "patty_open"
  | "ai_intro"
  | "partner_call"
  | "partner_thanks"
  | "break"
  | "call_jeff"
  | "jeff_bootcamp"
  | "teams"
  | "build_mentors"
  | "pitch_prep"
  | "mini_demo"
  | "deliberation"
  | "awards"
  | "ai_wrap"
  | "patty_close";

/** Suggested projector mode when operator activates this cue (optional). */
export type McProjectorMode = "wall" | "mc" | "slides" | "awards";

export type McCue = {
  id: string;
  kind: McCueKind;
  /** Short label on operator console */
  labelFr: string;
  /** Large text on stage / AI voice line (public) */
  stageLineFr: string;
  /** Optional human cue card (operator console only - never on Live) */
  humanScriptFr?: string;
  /** Public subtitle under stage line (audience-safe only) */
  detailFr?: string;
  partnerSlug?: string;
  partnerName?: string;
  /** Logo on the partner announcement card */
  partnerLogoUrl?: string;
  /** Presenter name or title shown on card */
  partnerPresenterFr?: string;
  domainFr?: string;
  windowFr?: string;
  /** Suggest timer when this cue is active */
  timerSeconds?: number;
  /** Auto-switch room projector when this cue is activated */
  projectorMode?: McProjectorMode;
};

const STAGE_PARTNERS: Array<{
  slug: string;
  /** Short name on badges / card */
  name: string;
  /** Who presents (person or title) - spoken once with the welcome */
  presenter: string;
  logoUrl: string;
}> = [
  {
    slug: "rdpi",
    name: "RDPI Think Tank",
    presenter: "Mr Aristote Mugisho",
    logoUrl: "/partners/rdpi-thinktank-logo.png?v=20260728b",
  },
  {
    slug: "ia-academie-chk",
    name: "IA Académie",
    presenter: "l'équipe IA Académie",
    logoUrl: "/partners/ia-academie-logo.png?v=20260729",
  },
  {
    slug: "kimia",
    name: "KIMIA Service",
    presenter: "Mr Mike",
    logoUrl: "/partners/kimia-service-logo.png?v=20260728",
  },
  {
    slug: "montana-pay",
    name: "MontanaPay",
    presenter: "la Direction",
    logoUrl: "/partners/montana-pay-logo.jpg?v=20260729b",
  },
  {
    slug: "tyts",
    name: "TYTS",
    presenter: "Aaron Nsomone",
    logoUrl: "/partners/tyts-yts-logo.jpg",
  },
  {
    slug: "kilelo",
    name: "Kilelo",
    presenter: "Jeancy Kabangu",
    logoUrl: "/partners/kilelo-logo.png?v=20260728c",
  },
  {
    slug: "ilokwe",
    name: "ILOKWE GROUP",
    presenter: "l'équipe ILOKWE, Sponsor Or",
    logoUrl: "/partners/ilokwe-group-logo.png?v=20260724c",
  },
];

function partnerWindow(slug: string): { windowFr: string; domainFr: string } {
  const talk = partnerDayBriefForSlug(slug).talk;
  const windowFr =
    talk?.start && talk?.end ? `${talk.start} - ${talk.end}` : "";
  return { windowFr, domainFr: talk?.domainFr ?? "" };
}

function buildPartnerCues(): McCue[] {
  const out: McCue[] = [];
  for (const p of STAGE_PARTNERS) {
    const { windowFr, domainFr } = partnerWindow(p.slug);
    out.push({
      id: `partner-${p.slug}-call`,
      kind: "partner_call",
      labelFr: `Appel · ${p.name}`,
      stageLineFr: `Nous accueillons ${p.name}. Bienvenue à ${p.presenter}. ${PARTNER_TALK_MINUTES} minutes - ${domainFr}.`,
      detailFr: domainFr ? `${domainFr} · ${PARTNER_TALK_MINUTES} min` : undefined,
      partnerSlug: p.slug,
      partnerName: p.name,
      partnerLogoUrl: p.logoUrl,
      partnerPresenterFr: p.presenter,
      domainFr,
      windowFr,
      timerSeconds: PARTNER_TALK_MINUTES * 60,
      humanScriptFr: `Partenaire prêt côté scène. Opérateur : lancer le chrono ${PARTNER_TALK_MINUTES}'. Chrono visible à l'écran.`,
    });
    out.push({
      id: `partner-${p.slug}-thanks`,
      kind: "partner_thanks",
      labelFr: `Merci · ${p.name}`,
      stageLineFr: `Merci ${p.name}. Applaudissements.`,
      detailFr: "Prochain partenaire dans un instant.",
      partnerSlug: p.slug,
      partnerName: p.name,
      partnerLogoUrl: p.logoUrl,
      partnerPresenterFr: p.presenter,
      domainFr,
      windowFr,
      humanScriptFr: "Enchaîner le cue suivant dès que le partenaire quitte la scène.",
    });
  }
  return out;
}

export const MC_CUES: McCue[] = [
  {
    id: "standby",
    kind: "standby",
    labelFr: "Standby",
    stageLineFr: "McBuleli Hackathon · bientôt",
    detailFr: `${MC_EVENT_DATE_FR} · ${MC_VENUE_FR}`,
    humanScriptFr: "Salle calme. Patty prête. Opérateur sur console.",
  },
  {
    id: "patty-open",
    kind: "patty_open",
    labelFr: "Patty · Ouverture",
    stageLineFr: "Ouverture · Mme Patty B.",
    detailFr: "Accueil institutionnel McBuleli",
    humanScriptFr: [
      "Bonjour et bienvenue au McBuleli Hackathon, ici à Silikin Village.",
      MC_MAGIC_PHRASES.pattyToAi,
      "(Puis silence - l'opérateur lance INTRO AI.)",
    ].join(" "),
  },
  {
    id: "ai-intro",
    kind: "ai_intro",
    labelFr: "McBuleli AI · Qui sommes-nous",
    stageLineFr:
      "Bonjour. Je suis McBuleli AI. McBuleli est une entreprise de technologie congolaise, basée à Kinshasa. Notre vision : une Afrique où l'innovation numérique sert vraiment les gens. Notre mission : bâtir des plateformes sûres et accessibles pour la finance, la connectivité et la confiance digitale.",
    detailFr: "Entreprise tech · Kinshasa · vision & mission",
    humanScriptFr:
      "Cue 1/2 intro. Écran + son. Pas de micro humain. Enchaîner « Technologies » puis « Règles ».",
  },
  {
    id: "ai-stack",
    kind: "ai_intro",
    labelFr: "McBuleli AI · Technologies",
    stageLineFr:
      "Ce que nous avons déjà réalisé : McBuleli P2P, l'échange crypto et mobile money sécurisé ; McBuleli ISP, l'accès internet ; Cyber Alert DRC avec SafeFind, la vigilance face aux menaces en ligne ; et Africa Insight, pour mieux lire le terrain. Ce hackathon prolonge cette ambition : builder avec vous.",
    detailFr: "P2P · ISP · Cyber Alert DRC / SafeFind · Africa Insight",
    humanScriptFr: "Cue 2/2 intro. Puis lancer « Règles ».",
  },
  {
    id: "ai-rules",
    kind: "ai_intro",
    labelFr: "McBuleli AI · Règles",
    stageLineFr:
      "Règles simples : respect du chrono, badges visibles, questions après chaque talk si le temps le permet. L'équipe salle guide les places.",
    detailFr: "Vitrine partenaires : 10 minutes par organisation.",
  },
  ...buildPartnerCues(),
  {
    id: "break-photo",
    kind: "break",
    labelFr: "Pause / photo",
    stageLineFr: "Pause courte et photo partenaires.",
    detailFr: "10:20 - 10:30 · reprise pour le bootcamp",
    windowFr: "10:20 - 10:30",
    humanScriptFr: "Garçons : ordre photo. Patty / Jeff : prêt bootcamp.",
  },
  {
    id: "call-jeff",
    kind: "call_jeff",
    labelFr: "Appel · Jeff",
    stageLineFr: MC_MAGIC_PHRASES.aiToJeff,
    detailFr: `Bootcamp Vibe Coding · ${DAY1_BOOTCAMP.start} - ${DAY1_BOOTCAMP.end}`,
    windowFr: `${DAY1_BOOTCAMP.start} - ${DAY1_BOOTCAMP.end}`,
    humanScriptFr: "Jeff monte. Opérateur : passer au bloc bootcamp.",
  },
  {
    id: "jeff-bootcamp",
    kind: "jeff_bootcamp",
    labelFr: "Jeff · Bootcamp",
    stageLineFr: "Bootcamp · Jeff Buleli",
    detailFr: "1 heure · outils IA (Cursor recommandé) · pratique",
    windowFr: `${DAY1_BOOTCAMP.start} - ${DAY1_BOOTCAMP.end}`,
    timerSeconds: 60 * 60,
    humanScriptFr:
      "Jeff enseigne. IA en pause sauf rappel chrono si demandé. Fin : Jeff dit « Merci McBuleli AI ».",
  },
  {
    id: "teams",
    kind: "teams",
    labelFr: "Équipes & défis",
    stageLineFr:
      "Formation des équipes et choix des défis. L'équipe salle vous oriente.",
    detailFr: "11:30 - 12:00",
    windowFr: "11:30 - 12:00",
  },
  {
    id: "build-mentors",
    kind: "build_mentors",
    labelFr: "Build + mentors",
    stageLineFr:
      "Build intensif. Les partenaires mentors circulent. Levez la main : l'équipe salle vous oriente.",
    detailFr: "12h45 - 15h30 · aide terrain partenaires",
    windowFr: "12h45 - 15h30",
    projectorMode: "wall",
    humanScriptFr: "Rappel mentors toutes les ~30 min si besoin (bouton Rappel).",
  },
  {
    id: "break-coffee-pm",
    kind: "break",
    labelFr: "Pause café",
    stageLineFr: "Pause café. Reprenez souffle avant les pitches.",
    detailFr: "15h30 - 15h45",
    windowFr: "15h30 - 15h45",
    humanScriptFr: "Distribution boissons. Équipes : finalisez vos démos.",
  },
  {
    id: "pitch-prep",
    kind: "pitch_prep",
    labelFr: "Prep pitch",
    stageLineFr:
      "Préparation pitch et démo. Équipes : finalisez vos slides et démos.",
    detailFr: "15h45 - 16h00",
    windowFr: "15h45 - 16h00",
    projectorMode: "wall",
    humanScriptFr:
      "Staff : ordre de passage prêt. Jury sur /hackathon/jury. Équipes : liens dans Mon espace.",
  },
  {
    id: "mini-demo",
    kind: "mini_demo",
    labelFr: "Mini Demo Day",
    stageLineFr:
      "Mini Demo Day : pitches courts et démonstrations. Chrono respecté.",
    detailFr: "16h00 - 16h40 · ~5 min / équipe",
    windowFr: "16h00 - 16h40",
    timerSeconds: 40 * 60,
    projectorMode: "mc",
    humanScriptFr:
      "Opérateur : chrono 40'. Marquer « présenté » dans admin après chaque pitch.",
  },
  {
    id: "deliberation",
    kind: "deliberation",
    labelFr: "Délibération jury",
    stageLineFr:
      "Le jury délibère. Merci aux équipes pour vos prototypes.",
    detailFr: "16h40 - 16h50",
    windowFr: "16h40 - 16h50",
    projectorMode: "wall",
    humanScriptFr: "Jury : verrouillez vos scores sur /hackathon/jury. Ops : préparer mode Prix.",
  },
  {
    id: "awards",
    kind: "awards",
    labelFr: "Podium · Prix",
    stageLineFr: "Remise des prix McBuleli Hackathon 2026.",
    detailFr: "16h50 - 17h00",
    windowFr: "16h50 - 17h00",
    projectorMode: "awards",
    humanScriptFr:
      "Opérateur : basculer projecteur → Prix. Annoncer top 3 depuis l'écran.",
  },
  {
    id: "ai-wrap",
    kind: "ai_wrap",
    labelFr: "McBuleli AI · Synthèse",
    stageLineFr:
      "Merci à toutes et tous. McBuleli AI a tenu le tempo avec l'équipe. Je passe la parole à Mme Patty B. pour la clôture.",
    detailFr: MC_MAGIC_PHRASES.aiToPatty,
    projectorMode: "mc",
    humanScriptFr: "Patty prête pour clôturer.",
  },
  {
    id: "patty-close",
    kind: "patty_close",
    labelFr: "Patty · Clôture",
    stageLineFr: "Clôture · Mme Patty B.",
    projectorMode: "mc",
    humanScriptFr: [
      "Merci aux partenaires, aux builders, à Jeff pour le bootcamp, et à McBuleli AI pour la modération.",
      "Photos, contacts et suite incubation McBuleli.",
      "Bonne continuation avec McBuleli.",
    ].join(" "),
  },
];

export function getMcCue(id: string): McCue | undefined {
  return MC_CUES.find((c) => c.id === id);
}

export function getMcCueAt(index: number): McCue {
  const i = Math.max(0, Math.min(MC_CUES.length - 1, index));
  return MC_CUES[i]!;
}

export function findMcCueIndex(id: string): number {
  const i = MC_CUES.findIndex((c) => c.id === id);
  return i >= 0 ? i : 0;
}

/** Next cue after current (skips nothing - operator chooses). */
export function peekNextCue(index: number): McCue | null {
  return MC_CUES[index + 1] ?? null;
}

export type McRoleCard = {
  id: string;
  titleFr: string;
  bodyFr: string[];
};

export const MC_ROLE_CARDS: McRoleCard[] = [
  {
    id: "patty",
    titleFr: "Mme Patty B. - Ouverture & clôture",
    bodyFr: [
      "Ouvre avec la phrase magique vers McBuleli AI.",
      "Ne reste pas MC au milieu de la journée.",
      "Clôture après la synthèse AI.",
    ],
  },
  {
    id: "ai",
    titleFr: "McBuleli AI - Tempo & modération",
    bodyFr: [
      "Parle seulement quand l'opérateur lance un cue.",
      "Intro en deux temps : qui sommes-nous, puis technologies, puis règles.",
      "Appelle partenaires, Jeff, Patty.",
      "Chrono visible = contrat de confiance.",
    ],
  },
  {
    id: "jeff",
    titleFr: "Jeff Buleli - Bootcamp seulement",
    bodyFr: [
      "Entre après : « Je passe la parole à Jeff Buleli… »",
      "Enseigne 1 h. Fin : « Merci McBuleli AI. »",
      "Pas de MC hors bootcamp.",
    ],
  },
  {
    id: "partners",
    titleFr: "Partenaires - Talk + mentorat terrain",
    bodyFr: [
      "10 min scène au signal AI.",
      "Mentorat / aide physique en circulant pendant le build.",
      "Pas d'annonce micro hors créneau.",
    ],
  },
  {
    id: "salle",
    titleFr: "Équipe salle (2) - Participants & ordre",
    bodyFr: [
      "Badges, places, silence, files, orientation mentors.",
      "Signaux discrets vers l'opérateur.",
      "Pas de discours scène.",
    ],
  },
];
