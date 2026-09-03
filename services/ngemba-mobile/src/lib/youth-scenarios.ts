import type { Locale } from "./i18n";

export type YouthScenarioId =
  | "consent"
  | "cyberbullying"
  | "corruption"
  | "bullying"
  | "violence"
  | "discrimination"
  | "sextortion"
  | "peer_pressure"
  | "abuse"
  | "friend_sos";

export type YouthScenario = {
  id: YouthScenarioId;
  title: Record<Locale, string>;
  intro: Record<Locale, string>;
};

export const YOUTH_SCENARIOS: YouthScenario[] = [
  {
    id: "consent",
    title: {
      fr: "Consentement et pression",
      en: "Consent and pressure",
      ln: "Consentement na pression",
      sw: "Idhini na shinikizo",
      lua: "Consentement na dikama",
      kg: "Consentement na dikama",
    },
    intro: {
      fr: "Ton ou ta partenaire insiste pour aller plus loin alors que tu hésites. Que fais-tu ?",
      en: "Your partner pushes you further while you hesitate. What do you do?",
      ln: "Partenaire na yo azali kosimba yo ntango ozali kozanga confiance. Okosala nini ?",
      sw: "Mpenzi wako anakushinikiza uendelee wakati una shaka. Unafanya nini?",
      lua: "Partenaire na nge ke kukata ntangu udi na dikema. Udi ukusala nki?",
      kg: "Partenaire na nge ke kukata ntangu kele na dikema. Nge ta sala nki?",
    },
  },
  {
    id: "cyberbullying",
    title: {
      fr: "Cyberharcèlement",
      en: "Cyberbullying",
      ln: "Cyberharcelement",
      sw: "Unyanyasaji mtandaoni",
      lua: "Cyberharcelement",
      kg: "Cyberharcelement",
    },
    intro: {
      fr: "Des messages moqueurs circulent sur toi dans un groupe WhatsApp de classe. Comment réagis-tu ?",
      en: "Mocking messages about you spread in a class WhatsApp group. How do you react?",
      ln: "Ba messages ya koséka yo ezali na groupe WhatsApp ya classe. Okosala nini ?",
      sw: "Ujumbe wa kudhihaki unaenea kwenye kikundi cha WhatsApp cha darasa. Unajibu vipi?",
      lua: "Ba messages ya kuseka nge ke bima na groupe WhatsApp ya classe. Udi ukusala nki?",
      kg: "Ba messages ya kuseka nge ke bima na groupe WhatsApp ya classe. Nge ta sala nki?",
    },
  },
  {
    id: "corruption",
    title: {
      fr: "Corruption à l'école",
      en: "School corruption",
      ln: "Corruption na ecole",
      sw: "Rushwa shuleni",
      lua: "Corruption na ecole",
      kg: "Corruption na ecole",
    },
    intro: {
      fr: "Un enseignant demande de l'argent pour réussir un examen. Que fais-tu ?",
      en: "A teacher asks for money to pass an exam. What do you do?",
      ln: "Moyekoli azali kosenga mbongo mpo na examen. Okosala nini ?",
      sw: "Mwalimu anaomba pesa ili upite mtihani. Unafanya nini?",
      lua: "Moyekoli ke lomba mbongo mpo na examen. Udi ukusala nki?",
      kg: "Moyekoli ke lomba mbongo mpo na examen. Nge ta sala nki?",
    },
  },
  {
    id: "bullying",
    title: {
      fr: "Moqueries à l'école",
      en: "School bullying",
      ln: "Koseka na ecole",
      sw: "Dhihaka shuleni",
      lua: "Kuseka na ecole",
      kg: "Kuseka na ecole",
    },
    intro: {
      fr: "Chaque jour, des camarades se moquent de toi à la récréation. Que fais-tu ?",
      en: "Classmates mock you every day at break. What do you do?",
      ln: "Mikolo nyonso bandeko bazali koséka yo. Okosala nini ?",
      sw: "Wanafunzi wanakudhihaki kila siku. Unafanya nini?",
      lua: "Mikolo nyonso bandeko ke kuseka nge. Udi ukusala nki?",
      kg: "Mikolo nyonso bandeko ke kuseka nge. Nge ta sala nki?",
    },
  },
  {
    id: "violence",
    title: {
      fr: "Bagarre dans la cour",
      en: "Fight in the yard",
      ln: "Libanga na cour",
      sw: "Mapigano uwanjani",
      lua: "Libanga na cour",
      kg: "Libanga na cour",
    },
    intro: {
      fr: "Une bagarre éclate. On te pousse à participer. Que fais-tu ?",
      en: "A fight breaks out. People push you to join. What do you do?",
      ln: "Libanga ebimaki. Bazali kosimba yo. Okosala nini ?",
      sw: "Mapigano yamezuka. Wanakushinikiza. Unafanya nini?",
      lua: "Libanga me bima. Ke kukata nge. Udi ukusala nki?",
      kg: "Libanga me bima. Ke kukata nge. Nge ta sala nki?",
    },
  },
  {
    id: "discrimination",
    title: {
      fr: "Discrimination",
      en: "Discrimination",
      ln: "Discrimination",
      sw: "Ubaguzi",
      lua: "Discrimination",
      kg: "Discrimination",
    },
    intro: {
      fr: "On t'exclut d'une équipe à cause de ton origine ou ta langue. Comment réagis-tu ?",
      en: "You are excluded from a team because of your origin or language. How do you react?",
      ln: "Bazali kolongola yo na equipe mpo na origine to monoko. Okosala nini ?",
      sw: "Unaondolewa kwenye timu kwa sababu ya asili au lugha. Unajibu vipi?",
      lua: "Ke kulongola nge na equipe mpo na origine. Udi ukusala nki?",
      kg: "Ke kulongola nge na equipe mpo na origine. Nge ta sala nki?",
    },
  },
  {
    id: "sextortion",
    title: {
      fr: "Photo intime et chantage",
      en: "Intimate photo blackmail",
      ln: "Photo ya bosembo na chantage",
      sw: "Picha ya siri na utapeli",
      lua: "Photo ya bosembo na chantage",
      kg: "Photo ya bosembo na chantage",
    },
    intro: {
      fr: "Quelqu'un menace de publier une photo intime. Que fais-tu ?",
      en: "Someone threatens to publish an intimate photo. What do you do?",
      ln: "Moto azali kobagia kobimisa photo ya bosembo. Okosala nini ?",
      sw: "Mtu anatishia kuchapisha picha ya siri. Unafanya nini?",
      lua: "Muntu ke bagia kubimisa photo ya bosembo. Udi ukusala nki?",
      kg: "Muntu ke bagia kubimisa photo ya bosembo. Nge ta sala nki?",
    },
  },
  {
    id: "peer_pressure",
    title: {
      fr: "Pression du groupe",
      en: "Peer pressure",
      ln: "Dikama ya groupe",
      sw: "Shinikizo la rika",
      lua: "Dikama ya groupe",
      kg: "Dikama ya groupe",
    },
    intro: {
      fr: "Des amis proposent quelque chose d'interdit pour « faire partie du groupe ». Que fais-tu ?",
      en: "Friends offer something forbidden to fit in. What do you do?",
      ln: "Bandeko bakopesa eloko epekisami mpo na kozala na groupe. Okosala nini ?",
      sw: "Marafiki wanakupa kitu kilichopigwa marufuku. Unafanya nini?",
      lua: "Bandeko ke kupesa eloko epekisami. Udi ukusala nki?",
      kg: "Bandeko ke kupesa eloko epekisami. Nge ta sala nki?",
    },
  },
  {
    id: "abuse",
    title: {
      fr: "Comportement inapproprié",
      en: "Inappropriate behavior",
      ln: "Behavior oyo ekiti te",
      sw: "Tabia isiyofaa",
      lua: "Behavior oyo ekiti te",
      kg: "Behavior oyo ekiti te",
    },
    intro: {
      fr: "Un adulte proche te touche ou te parle d'une façon qui te met mal à l'aise. Que fais-tu ?",
      en: "A close adult touches or talks in a way that makes you uncomfortable. What do you do?",
      ln: "Moto mokolo azali kosimba yo na ndenge ekangisi yo. Okosala nini ?",
      sw: "Mtu mzima anakugusa kwa njia inayokusumbua. Unafanya nini?",
      lua: "Muntu mukulu ke kukata na ndenge ekangisa nge. Udi ukusala nki?",
      kg: "Muntu mukulu ke kukata na ndenge ekangisa nge. Nge ta sala nki?",
    },
  },
  {
    id: "friend_sos",
    title: {
      fr: "Aider un ami en danger",
      en: "Help a friend in danger",
      ln: "Kosalisa moninga na likama",
      sw: "Kumsaidia rafiki hatari",
      lua: "Kusadisa moninga mu dikama",
      kg: "Kusadisa moninga na zingu",
    },
    intro: {
      fr: "Un ami t'écrit qu'il ou elle a peur chez lui ou elle ce soir. Que lui conseilles-tu ?",
      en: "A friend texts that they are afraid at home tonight. What do you advise?",
      ln: "Moninga azali kotinda ete azali na libanza na ndako. Okosakana nini ?",
      sw: "Rafiki anakutumia kwamba anaogopa nyumbani. Unashauri nini?",
      lua: "Moninga ke tinda ete udi na dikema na nzo. Udi ukusakana nki?",
      kg: "Moninga ke tinda ete kele na dikema na nzo. Nge ta sakana nki?",
    },
  },
];

export function getYouthScenario(id: string): YouthScenario | null {
  return YOUTH_SCENARIOS.find((s) => s.id === id) ?? null;
}
