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
      sw: "Ruhusa na shinikizo",
      lua: "Kukundwa na kudi",
      kg: "Kansolo na mfunu",
    },
    intro: {
      fr: "Ton ou ta partenaire insiste pour aller plus loin alors que tu hésites. Que fais-tu ?",
      en: "Your partner insists on going further while you hesitate. What do you do?",
      ln: "Mokomi na yo to partner na yo azali kosenga mpo na kokende liboso soki ozali na mposa. Oko sala nini ?",
      sw: "Mpenzi wako anasisitiza kuendelea zaidi wakati wewe unatatizika. Unafanya nini?",
      lua: "Mukaji to mulume wenu udi kusonga kuenda mbela, kasi wewe udi na dipima. Wewe udi kusala ninyi?",
      kg: "Nkento to bakala na nge udi kusonga kuenda mbela, kasi nge udi na dipima. Nge udi kusala nki?",
    },
  },
  {
    id: "cyberbullying",
    title: {
      fr: "Cyberharcèlement",
      en: "Cyberbullying",
      ln: "Kokangisa na internet",
      sw: "Uonevu mtandaoni",
      lua: "Kokangisa na internet",
      kg: "Kokangisa na internet",
    },
    intro: {
      fr: "Des messages moqueurs circulent sur toi dans un groupe WhatsApp de classe. Comment réagis-tu ?",
      en: "Mocking messages about you are circulating in a class WhatsApp group. How do you react?",
      ln: "Bokomi ya mabe ezali kolanda yo na groupe WhatsApp ya classe. Oyo okosala nini?",
      sw: "Ujumbe wa dhihaka unazunguka kuhusu wewe katika kundi la WhatsApp la darasa. Unajibu vipi?",
      lua: "Bikala bikalaka bikalaka ku mabele ya ngemba na groupe WhatsApp ya l'école. Oyo oza na ndenge nini?",
      kg: "Biso na WhatsApp ya banzela, banzela ya mabe ezali kolanda yo. Oyo okosala nini?",
    },
  },
  {
    id: "corruption",
    title: {
      fr: "Corruption à l'école",
      en: "Corruption at School",
      ln: "Corruption na ekole",
      sw: "Ufisadi shuleni",
      lua: "Ufisadi na ekolu",
      kg: "Ufisadi na ekole",
    },
    intro: {
      fr: "Un enseignant demande de l'argent pour réussir un examen. Que fais-tu ?",
      en: "A teacher asks for money to pass an exam. What do you do?",
      ln: "Mokonzi ya mosala abengi mbongo mpo na kokoma na examen. Olingi kosala nini ?",
      sw: "Mwalimu anataka pesa ili upate alama nzuri kwenye mtihani. Unafanya nini?",
      lua: "Mokolo mosi, mwalimu asanga mbongo mpo na kokoma na examen. Olingi kosala nini ?",
      kg: "Mokolo mosi, mobali ya koyekola azali koluka mbongo mpo na kokoma na examen. Okozala na nini?",
    },
  },
  {
    id: "bullying",
    title: {
      fr: "Moqueries à l'école",
      en: "Mockery at School",
      ln: "Mokolo ya mabe na ekolo",
      sw: "Dhihaka shuleni",
      lua: "Mokolo ya banzela",
      kg: "Mokolo ya mabe na eskwela",
    },
    intro: {
      fr: "Chaque jour, des camarades se moquent de toi à la récréation. Que fais-tu ?",
      en: "Every day, classmates mock you during recess. What do you do?",
      ln: "Bokolo ya mokolo, baninga bazali kosala yo mabe na esika ya kolala. Okozala na nini?",
      sw: "Kila siku, wenzako wanakudhihaki wakati wa mapumziko. Unafanya nini?",
      lua: "Bikala, banzela ba yo bakokaka yo na mokolo ya nsuka. Okozala nini?",
      kg: "Bokolo ya mokolo, baninga bazali kokoma yo na mabe na eskwela. Okozala na nini?",
    },
  },
  {
    id: "violence",
    title: {
      fr: "Bagarre dans la cour",
      en: "Fight in the Yard",
      ln: "Mokolo ya banzela",
      sw: "Vita katika uwanja",
      lua: "Bokokolo mu nganda",
      kg: "Kukanga na mbanza",
    },
    intro: {
      fr: "Une bagarre éclate entre deux groupes. On te pousse à participer. Que fais-tu ?",
      en: "A fight breaks out between two groups. You are pushed to participate. What do you do?",
      ln: "Mokolo ya banzela ebandi kati na mibeko mibale. Oyo olingi kokota na yango. Okozala na nini?",
      sw: "Vita inazuka kati ya vikundi viwili. Unasukumwa kushiriki. Unafanya nini?",
      lua: "Bokokolo buseka pakati ya mibale. Oyo bakupusaka kuti olinga. Olinga nini?",
      kg: "Kukanga kima kati ya banzela mibale. Oyo ozozola ku zinga. Nki ozozola?",
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
      ln: "Oyo bakoyokela yo na équipe sportive mpo na origine na yo to langue na yo. Oyo okosala?",
      sw: "Unatengwa katika timu ya michezo kwa sababu ya asili yako au lugha yako. Unajibu vipi?",
      lua: "Bato bakutika na nganda ya sport pamba na nzela ya mboka na yo to na limbo na yo. Oyo okanisa nki?",
      kg: "Bato bakutaka na ntima ya ekolo na yo to na lingala na yo. Oyo oza na nzela nini?",
    },
  },
  {
    id: "sextortion",
    title: {
      fr: "Photo intime et chantage",
      en: "Intimate Photo and Blackmail",
      ln: "Foto ya solo mpe chantage",
      sw: "Picha ya faragha na unyanyasaji",
      lua: "Foto ya muku ne chantage",
      kg: "Foto ya ntima na chantage",
    },
    intro: {
      fr: "Quelqu'un menace de publier une photo intime si tu ne fais pas ce qu'il demande. Que fais-tu ?",
      en: "Someone threatens to publish an intimate photo if you don't do what they ask. What do you do?",
      ln: "Mokolo moko, moto azali na nzela ya kobanga yo na kokoma foto ya solo soki okokutana na ye. Okozala na nini?",
      sw: "Mtu anakuandikia ujumbe wa kutishia kwamba atachapisha picha yako ya faragha ikiwa hutafanya kile anachotaka. Unafanya nini?",
      lua: "Muntu akutemekela ku bupanga foto ya muku soki o ne udi kudi kudi ku bupanga. O bupanga nki?",
      kg: "Mokolo mosi, muntu akokisi na yo na kotalisa foto ya ntima soki okokanga te oyo akotaka. Oko sala nini?",
    },
  },
  {
    id: "peer_pressure",
    title: {
      fr: "Pression du groupe",
      en: "Peer Pressure",
      ln: "Mokano ya libanda",
      sw: "Shinikizo la kikundi",
      lua: "Kukala mu mbandu",
      kg: "Kukanga ya nganda",
    },
    intro: {
      fr: "Des amis te proposent de consommer quelque chose d'interdit pour « faire partie du groupe ». Que fais-tu ?",
      en: "Friends offer you something forbidden to 'fit in'. What do you do?",
      ln: "Bato ya sango bazali kopesa yo nzela ya kolia eloko moko ya kobanga mpo na kokota na mokano. Oko sala nini?",
      sw: "Marafiki wanakupatia pendekezo la kutumia kitu kisichoruhusiwa ili uwe sehemu ya kikundi. Unafanya nini?",
      lua: "Bafwidi banga ku kabila kintu kikalaka kuti ube mu mbandu. Uli kudi?",
      kg: "Bato ya sango bakopesa yo nzela ya kolia eloko ya kobanga mpo na kokota na nganda. Oko sala nini?",
    },
  },
  {
    id: "abuse",
    title: {
      fr: "Comportement inapproprié",
      en: "Inappropriate Behavior",
      ln: "Mokano ya mabe",
      sw: "Tabia isiyofaa",
      lua: "Mokolo ya mabe",
      kg: "Kukwanga kima",
    },
    intro: {
      fr: "Un adulte proche te touche ou te parle d'une façon qui te met mal à l'aise. Que fais-tu ?",
      en: "A close adult touches or speaks to you in a way that makes you uncomfortable. What do you do?",
      ln: "Mokolo moko, moto ya mabe akotanga yo to akosala yo ndenge oyo ekozala na yo mabe. Okozala na nini?",
      sw: "Mtu mzima wa karibu anakugusa au anakuzungumzia kwa njia inayokufanya ujisikie vibaya. Unafanya nini?",
      lua: "Mokolo ya mobali to mobali ya sika akotanga yo to akokoma yo na ndenge oyo eza na mabe. Okozala na nini?",
      kg: "Mokolo mosi, mobali to mwasi ya mabe akotanga yo to akotanga yo na ndenge oyo eza na mabe. Okozala na nini?",
    },
  },
  {
    id: "friend_sos",
    title: {
      fr: "Aider un ami en danger",
      en: "Help a Friend in Danger",
      ln: "Kokangisa mobali na yo azali na nzala",
      sw: "Kumsaidia rafiki aliye hatarini",
      lua: "Kukangila muana wa muana mu kashinga",
      kg: "Kukanga mosi mu zola",
    },
    intro: {
      fr: "Un ami t'écrit qu'il ou elle a peur chez lui ou elle ce soir. Que lui conseilles-tu ?",
      en: "A friend texts you that they are scared at home tonight. What do you advise them?",
      ln: "Mobali na yo akolaki yo ete azali na mposa ya kokanga na ye na ndako na ye lelo. Oyo okosala na ye?",
      sw: "Rafiki anakuandikia kwamba anaogopa nyumbani kwake usiku huu. Unamshauri nini?",
      lua: "Muana wa muana akukandila kuti akalanga mu kashinga ka ye lelo. Nani ukananga?",
      kg: "Mosi a kanga yo ete a zola na ye na ndaku na ye lelo. Nki o zola ye?",
    },
  }
];

export function getYouthScenario(id: string): YouthScenario | null {
  return YOUTH_SCENARIOS.find((s) => s.id === id) ?? null;
}
