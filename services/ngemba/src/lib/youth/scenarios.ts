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
      en: "Consent and Pressure",
      ln: "Libanga na pression",
      sw: "Idhini na shinikizo",
      lua: "Kukolela na shinikizo",
      kg: "Kukolela na shinikizo",
    },
    intro: {
      fr: "Ton ou ta partenaire insiste pour aller plus loin alors que tu hésites. Que fais-tu ?",
      en: "Your partner insists on going further while you hesitate. What do you do?",
      ln: "Mokolo na yo alingi ko zala na makasi, kasi yo ozali na mposa. Oko sala nini?",
      sw: "Mpenzi wako anasisitiza kuendelea wakati unashindwa. Unafanya nini?",
      lua: "Mokolo wa yo alingi ko zala na makasi, kasi yo ozali na mposa. Oko sala nini?",
      kg: "Mokolo wa yo alingi ko zala na makasi, kasi yo ozali na mposa. Oko sala nini?",
    },
  },
  {
    id: "cyberbullying",
    title: {
      fr: "Cyberharcèlement",
      en: "Cyberbullying",
      ln: "Cyberharcèlement",
      sw: "Cyberbullying",
      lua: "Cyberharcèlement",
      kg: "Cyberharcèlement",
    },
    intro: {
      fr: "Des messages moqueurs circulent sur toi dans un groupe WhatsApp de classe. Comment réagis-tu ?",
      en: "Mocking messages about you are circulating in a class WhatsApp group. How do you react?",
      ln: "Bango bazali kolobela yo na groupe ya WhatsApp ya classe. Oko sala nini?",
      sw: "Ujumbe wa dhihaka unasambazwa kuhusu wewe katika kundi la WhatsApp la darasa. Unajibu vipi?",
      lua: "Bango bazali kolobela yo na groupe ya WhatsApp ya classe. Oko sala nini?",
      kg: "Bango bazali kolobela yo na groupe ya WhatsApp ya classe. Oko sala nini?",
    },
  },
  {
    id: "corruption",
    title: {
      fr: "Corruption à l'école",
      en: "Corruption at School",
      ln: "Corruption na école",
      sw: "Ufisadi shuleni",
      lua: "Ufisadi na shule",
      kg: "Ufisadi na shule",
    },
    intro: {
      fr: "Un enseignant demande de l'argent pour réussir un examen. Que fais-tu ?",
      en: "A teacher asks for money to pass an exam. What do you do?",
      ln: "Mokambi azali koluka mbongo mpo na kokanga examen. Oko sala nini?",
      sw: "Mwalimu anataka pesa ili upite mtihani. Unafanya nini?",
      lua: "Mokambi akoluka mbongo mpo na kokanga examen. Oko sala nini?",
      kg: "Mokambi akoluka mbongo mpo na kokanga examen. Oko sala nini?",
    },
  },
  {
    id: "bullying",
    title: {
      fr: "Moqueries à l'école",
      en: "Mockery at School",
      ln: "Moqueries na école",
      sw: "Dhihaka shuleni",
      lua: "Moqueries na shule",
      kg: "Moqueries na shule",
    },
    intro: {
      fr: "Chaque jour, des camarades se moquent de toi à la récréation. Que fais-tu ?",
      en: "Every day, classmates mock you during recess. What do you do?",
      ln: "Bato bazali kolobela yo na mbala nyonso na récréation. Oko sala nini?",
      sw: "Kila siku, wanafunzi wenzako wanakudhihaki wakati wa mapumziko. Unafanya nini?",
      lua: "Bato bazali kolobela yo na mbala nyonso na récréation. Oko sala nini?",
      kg: "Bato bazali kolobela yo na mbala nyonso na récréation. Oko sala nini?",
    },
  },
  {
    id: "violence",
    title: {
      fr: "Bagarre dans la cour",
      en: "Fight in the Yard",
      ln: "Bata na cour",
      sw: "Vita uwanjani",
      lua: "Bata na cour",
      kg: "Bata na cour",
    },
    intro: {
      fr: "Une bagarre éclate entre deux groupes. On te pousse à participer. Que fais-tu ?",
      en: "A fight breaks out between two groups. You are pushed to participate. What do you do?",
      ln: "Bata ebimi kati na mibale. Oko senga yo o zala na yango. Oko sala nini?",
      sw: "Vita vinatokea kati ya vikundi viwili. Unasukumwa kushiriki. Unafanya nini?",
      lua: "Bata ebimi kati na mibale. Oko senga yo o zala na yango. Oko sala nini?",
      kg: "Bata ebimi kati na mibale. Oko senga yo o zala na yango. Oko sala nini?",
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
      fr: "On t'exclut d'une équipe sportive à cause de ton origine ou de ta langue. Comment réagis-tu ?",
      en: "You are excluded from a sports team because of your background or language. How do you react?",
      ln: "Bato basili yo na équipe sportive mpo na origine na yo to langue. Oko sala nini?",
      sw: "Unatengwa kutoka timu ya michezo kwa sababu ya asili yako au lugha. Unajibu vipi?",
      lua: "Bato basili yo na équipe sportive mpo na origine na yo to langue. Oko sala nini?",
      kg: "Bato basili yo na équipe sportive mpo na origine na yo to langue. Oko sala nini?",
    },
  },
  {
    id: "sextortion",
    title: {
      fr: "Photo intime et chantage",
      en: "Intimate Photo and Blackmail",
      ln: "Photo intime na chantage",
      sw: "Picha ya faragha na unyanyasaji",
      lua: "Photo intime na chantage",
      kg: "Photo intime na chantage",
    },
    intro: {
      fr: "Quelqu'un menace de publier une photo intime si tu ne fais pas ce qu'il demande. Que fais-tu ?",
      en: "Someone threatens to publish an intimate photo if you don't do what they ask. What do you do?",
      ln: "Mokolo moko alingi koloba na yo soki okosala te. Oko sala nini?",
      sw: "Mtu anakuonya kuwa atachapisha picha ya faragha ikiwa hutafanya anavyotaka. Unafanya nini?",
      lua: "Mokolo moko alingi koloba na yo soki okosala te. Oko sala nini?",
      kg: "Mokolo moko alingi koloba na yo soki okosala te. Oko sala nini?",
    },
  },
  {
    id: "peer_pressure",
    title: {
      fr: "Pression du groupe",
      en: "Peer Pressure",
      ln: "Pression ya groupe",
      sw: "Shinikizo la kundi",
      lua: "Pression ya groupe",
      kg: "Pression ya groupe",
    },
    intro: {
      fr: "Des amis te proposent de consommer quelque chose d'interdit pour « faire partie du groupe ». Que fais-tu ?",
      en: "Friends offer you something forbidden to 'fit in'. What do you do?",
      ln: "Bato ya camarade bazali kopesa yo biloko ya mabe mpo na 'ko zala na groupe'. Oko sala nini?",
      sw: "Marafiki wanakupatia kitu kisichoruhusiwa ili 'kujiunga na kundi'. Unafanya nini?",
      lua: "Bato ya camarade bazali kopesa yo biloko ya mabe mpo na 'ko zala na groupe'. Oko sala nini?",
      kg: "Bato ya camarade bazali kopesa yo biloko ya mabe mpo na 'ko zala na groupe'. Oko sala nini?",
    },
  },
  {
    id: "abuse",
    title: {
      fr: "Comportement inapproprié",
      en: "Inappropriate Behavior",
      ln: "Comportement inapproprié",
      sw: "Tabia isiyofaa",
      lua: "Comportement inapproprié",
      kg: "Comportement inapproprié",
    },
    intro: {
      fr: "Un adulte proche te touche ou te parle d'une façon qui te met mal à l'aise. Que fais-tu ?",
      en: "A close adult touches or speaks to you in a way that makes you uncomfortable. What do you do?",
      ln: "Mokambi ya mabe akotisi yo to akolobela yo na ndenge oyo eko zala mabe. Oko sala nini?",
      sw: "Mtu mzima wa karibu anakugusa au anakuzungumzia kwa njia inayokufanya uhisi vibaya. Unafanya nini?",
      lua: "Mokambi ya mabe akotisi yo to akolobela yo na ndenge oyo eko zala mabe. Oko sala nini?",
      kg: "Mokambi ya mabe akotisi yo to akolobela yo na ndenge oyo eko zala mabe. Oko sala nini?",
    },
  },
  {
    id: "friend_sos",
    title: {
      fr: "Aider un ami en danger",
      en: "Help a Friend in Danger",
      ln: "Kokisa moninga na danger",
      sw: "Msaada kwa rafiki aliye hatarini",
      lua: "Kokisa moninga na danger",
      kg: "Kokisa moninga na danger",
    },
    intro: {
      fr: "Un ami t'écrit qu'il ou elle a peur chez lui ou elle ce soir. Que lui conseilles-tu ?",
      en: "A friend texts you that they are scared at home tonight. What do you advise them?",
      ln: "Moninga akolaki yo ete azali na peur na ndako na ye. Oko misi nini?",
      sw: "Rafiki anakutumia ujumbe kuwa anaogopa nyumbani kwake usiku huu. Unamshauri nini?",
      lua: "Moninga akolaki yo ete azali na peur na ndako na ye. Oko misi nini?",
      kg: "Moninga akolaki yo ete azali na peur na ndako na ye. Oko misi nini?",
    },
  }
];

export function getYouthScenario(id: string): YouthScenario | null {
  return YOUTH_SCENARIOS.find((s) => s.id === id) ?? null;
}
