export type Locale = "fr" | "en" | "ln" | "sw" | "lua" | "kg";

export const locales: Locale[] = ["fr", "en", "ln", "sw", "lua", "kg"];

export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ln: "LN",
  sw: "SW",
  lua: "LU",
  kg: "KG",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

type Copy = {
  tagline: string;
  sos: string;
  sosHint: string;
  witness: string;
  discrete: string;
  line: string;
  powered: string;
  back: string;
  tell: string;
  witnessTell: string;
  witnessSafety: string;
  placeholder: string;
  shareGps: string;
  skipGps: string;
  send: string;
  sending: string;
  gpsAsk: string;
  alertOk: string;
  humanSoon: string;
  urgency: string;
  emergencyHint: string;
  home: string;
  errorGeneric: string;
  provincePick: string;
  usePlace: string;
  discreteSend: string;
  discreteSafety: string;
  discreteTap: string;
  resources: string;
  prevent: string;
};

const fr: Copy = {
  tagline: "Securite - Paix",
  sos: "SOS",
  sosHint: "Danger",
  witness: "Temoin",
  discrete: "Mode discret",
  line: "Parlez - McBuleli IA comprend",
  powered: "McBuleli IA",
  back: "Retour",
  tell: "Que se passe-t-il ?",
  witnessTell: "Que voyez-vous ?",
  witnessSafety: "Ne vous mettez pas en danger. Signalez seulement.",
  placeholder: "Quelques mots...",
  shareGps: "Partager ma position",
  skipGps: "Continuer sans",
  send: "Envoyer",
  sending: "Envoi...",
  gpsAsk: "La position aide - jamais obligatoire",
  alertOk: "Alerte recue",
  humanSoon: "Une aide est en cours d'orientation",
  urgency: "Urgence",
  emergencyHint:
    "En danger immediat - appelez aussi les services d'urgence locaux",
  home: "Accueil",
  errorGeneric: "Erreur - reessayez",
  provincePick: "Choisir une province",
  usePlace: "Utiliser ce lieu",
  discreteSend: "Envoyer discretement",
  discreteSafety:
    "Si quelqu'un surveille votre ecran, ecrivez peu de mots.",
  discreteTap: "Triple-tap sur le logo pour le mode discret.",
  resources: "Aide",
  prevent: "Prevenir",
};

