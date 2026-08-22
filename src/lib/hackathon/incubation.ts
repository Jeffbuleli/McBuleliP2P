/**
 * Post-event incubation track (after Awards).
 * Shown in Mon espace once the team is judged / presented.
 */
import {
  SUPPORT_EMAIL,
  SUPPORT_WA_PATH,
} from "@/lib/support-contact";

export type IncubationNextStep = {
  id: string;
  titleFr: string;
  titleEn: string;
  bodyFr: string;
  bodyEn: string;
};

export const INCUBATION_WINDOW_FR = "Dès le 29 août 2026";
export const INCUBATION_WINDOW_EN = "From 29 August 2026";

export const INCUBATION_CONTACT_EMAIL = SUPPORT_EMAIL;
export const INCUBATION_WHATSAPP_PATH = SUPPORT_WA_PATH;

export const INCUBATION_INTRO_FR =
  "Les équipes sélectionnées poursuivent avec un accompagnement léger : mentorat, intro partenaires et préparation de la suite produit.";

export const INCUBATION_INTRO_EN =
  "Selected teams continue with light support: mentoring, partner intros and next-step product prep.";

export const INCUBATION_STEPS: IncubationNextStep[] = [
  {
    id: "debrief",
    titleFr: "Débrief projet",
    titleEn: "Project debrief",
    bodyFr:
      "30 min avec l'équipe McBuleli pour clarifier le problème, la démo et les priorités 2 semaines.",
    bodyEn:
      "30 min with the McBuleli team to clarify the problem, demo and 2-week priorities.",
  },
  {
    id: "partner-intro",
    titleFr: "Intros partenaires",
    titleEn: "Partner intros",
    bodyFr:
      "Mise en relation ciblée (FinTech, Agro, formation, incubation) selon votre défi.",
    bodyEn:
      "Targeted intros (FinTech, Agri, training, incubation) based on your challenge.",
  },
  {
    id: "build-sprint",
    titleFr: "Sprint produit",
    titleEn: "Product sprint",
    bodyFr:
      "Checklist livrables : repo propre, démo stable, pitch 1 page, contacts équipe.",
    bodyEn:
      "Deliverables checklist: clean repo, stable demo, 1-page pitch, team contacts.",
  },
];

export function incubationEligible(teamStatus: string | null): boolean {
  return teamStatus === "judged" || teamStatus === "presented";
}
