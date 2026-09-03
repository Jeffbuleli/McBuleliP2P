import type { Locale } from "@/lib/i18n";

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
      fr: "Ton/ta partenaire insiste pour aller plus loin alors que tu hesites. Que fais-tu ?",
      en: "Your partner pushes you further while you hesitate. What do you do?",
      ln: "Partenaire na yo ezali kosimba yo mpo na kokende liboso ntango ozali kozanga confiance. Okosala nini ?",
      sw: "Mpenzi wako anakushinikiza uendelee wakati una shaka. Unafanya nini?",
      lua: "Partenaire na nge ke kukata mpo na kuya mbele ntangu udi na dikema. Udi ukudifila nki?",
      kg: "Partenaire na nge ke kukata mpo na kuya mbele ntangu kele na dikema. Nge ta sala nki?",
    },
  },
  {
    id: "cyberbullying",
    title: {
      fr: "Cyberharcelement",
      en: "Cyberbullying",
      ln: "Cyberharcelement",
      sw: "Unyanyasaji mtandaoni",
      lua: "Cyberharcelement",
      kg: "Cyberharcelement",
    },
    intro: {
      fr: "Des messages moqueurs circulent sur toi dans un groupe WhatsApp de classe. Comment reagis-tu ?",
      en: "Mocking messages about you spread in a class WhatsApp group. How do you react?",
      ln: "Ba messages ya koséka yo ezali kobima na groupe WhatsApp ya classe. Okosala nini ?",
      sw: "Ujumbe wa kudhihaki unaenea kwenye kikundi cha WhatsApp cha darasa. Unajibu vipi?",
      lua: "Ba messages ya kuseka nge ke bima na groupe WhatsApp ya classe. Udi ukusala nki?",
      kg: "Ba messages ya kuseka nge ke bima na groupe WhatsApp ya classe. Nge ta sala nki?",
    },
  },
  {
    id: "corruption",
    title: {
      fr: "Corruption a l'ecole",
      en: "School corruption",
      ln: "Corruption na ecole",
      sw: "Rushwa shuleni",
      lua: "Corruption na ecole",
      kg: "Corruption na ecole",
    },
    intro: {
      fr: "Un enseignant demande de l'argent pour reussir un examen. Que fais-tu ?",
      en: "A teacher asks for money to pass an exam. What do you do?",
      ln: "Moyekoli azali kosenga mbongo mpo na okoka examen. Okosala nini ?",
      sw: "Mwalimu anaomba pesa ili upite mtihani. Unafanya nini?",
      lua: "Moyekoli ke lomba mbongo mpo na ukale examen. Udi ukusala nki?",
      kg: "Moyekoli ke lomba mbongo mpo na nge kale examen. Nge ta sala nki?",
    },
  },
  {
    id: "bullying",
    title: {
      fr: "Moqueries a l'ecole",
      en: "School bullying",
      ln: "Koseka na ecole",
      sw: "Dhihaka shuleni",
      lua: "Kuseka na ecole",
      kg: "Kuseka na ecole",
    },
    intro: {
      fr: "Chaque jour des camarades se moquent de toi a la recreation. Que fais-tu ?",
      en: "Classmates mock you every day at break. What do you do?",
      ln: "Mikolo nyonso bandeko bazali koséka yo na recreation. Okosala nini ?",
      sw: "Wanafunzi wanakudhihaki kila siku wakati wa mapumziko. Unafanya nini?",
      lua: "Mikolo nyonso bandeko ke kuseka nge na recreation. Udi ukusala nki?",
      kg: "Mikolo nyonso bandeko ke kuseka nge na recreation. Nge ta sala nki?",
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
      fr: "Une bagarre eclate entre deux groupes. On te pousse a participer. Que fais-tu ?",
      en: "A fight breaks out between two groups. People push you to join. What do you do?",
      ln: "Libanga ebimaki na kati ya ba groupes mibale. Bazali kosimba yo mpo na kozala na kati. Okosala nini ?",
      sw: "Mapigano yamezuka kati ya makundi mawili. Wanakushinikiza ujiunge. Unafanya nini?",
      lua: "Libanga me bima na kati ya ba groupes mibe. Ke kukata nge mpo na kukota. Udi ukusala nki?",
      kg: "Libanga me bima na kati ya ba groupes mibe. Ke kukata nge mpo na kukota. Nge ta sala nki?",
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
      fr: "On t'exclut d'une equipe sportive a cause de ton origine ou ta langue. Comment reagis-tu ?",
      en: "You are excluded from a sports team because of your origin or language. How do you react?",
      ln: "Bazali kolongola yo na equipe ya sport mpo na origine to monoko na yo. Okosala nini ?",
      sw: "Unaondolewa kwenye timu ya michezo kwa sababu ya asili au lugha yako. Unajibu vipi?",
      lua: "Ke kulongola nge na equipe ya sport mpo na origine to luyi na nge. Udi ukusala nki?",
      kg: "Ke kulongola nge na equipe ya sport mpo na origine to luyi na nge. Nge ta sala nki?",
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
      fr: "Quelqu'un menace de publier une photo intime si tu ne fais pas ce qu'il demande. Que fais-tu ?",
      en: "Someone threatens to publish an intimate photo unless you obey. What do you do?",
      ln: "Moto moko azali kobagia kobimisa photo ya bosembo soki okosala te oyo alobi. Okosala nini ?",
      sw: "Mtu anatishia kuchapisha picha ya siri usipofanya anachotaka. Unafanya nini?",
      lua: "Muntu moko ke bagia kubimisa photo ya bosembo soki udi ukusala ve oyo aloba. Udi ukusala nki?",
      kg: "Muntu moko ke bagia kubimisa photo ya bosembo soki nge sala ve oyo aloba. Nge ta sala nki?",
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
      fr: "Des amis te proposent de consommer quelque chose d'interdit pour 'faire partie du groupe'. Que fais-tu ?",
      en: "Friends offer something forbidden to 'fit in'. What do you do?",
      ln: "Bandeko bazali kopesa yo eloko oyo epekisami mpo na 'kozala na groupe'. Okosala nini ?",
      sw: "Marafiki wanakupa kitu kilichopigwa marufuku ili 'ustawi'. Unafanya nini?",
      lua: "Bandeko ke kupesa nge eloko oyo epekisami mpo na 'kukala na groupe'. Udi ukusala nki?",
      kg: "Bandeko ke kupesa nge eloko oyo epekisami mpo na 'kukala na groupe'. Nge ta sala nki?",
    },
  },
  {
    id: "abuse",
    title: {
      fr: "Comportement inapproprie",
      en: "Inappropriate behavior",
      ln: "Behavior oyo ekiti te",
      sw: "Tabia isiyofaa",
      lua: "Behavior oyo ekiti te",
      kg: "Behavior oyo ekiti te",
    },
    intro: {
      fr: "Un adulte proche te touche ou parle d'une facon qui te met mal a l'aise. Que fais-tu ?",
      en: "A close adult touches or talks to you in a way that makes you uncomfortable. What do you do?",
      ln: "Moto mokolo oyo ozali koyeba azali kosimba yo to koloba na yo na ndenge oyo ekangisi yo. Okosala nini ?",
      sw: "Mtu mzima unayemjua anakugusa au kuzungumza nawe kwa njia inayokusumbua. Unafanya nini?",
      lua: "Muntu mukulu oyo udi uyeya ke kukata to kuloba na nge na ndenge oyo ekangisa nge. Udi ukusala nki?",
      kg: "Muntu mukulu oyo nge me yeya ke kukata to kuloba na nge na ndenge oyo ekangisa nge. Nge ta sala nki?",
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
      fr: "Un ami t'ecrit qu'il/elle a peur chez lui/elle ce soir. Que lui conseilles-tu ?",
      en: "A friend texts that they are afraid at home tonight. What do you advise?",
      ln: "Moninga azali kotinda message ete azali na libanza na ndako na ye lelo butu. Okosakana nini ?",
      sw: "Rafiki anakutumia ujumbe kwamba anaogopa nyumbani leo usiku. Unashauri nini?",
      lua: "Moninga ke tinda message ete udi na dikema na nzo na ye lelo butu. Udi ukusakana nki?",
      kg: "Moninga ke tinda message ete kele na dikema na nzo na ye lelo butu. Nge ta sakana nki?",
    },
  },
];

export function getYouthScenario(id: string): YouthScenario | null {
  return YOUTH_SCENARIOS.find((s) => s.id === id) ?? null;
}