export const messages: Record<Locale, Copy> = {
  fr,
  en: {
    ...fr,
    tagline: "Safety - Peace",
    witness: "Witness",
    discrete: "Discrete mode",
    line: "Speak - McBuleli AI understands",
    tell: "What is happening?",
    witnessTell: "What do you see?",
    witnessSafety: "Do not put yourself in danger. Report only.",
    placeholder: "Write a few words...",
    shareGps: "Share my location",
    skipGps: "Continue without",
    send: "Send",
    sending: "Sending...",
    gpsAsk: "Location helps - never required",
    alertOk: "Alert received",
    humanSoon: "Help is being arranged",
    emergencyHint:
      "If in immediate danger - call local emergency services too",
    home: "Home",
    errorGeneric: "Error - try again",
    provincePick: "Choose a province",
    usePlace: "Use this place",
    discreteSend: "Send discreetly",
    discreteSafety: "If someone is watching your screen, use few words.",
    discreteTap: "Triple-tap the logo for discrete mode.",
    resources: "Help",
    prevent: "Prevent",
  },
  ln: {
    ...fr,
    tagline: "Bomoi - Kimya",
    witness: "Momonisi",
    discrete: "Mode ya bosembo",
    line: "Loba - McBuleli IA akozwa",
    back: "Zonga",
    tell: "Nini ezali?",
    witnessTell: "Omoni nini?",
    witnessSafety: "Kotia yo te na likama. Yebisa kaka.",
    placeholder: "Koma maloba moke...",
    shareGps: "Pesa esika na yo",
    skipGps: "Koba te",
    send: "Tinda",
    sending: "Ezali kotinda...",
    gpsAsk: "Esika ekoki kosalisa - esengeli te",
    alertOk: "Alerte ezwami",
    humanSoon: "Bosungi ezali",
    urgency: "Likama",
    emergencyHint: "Soki likama - benga basungi",
    home: "Ebandeli",
    errorGeneric: "Likambo - meka lisusu",
    provincePick: "Pona provense",
    usePlace: "Salelisa esika oyo",
    discreteSend: "Tinda na bosembo",
    discreteSafety: "Soki moto azali kotala ecran na yo, koma maloba moke.",
    discreteTap: "Tina logo NGEMBA mbala 3 mpo na mode ya bosembo.",
    resources: "Lisalisi",
    prevent: "Kobatela",
  },
  sw: {
    ...fr,
    tagline: "Usalama - Amani",
    witness: "Shahidi",
    discrete: "Hali ya siri",
    line: "Simulia - McBuleli IA inaelewa",
    back: "Rudi",
    tell: "Nini kinaendelea?",
    witnessTell: "Unaona nini?",
    witnessSafety: "Usijiweke hatarini. Ripoti tu.",
    placeholder: "Andika maneno machache...",
    shareGps: "Shiriki eneo",
    skipGps: "Endelea bila",
    send: "Tuma",
    sending: "Inatuma...",
    gpsAsk: "Eneo husaidia - si lazima",
    alertOk: "Tahadhari imepokelewa",
    humanSoon: "Msaada unaandaliwa",
    urgency: "Dharura",
    emergencyHint: "Ikiwa hatari - piga huduma za dharura",
    home: "Nyumbani",
    errorGeneric: "Hitilafu - jaribu tena",
    provincePick: "Chagua mkoa",
    usePlace: "Tumia eneo hili",
    discreteSend: "Tuma kwa siri",
    discreteSafety: "Ikiwa mtu anaangalia skrini yako, andika maneno machache.",
    discreteTap: "Gusa logo ya NGEMBA mara 3 kwa hali ya siri.",
    resources: "Msaada",
    prevent: "Zuia",
  },
  lua: {
    ...fr,
    tagline: "Lushindama - Mutende",
    witness: "Mumonishi",
    discrete: "Mode ya bosembo",
    line: "Amba - McBuleli IA udi umona",
    back: "Buela",
    tell: "Chinyi chidi?",
    witnessTell: "Wamona chinyi?",
    witnessSafety: "Ke ika wewe mu dikama. Ambila kenyeka.",
    placeholder: "Soneka maloba makelakela...",
    shareGps: "Pana kala",
    skipGps: "Enda bila",
    send: "Tuma",
    sending: "Kudi kutuma...",
    gpsAsk: "Kala kudi kusadisha - kechi kufunsha",
    alertOk: "Alerte yapokwa",
    humanSoon: "Lusadisu ludi",
    urgency: "Dikama",
    emergencyHint: "Nangu dikama - bikila basadishi",
    home: "Kumpala",
    errorGeneric: "Dikonso - shintuluka",
    provincePick: "Sungula provense",
    usePlace: "Sadisha kala eyi",
    discreteSend: "Tuma na bosembo",
    discreteSafety: "Nguwe muntu udi kutala ecran na nge, soneka maloba moke.",
    discreteTap: "Tina logo NGEMBA mbala 3 mpo na mode ya bosembo.",
    resources: "Dishinda",
    prevent: "Lukengela",
  },
  kg: {
    ...fr,
    tagline: "Luvuvamu - Ngemba",
    witness: "Nsungidi",
    discrete: "Mode ya bosembo",
    line: "Vova - McBuleli IA ke bakula",
    back: "Vutuka",
    tell: "Inki ke salama?",
    witnessTell: "Nge me mona nki?",
    witnessSafety: "Kutula nge ve na zingu. Zabisa kaka.",
    placeholder: "Soneka bangogo fioti...",
    shareGps: "Pesa kisika",
    skipGps: "Landila ve",
    send: "Tinda",
    sending: "Ke tinda...",
    gpsAsk: "Kisika lenda sadisa - ve mfunu",
    alertOk: "Alerte me bakama",
    humanSoon: "Lusadisu ke yela",
    urgency: "Zingu",
    emergencyHint: "Kana zingu - binga basadisi",
    home: "Nzo",
    errorGeneric: "Difu - meka diaka",
    provincePick: "Sola provense",
    usePlace: "Sadisa kisika yai",
    discreteSend: "Tinda na bosembo",
    discreteSafety: "Soki muntu ke talaka ecran na nge, sonika bangogo fioti.",
    discreteTap: "Tina logo NGEMBA mbala 3 mpo na mode ya bosembo.",
    resources: "Lusadisu",
    prevent: "Lunda",
  },
};

const URGENCY: Record<Locale, Record<string, string>> = {
  fr: { critical: "Critique", high: "Elevee", medium: "Moyenne", low: "Faible", info: "Info" },
  en: { critical: "Critical", high: "High", medium: "Moderate", low: "Low", info: "Info" },
  ln: { critical: "Likama mingi", high: "Likama", medium: "Kati-kati", low: "Moke", info: "Lisolo" },
  sw: { critical: "Hatari kubwa", high: "Hatari", medium: "Wastani", low: "Chini", info: "Taarifa" },
  lua: { critical: "Dikama dikulu", high: "Dikama", medium: "Kati", low: "Fioti", info: "Maloba" },
  kg: { critical: "Zingu ya nene", high: "Zingu", medium: "Kati", low: "Fioti", info: "Nsangu" },
};

export function urgencyLabel(locale: Locale, urgency: string): string {
  return URGENCY[locale]?.[urgency] ?? urgency;
}
