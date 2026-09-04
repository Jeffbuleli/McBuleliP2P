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
      ln: "Ndimbola mpe bokangi",
      sw: "Ruhusa na shinikizo",
      lua: "Kudiyamba ne dikenga",
      kg: "Lusolo na mpaku",
    },
    intro: {
      fr: "Ton ou ta partenaire insiste pour aller plus loin alors que tu hésites. Que fais-tu ?",
      en: "Your partner insists on going further while you hesitate. What do you do?",
      ln: "Mobali to mwasi na yo alingi kokende liboso, kasi yo ozali na ntina. Osali nini ?",
      sw: "Mpenzi wako anasisitiza kuendelea zaidi wakati wewe unatatizika. Unafanya nini?",
      lua: "Mukaji to mulume wenu udi kusonga kuenda mbela, kasi wewe udi na dipima. Usala ninyi?",
      kg: "Nkento to bakala na nge udi kusonga kuenda mbela, kasi nge udi na dipima. Usala nki?",
    },
  },
  {
    id: "cyberbullying",
    title: {
      fr: "Cyberharcèlement",
      en: "Cyberbullying",
      ln: "Kokanga na internet",
      sw: "Uonevu mtandaoni",
      lua: "Dikenga ku internet",
      kg: "Mpaku mu internet",
    },
    intro: {
      fr: "Des messages moqueurs circulent sur toi dans un groupe WhatsApp de classe. Comment réagis-tu ?",
      en: "Mocking messages about you are circulating in a class WhatsApp group. How do you react?",
      ln: "Baninga bazali kosala yo mabe na groupe WhatsApp ya classe. Osali nini ?",
      sw: "Ujumbe wa dhihaka unazunguka kuhusu wewe katika kundi la WhatsApp la darasa. Unajibu vipi?",
      lua: "Bantu badimuka ku wewe mu groupe WhatsApp ya ekolu. Usala ninyi?",
      kg: "Bantu basimba yo mabe mu groupe WhatsApp ya nzo-nkanda. Usala nki?",
    },
  },
  {
    id: "corruption",
    title: {
      fr: "Corruption à l'école",
      en: "Corruption at School",
      ln: "Koboya mbongo na eteyelo",
      sw: "Ufisadi shuleni",
      lua: "Kubenga mbongo ku ekolu",
      kg: "Kubaka mbongo mu nzo-nkanda",
    },
    intro: {
      fr: "Un enseignant demande de l'argent pour réussir un examen. Que fais-tu ?",
      en: "A teacher asks for money to pass an exam. What do you do?",
      ln: "Molakisi alingi mbongo mpo na kopesa yo maturité na examen. Osali nini ?",
      sw: "Mwalimu anataka pesa ili upate alama nzuri kwenye mtihani. Unafanya nini?",
      lua: "Mulayi usenga mbongo kudi upite ku examen. Usala ninyi?",
      kg: "Nlongi usenga mbongo kudi usuka ku examen. Usala nki?",
    },
  },
  {
    id: "bullying",
    title: {
      fr: "Moqueries à l'école",
      en: "Mockery at School",
      ln: "Koseka yo na eteyelo",
      sw: "Dhihaka shuleni",
      lua: "Kuseka ku ekolu",
      kg: "Kuseka mu nzo-nkanda",
    },
    intro: {
      fr: "Chaque jour, des camarades se moquent de toi à la récréation. Que fais-tu ?",
      en: "Every day, classmates mock you during recess. What do you do?",
      ln: "Mokolo na mokolo, baninga baseka yo na récréation. Osali nini ?",
      sw: "Kila siku, wenzako wanakudhihaki wakati wa mapumziko. Unafanya nini?",
      lua: "Kuluba, balunda baseka wewe ku récréation. Usala ninyi?",
      kg: "Kuluba, bana-nkanda baseka nge mu récréation. Usala nki?",
    },
  },
  {
    id: "violence",
    title: {
      fr: "Bagarre dans la cour",
      en: "Fight in the Yard",
      ln: "Etumba na ndako ya eteyelo",
      sw: "Vita katika uwanja",
      lua: "Dikenga mu nganda ya ekolu",
      kg: "Ntotila mu lumbu",
    },
    intro: {
      fr: "Une bagarre éclate entre deux groupes. On te pousse à participer. Que fais-tu ?",
      en: "A fight breaks out between two groups. You are pushed to participate. What do you do?",
      ln: "Etumba ebandi kati na biloko mibale. Baluki yo mpo na kokota. Osali nini ?",
      sw: "Vita inazuka kati ya vikundi viwili. Unasukumwa kushiriki. Unafanya nini?",
      lua: "Dikenga dibuka pakati ya mibale. Bakusonga kudi ukote. Usala ninyi?",
      kg: "Ntotila ibuka kati ya mabunda zole. Bakusonga kudi ukota. Usala nki?",
    },
  },
  {
    id: "discrimination",
    title: {
      fr: "Discrimination",
      en: "Discrimination",
      ln: "Koboya bato",
      sw: "Ubaguzi",
      lua: "Kuboya bantu",
      kg: "Kuboya bantu",
    },
    intro: {
      fr: "On t'exclut d'une équipe sportive à cause de ton origine ou de ta langue. Comment réagis-tu ?",
      en: "You are excluded from a sports team because of your background or language. How do you react?",
      ln: "Bakolongola yo na équipe ya sport mpo na mboka to lokota na yo. Osali nini ?",
      sw: "Unatengwa katika timu ya michezo kwa sababu ya asili yako au lugha yako. Unajibu vipi?",
      lua: "Bakutula ku équipe ya sport pamba na mboka to limbo yobe. Usala ninyi?",
      kg: "Bakutula ku équipe ya sport pamba na mboka to ndinga nage. Usala nki?",
    },
  },
  {
    id: "sextortion",
    title: {
      fr: "Photo intime et chantage",
      en: "Intimate Photo and Blackmail",
      ln: "Foto ya mabe mpe kobanga",
      sw: "Picha ya faragha na vitisho",
      lua: "Foto ya muku ne dikenga",
      kg: "Foto ya ntima na mpaku",
    },
    intro: {
      fr: "Quelqu'un menace de publier une photo intime si tu ne fais pas ce qu'il demande. Que fais-tu ?",
      en: "Someone threatens to publish an intimate photo if you don't do what they ask. What do you do?",
      ln: "Moto alaki yo ete akopanza foto ya solo soki osali te oyo alingi. Osali nini ?",
      sw: "Mtu anatisha kuchapisha picha yako ya faragha ikiwa hutafanya anachotaka. Unafanya nini?",
      lua: "Muntu ukukenga ku panga foto ya muku soki usala te oyo usenga. Usala ninyi?",
      kg: "Muntu ukukenga ku songa foto ya ntima soki usala te oyo usenga. Usala nki?",
    },
  },
  {
    id: "peer_pressure",
    title: {
      fr: "Pression du groupe",
      en: "Peer Pressure",
      ln: "Bokangi ya lingomba",
      sw: "Shinikizo la kikundi",
      lua: "Dikenga ya dibundu",
      kg: "Mpaku ya dibundu",
    },
    intro: {
      fr: "Des amis te proposent de consommer quelque chose d'interdit pour faire partie du groupe. Que fais-tu ?",
      en: "Friends offer you something forbidden to fit in with the group. What do you do?",
      ln: "Baninga bapesa yo eloko ya koboya mpo na kokota na lingomba. Osali nini ?",
      sw: "Marafiki wanakupa kitu kisichoruhusiwa ili uwe sehemu ya kikundi. Unafanya nini?",
      lua: "Balunda bakupa kintu kikalaka kudi ube mu dibundu. Usala ninyi?",
      kg: "Bamasa bakupa kima kikalaka kudi ube mu dibundu. Usala nki?",
    },
  },
  {
    id: "abuse",
    title: {
      fr: "Comportement inapproprié",
      en: "Inappropriate Behavior",
      ln: "Bosaleli ya mabe",
      sw: "Tabia isiyofaa",
      lua: "Dibumba dia mabe",
      kg: "Lusadilu lua mabe",
    },
    intro: {
      fr: "Un adulte proche te touche ou te parle d'une façon qui te met mal à l'aise. Que fais-tu ?",
      en: "A close adult touches or speaks to you in a way that makes you uncomfortable. What do you do?",
      ln: "Mokonzi ya mboka atoisi yo to alobi na yo ndenge oyo ezali te malamu. Osali nini ?",
      sw: "Mtu mzima wa karibu anakugusa au anakuzungumzia kwa njia inayokufanya ujisikie vibaya. Unafanya nini?",
      lua: "Mukulu wa pene ukukuma to ukuloba ndenge udi mabe. Usala ninyi?",
      kg: "Nkulu wa pene ukukuma to ukuvova ndenge udi mabe. Usala nki?",
    },
  },
  {
    id: "friend_sos",
    title: {
      fr: "Aider un ami en danger",
      en: "Help a Friend in Danger",
      ln: "Kosunga moninga na likama",
      sw: "Kumsaidia rafiki aliye hatarini",
      lua: "Kusunga mulunda mu dikenga",
      kg: "Kusadisa nkweno mu mpaku",
    },
    intro: {
      fr: "Un ami t'écrit qu'il ou elle a peur chez lui ou elle ce soir. Que lui conseilles-tu ?",
      en: "A friend texts you that they are scared at home tonight. What do you advise them?",
      ln: "Moninga akoma ete azali na bobangi na ndako ye lelo mpokwa. Obongisa ye nini ?",
      sw: "Rafiki anakuandikia kwamba anaogopa nyumbani kwake usiku huu. Unamshauri nini?",
      lua: "Mulunda ukukandila kuti udi ne bowa ku nzubo ye lelo. Umubuela ninyi?",
      kg: "Nkweno ukusonikila kuti udi ne bowa ku nzo ye lelo. Umubuela nki?",
    },
  },
];

export function getYouthScenario(id: string): YouthScenario | null {
  return YOUTH_SCENARIOS.find((s) => s.id === id) ?? null;
}
