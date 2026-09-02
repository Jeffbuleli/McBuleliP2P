export const locales = ["fr", "en", "ln", "sw", "lua", "kg"] as const;

export type Locale = (typeof locales)[number];

export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
  ln: "LN",
  sw: "SW",
  lua: "LU",
  kg: "KG",
};

type Copy = {
  tagline: string;
  speak: string;
  witness: string;
  prevent: string;
  resources: string;
  sos: string;
  sosHint: string;
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
  province: string;
  provincePick: string;
  city: string;
  cityPick: string;
  usePlace: string;
  gpsUnavailable: string;
  gpsDenied: string;
  place: string;
  voice: string;
  voiceListening: string;
  voiceUnsupported: string;
};

const baseFr: Copy = {
  tagline: "Sécurité - Paix",
  speak: "Parler",
  witness: "Témoin",
  prevent: "Prévenir",
  resources: "Aide",
  sos: "SOS",
  sosHint: "Danger",
  line: "Racontez - McBuleli IA comprend",
  powered: "McBuleli IA",
  back: "Retour",
  tell: "Que se passe-t-il ?",
  witnessTell: "Que voyez-vous ?",
  witnessSafety: "Ne vous mettez pas en danger. Signalez seulement.",
  placeholder: "Écrivez en peu de mots...",
  shareGps: "Partager ma position",
  skipGps: "Continuer sans",
  send: "Envoyer",
  sending: "Envoi...",
  gpsAsk: "Position pour aider - jamais obligatoire",
  alertOk: "Alerte reçue",
  humanSoon: "Orientation en cours",
  urgency: "Urgence",
  emergencyHint: "Si danger immédiat - appelez les secours locaux",
  home: "Accueil",
  errorGeneric: "Erreur - réessayez",
  province: "Province",
  provincePick: "Choisir une province",
  city: "Ville / commune",
  cityPick: "Choisir une ville",
  usePlace: "Utiliser ce lieu",
  gpsUnavailable: "GPS indisponible - choisissez un lieu",
  gpsDenied: "Position refusée - choisissez province et ville",
  place: "Lieu",
  voice: "Parler",
  voiceListening: "Écoute...",
  voiceUnsupported: "Voix non dispo sur cet appareil",
};

export const messages: Record<Locale, Copy> = {
  fr: baseFr,
  en: {
    ...baseFr,
    tagline: "Safety - Peace",
    speak: "Speak",
    witness: "Witness",
    prevent: "Prevent",
    resources: "Help",
    sosHint: "Danger",
    line: "Tell us - McBuleli AI understands",
    powered: "McBuleli AI",
    back: "Back",
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
    urgency: "Urgency",
    emergencyHint: "If in immediate danger - call local emergency services",
    home: "Home",
    errorGeneric: "Error - try again",
    province: "Province",
    provincePick: "Choose a province",
    city: "City / commune",
    cityPick: "Choose a city",
    usePlace: "Use this place",
    gpsUnavailable: "GPS unavailable - pick a place",
    gpsDenied: "Location denied - choose province and city",
    place: "Place",
    voice: "Speak",
    voiceListening: "Listening...",
    voiceUnsupported: "Voice not available on this device",
  },
  ln: {
    ...baseFr,
    tagline: "Bomoi - Kimya",
    speak: "Loba",
    witness: "Momonisi",
    prevent: "Kobatela",
    resources: "Lisalisi",
    sosHint: "Likama",
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
    province: "Provense",
    provincePick: "Pona provense",
    city: "Engumba / commune",
    cityPick: "Pona engumba",
    usePlace: "Salelisa esika oyo",
    gpsUnavailable: "GPS ezali te - pona esika",
    gpsDenied: "Esika eboyami - pona provense na engumba",
    place: "Esika",
    voice: "Loba",
    voiceListening: "Koyoka...",
    voiceUnsupported: "Mongongo ezali te",
  },
  sw: {
    ...baseFr,
    tagline: "Usalama - Amani",
    speak: "Ongea",
    witness: "Shahidi",
    prevent: "Zuia",
    resources: "Msaada",
    sosHint: "Hatari",
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
    province: "Mkoa",
    provincePick: "Chagua mkoa",
    city: "Jiji / kata",
    cityPick: "Chagua jiji",
    usePlace: "Tumia eneo hili",
    gpsUnavailable: "GPS haipatikani - chagua eneo",
    gpsDenied: "Eneo limekataliwa - chagua mkoa na jiji",
    place: "Eneo",
    voice: "Ongea",
    voiceListening: "Inasikiliza...",
    voiceUnsupported: "Sauti haipatikani",
  },
  lua: {
    ...baseFr,
    tagline: "Lushindama - Mutende",
    speak: "Amba",
    witness: "Mumonishi",
    prevent: "Lukengela",
    resources: "Dishinda",
    sosHint: "Dikama",
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
    province: "Provense",
    provincePick: "Sungula provense",
    city: "Cishi / commune",
    cityPick: "Sungula cishi",
    usePlace: "Sadisha kala eyi",
    gpsUnavailable: "GPS kechi - sungula kala",
    gpsDenied: "Kala kaswilwa - sungula provense ne cishi",
    place: "Kala",
    voice: "Amba",
    voiceListening: "Kuyuva...",
    voiceUnsupported: "Diwi dikeci",
  },
  kg: {
    ...baseFr,
    tagline: "Luvuvamu - Ngemba",
    speak: "Vova",
    witness: "Nsungidi",
    prevent: "Lunda",
    resources: "Lusadisu",
    sosHint: "Zingu",
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
    province: "Provense",
    provincePick: "Sola provense",
    city: "Engumba / commune",
    cityPick: "Sola engumba",
    usePlace: "Sadisa kisika yai",
    gpsUnavailable: "GPS kele ve - sola kisika",
    gpsDenied: "Kisika me buyama - sola provense ye engumba",
    place: "Kisika",
    voice: "Vova",
    voiceListening: "Ke wa...",
    voiceUnsupported: "Ndinga kele ve",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
