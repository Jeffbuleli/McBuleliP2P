/**
 * Pitch partenaires - pourquoi soutenir + parcours Partner → Builder.
 * Présenté en tête de /hackathon/budget (FR/EN).
 */

import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";
import {
  BUDGET_PARTNER_ORGS,
  BUDGET_PARTNER_SEATS,
  BUDGET_TALK_ORGS,
} from "@/lib/hackathon/budget";

export const PARTNER_TICKET_VALUE_USD = Number(HACKATHON_PRICE_USD) || 100;

/** Valeur portes déjà offertes (2 badges × orgs × ticket public). */
export const PARTNER_COMPLIMENTARY_VALUE_USD =
  BUDGET_PARTNER_SEATS * PARTNER_TICKET_VALUE_USD;

export type PitchBullet = {
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

/** Ce qu'ils ont déjà - gratuit, avant même le soutien cash. */
export const PARTNER_ALREADY_HAVE: readonly PitchBullet[] = [
  {
    titleFr: "Accréditation gratuite (2 places / org)",
    titleEn: "Complimentary accreditation (2 seats / org)",
    bodyFr: `Vous êtes déjà acceptés sans frais de ticket (${PARTNER_TICKET_VALUE_USD} $ public / place). Ce n'est pas un logo seul : c'est l'accès porte + scène + réseau.`,
    bodyEn: `You are already accepted with no ticket fee (public price $${PARTNER_TICKET_VALUE_USD} / seat). Not logo-only: door access + stage + network.`,
  },
  {
    titleFr: "Talk / Speaker = présenter votre business",
    titleEn: "Talk / Speaker = pitch your business",
    bodyFr: `${BUDGET_TALK_ORGS.length} organisations montent sur scène pour présenter leurs projets et leur offre - devant builders, mentors, jury et presse.`,
    bodyEn: `${BUDGET_TALK_ORGS.length} organizations take the stage to present their projects and offer - in front of builders, mentors, jury and press.`,
  },
  {
    titleFr: "Formation Vibe Coding incluse",
    titleEn: "Vibe Coding training included",
    bodyFr:
      "Pendant le bootcamp, vous apprenez Cursor, Claude, Codex et le Design Thinking - pour accélérer vos propres services, pas seulement mentoriser les autres.",
    bodyEn:
      "During the bootcamp you learn Cursor, Claude, Codex and Design Thinking - to accelerate your own services, not only mentor others.",
  },
  {
    titleFr: "Réseau Kinshasa en 48 h",
    titleEn: "Kinshasa network in 48 hours",
    bodyFr: `Silikin Village · ${BUDGET_PARTNER_ORGS.length} partenaires · équipes builders · jury. Une vitrine concrète pour recruter, tester et signer.`,
    bodyEn: `Silikin Village · ${BUDGET_PARTNER_ORGS.length} partners · builder teams · jury. A concrete showcase to hire, test and close.`,
  },
];

/** Approche Partner → Builder (proposition à valider avec eux). */
export const PARTNER_BUILDER_APPROACH = {
  titleFr: "Devenir Builders aussi",
  titleEn: "Become Builders too",
  ledeFr:
    "Au-delà du Talk : chaque organisation partenaire peut envoyer 1 profil technique en piste Builder - pour construire, pendant le hackathon, une amélioration concrète de son propre service avec le Vibe Coding.",
  ledeEn:
    "Beyond the Talk: each partner organization can send 1 technical profile on the Builder track - to ship, during the hackathon, a concrete improvement to their own service with Vibe Coding.",
  stepsFr: [
    "Garder vos 2 badges (Talk / mentorat / jury) - déjà offerts.",
    "Désigner 1 « Partner-Builder » (dev, product ou ops) qui suit le bootcamp Vibe Coding comme les équipes.",
    "Choisir un micro-défi métier interne : automatiser un process, prototypage IA, assistant client, reporting…",
    "Livrer un prototype le Demo Day - vitrine de votre capacité d'innovation, pas seulement un discours.",
  ],
  stepsEn: [
    "Keep your 2 badges (Talk / mentoring / jury) - already complimentary.",
    "Appoint 1 “Partner-Builder” (dev, product or ops) who follows the Vibe Coding bootcamp like the teams.",
    "Pick an internal micro-challenge: automate a process, AI prototype, support assistant, reporting…",
    "Ship a prototype on Demo Day - proof of your innovation capacity, not just a speech.",
  ],
  closeFr:
    "Résultat : vous repartez avec des compétences, un proto utile à votre business, et la légitimité d'avoir construit avec l'écosystème - pas seulement d'y avoir parlé.",
  closeEn:
    "Outcome: you leave with skills, a useful prototype for your business, and the credibility of having built with the ecosystem - not only spoken to it.",
} as const;

/** Pourquoi soutenir le budget (co-investissement). */
export const PARTNER_WHY_SUPPORT = {
  titleFr: "Pourquoi votre soutien compte",
  titleEn: "Why your support matters",
  bodyFr:
    "McBuleli couvre déjà vos places et votre scène. Le budget ci-dessous (salle Silikin, restauration, caméra, diffusion) est le coût réel de l'événement. Nous soutenir, c'est garantir que builders et partenaires travaillent dans de bonnes conditions - et que votre Talk ait une audience digne de votre business.",
  bodyEn:
    "McBuleli already covers your seats and your stage. The budget below (Silikin room, catering, camera, outreach) is the real cost of the event. Supporting us means builders and partners work in proper conditions - and your Talk reaches an audience worthy of your business.",
  askFr:
    "Formes de soutien : contribution cash, sponsoring restauration / salle, ou engagement Partner-Builder confirmé avec présence active les 2 jours.",
  askEn:
    "Ways to support: cash contribution, catering / room sponsorship, or a confirmed Partner-Builder commitment with active presence over both days.",
} as const;

export function partnerComplimentaryValueLabel(isFr: boolean): string {
  const n = PARTNER_COMPLIMENTARY_VALUE_USD;
  if (isFr) {
    return `${BUDGET_PARTNER_SEATS} places × ${PARTNER_TICKET_VALUE_USD} $ = ${n} $ déjà offerts`;
  }
  return `${BUDGET_PARTNER_SEATS} seats × $${PARTNER_TICKET_VALUE_USD} = $${n} already gifted`;
}
