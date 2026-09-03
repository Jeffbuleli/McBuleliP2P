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
  discreteShake: string;
  resources: string;
  prevent: string;
  trustedContactsTitle: string;
  trustedContactsSubtitle: string;
  trustedContactLabel: string;
  trustedContactName: string;
  trustedContactPhone: string;
  trustedContactEmail: string;
  trustedContactRemove: string;
  trustedContactAdd: string;
  trustedContactsSave: string;
  trustedContactsSkip: string;
  trustedContactsError: string;
  trustedContactsLink: string;
};

const fr: Copy = {
  tagline: "Sécurité - Paix",
  sos: "SOS",
  sosHint: "Danger",
  witness: "Témoin",
  discrete: "Mode discret",
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
  gpsAsk: "La position aide - elle n'est jamais obligatoire",
  alertOk: "Alerte reçue",
  humanSoon: "Orientation en cours",
  urgency: "Urgence",
  emergencyHint: "Si danger immédiat - appelez aussi les secours locaux",
  home: "Accueil",
  errorGeneric: "Erreur - réessayez",
  provincePick: "Choisir une province",
  usePlace: "Utiliser ce lieu",
  discreteSend: "Envoyer discrètement",
  discreteSafety: "Si quelqu'un surveille votre écran, écrivez peu de mots.",
  discreteTap: "Un triple appui sur le logo NGEMBA ouvre le mode discret.",
  discreteShake: "Secouez le téléphone 5 fois pour le mode discret.",
  resources: "Aide",
  prevent: "Prévenir",
  trustedContactsTitle: "Contacts de confiance",
  trustedContactsSubtitle: "1 à 3 personnes prévenues en même temps que l'opérateur NGEMBA.",
  trustedContactLabel: "Contact",
  trustedContactName: "Prénom ou surnom",
  trustedContactPhone: "Téléphone (+243...)",
  trustedContactEmail: "Email (optionnel)",
  trustedContactRemove: "Retirer",
  trustedContactAdd: "Ajouter un contact",
  trustedContactsSave: "Enregistrer",
  trustedContactsSkip: "Plus tard",
  trustedContactsError: "Ajoutez au moins un contact avec un nom et un téléphone.",
  trustedContactsLink: "Mes contacts de confiance",
};

export const messages: Record<Locale, Copy> = {
  fr,
  en: {
    ...fr,
    tagline: "Safety - Peace",
    sos: "SOS",
    sosHint: "Danger",
    witness: "Witness",
    discrete: "Discrete mode",
    line: "Tell - McBuleli AI understands",
    powered: "McBuleli AI",
    back: "Back",
    tell: "What is happening?",
    witnessTell: "What do you see?",
    witnessSafety: "Don't put yourself in danger. Just report.",
    placeholder: "Write in a few words...",
    shareGps: "Share my location",
    skipGps: "Continue without",
    send: "Send",
    sending: "Sending...",
    gpsAsk: "Location helps - it's never mandatory",
    alertOk: "Alert received",
    humanSoon: "Guidance in progress",
    urgency: "Urgency",
    emergencyHint: "If in immediate danger - also call local emergency services",
    home: "Home",
    errorGeneric: "Error - please try again",
    provincePick: "Choose a province",
    usePlace: "Use this place",
    discreteSend: "Send discreetly",
    discreteSafety: "If someone is watching your screen, write in few words.",
    discreteTap: "Triple tap on the NGEMBA logo opens discrete mode.",
    discreteShake: "Shake the phone 5 times for discreet mode.",
    resources: "Help",
    prevent: "Prevent",
    trustedContactsTitle: "Trusted Contacts",
    trustedContactsSubtitle: "1 to 3 people notified at the same time as the NGEMBA operator.",
    trustedContactLabel: "Contact",
    trustedContactName: "First name or nickname",
    trustedContactPhone: "Phone (+243...)",
    trustedContactEmail: "Email (optional)",
    trustedContactRemove: "Remove",
    trustedContactAdd: "Add a contact",
    trustedContactsSave: "Save",
    trustedContactsSkip: "Later",
    trustedContactsError: "Add at least one contact with a name and a phone number.",
    trustedContactsLink: "My trusted contacts",
  },
  ln: {
    ...fr,
    tagline: "Ekombo - Biso",
    sos: "SOS",
    sosHint: "Bango",
    witness: "Mokangisi",
    discrete: "Mode ya kokanga",
    line: "Lobela - McBuleli IA ayokaka",
    powered: "McBuleli IA",
    back: "Koma",
    tell: "Nani ezali kosalema?",
    witnessTell: "Nani oyebaka?",
    witnessSafety: "Oka na likama. Lobela kaka.",
    placeholder: "Loba na makambo moke...",
    shareGps: "Sangisa esika na ngai",
    skipGps: "Kende na mposa",
    send: "Send",
    sending: "Kobeta...",
    gpsAsk: "Esika eza na mposa - ezali te na mposa",
    alertOk: "Alerte ekozali",
    humanSoon: "Mokano ezali na nzela",
    urgency: "Mokano",
    emergencyHint: "Soki likama ezali ya mbala - yebisa mpe ba secours ya lokal",
    home: "Ndako",
    errorGeneric: "Mabe - soki okoki, bongo bongo",
    provincePick: "Kanga bokonzi",
    usePlace: "Sangisa esika oyo",
    discreteSend: "Send na kokanga",
    discreteSafety: "Soki moto azali kotala ekran na yo, lobela na makambo moke.",
    discreteTap: "Kokanga moke na logo NGEMBA ekokisa mode ya kokanga.",
    discreteShake: "Seka telefone na moke 5 mpo na mode ya moke.",
    resources: "Mokano",
    prevent: "Kokisa",
    trustedContactsTitle: "Bato ya motema",
    trustedContactsSubtitle: "1 to 3 bato oyo bazali na nzela na NGEMBA.",
    trustedContactLabel: "Bato",
    trustedContactName: "Nkombo to nkombo ya moke",
    trustedContactPhone: "Telefone (+243...)",
    trustedContactEmail: "Email (soki ezali)",
    trustedContactRemove: "Kanga",
    trustedContactAdd: "Kokota bato",
    trustedContactsSave: "Kokota",
    trustedContactsSkip: "Na nsima",
    trustedContactsError: "Kokota bato moko na nkombo mpe telefone.",
    trustedContactsLink: "Bato na ngai ya motema",
  },
  sw: {
    ...fr,
    tagline: "Usalama - Amani",
    sos: "SOS",
    sosHint: "Hatari",
    witness: "Shahidi",
    discrete: "Njia ya siri",
    line: "Sema - McBuleli IA inaelewa",
    powered: "McBuleli IA",
    back: "Rudi",
    tell: "Nini kinaendelea?",
    witnessTell: "Unaona nini?",
    witnessSafety: "Usijitie hatarini. Ripoti tu.",
    placeholder: "Andika kwa maneno machache...",
    shareGps: "Shiriki eneo langu",
    skipGps: "Endelea bila",
    send: "Tuma",
    sending: "Inatumwa...",
    gpsAsk: "Eneo lina msaada - halitakiwi kila wakati",
    alertOk: "Tahadhari imepokelewa",
    humanSoon: "Mwongozo unaendelea",
    urgency: "Uharaka",
    emergencyHint: "Kama uko hatarini - pia piga huduma za dharura za eneo",
    home: "Nyumbani",
    errorGeneric: "Kosa - tafadhali jaribu tena",
    provincePick: "Chagua mkoa",
    usePlace: "Tumia mahali hapa",
    discreteSend: "Tuma kwa siri",
    discreteSafety: "Ikiwa mtu anatazama skrini yako, andika kwa maneno machache.",
    discreteTap: "Gusa mara tatu kwenye nembo ya NGEMBA kufungua njia ya siri.",
    discreteShake: "Tikishe simu mara 5 kwa ajili ya hali ya siri.",
    resources: "Msaada",
    prevent: "Kinga",
    trustedContactsTitle: "Wasiliana wa Kuaminika",
    trustedContactsSubtitle: "Watu 1 hadi 3 wanaonyeshwa kwa wakati mmoja na opereta wa NGEMBA.",
    trustedContactLabel: "Wasiliana",
    trustedContactName: "Jina au jina la utani",
    trustedContactPhone: "Simu (+243...)",
    trustedContactEmail: "Barua pepe (hiari)",
    trustedContactRemove: "Ondoa",
    trustedContactAdd: "Ongeza wasiliana",
    trustedContactsSave: "Hifadhi",
    trustedContactsSkip: "Baadaye",
    trustedContactsError: "Ongeza angalau wasiliana mmoja mwenye jina na simu.",
    trustedContactsLink: "Wasiliana zangu wa kuaminika",
  },
  lua: {
    ...fr,
    tagline: "Bokisi - Amani",
    sos: "SOS",
    sosHint: "Bango",
    witness: "Mokangisi",
    discrete: "Mode ya kokanga",
    line: "Lobela - McBuleli IA ayokaka",
    powered: "McBuleli IA",
    back: "Koma",
    tell: "Nani ezali kosalema?",
    witnessTell: "Nani oyebaka?",
    witnessSafety: "Oka na likama. Lobela kaka.",
    placeholder: "Loba na makambo moke...",
    shareGps: "Sangisa esika na ngai",
    skipGps: "Kende na mposa",
    send: "Send",
    sending: "Kobeta...",
    gpsAsk: "Esika eza na mposa - ezali te na mposa",
    alertOk: "Alerte ekozali",
    humanSoon: "Mokano ezali na nzela",
    urgency: "Mokano",
    emergencyHint: "Soki likama ezali ya mbala - yebisa mpe ba secours ya lokal",
    home: "Ndako",
    errorGeneric: "Mabe - soki okoki, bongo bongo",
    provincePick: "Kanga bokonzi",
    usePlace: "Sangisa esika oyo",
    discreteSend: "Send na kokanga",
    discreteSafety: "Soki moto azali kotala ekran na yo, lobela na makambo moke.",
    discreteTap: "Kokanga moke na logo NGEMBA ekokisa mode ya kokanga.",
    discreteShake: "Tshikila telefone 5 nsuka mpo na mode ya moke.",
    resources: "Mokano",
    prevent: "Kokisa",
    trustedContactsTitle: "Bato ba motema",
    trustedContactsSubtitle: "1 to 3 bato oyo bazo zala na nzela na operete ya NGEMBA.",
    trustedContactLabel: "Bato",
    trustedContactName: "Nkombo to nkombo ya moke",
    trustedContactPhone: "Telefone (+243...)",
    trustedContactEmail: "Email (soki ezali)",
    trustedContactRemove: "Kanga",
    trustedContactAdd: "Kokota bato",
    trustedContactsSave: "Kokota",
    trustedContactsSkip: "Na nsima",
    trustedContactsError: "Kokota bato moko na nkombo mpe telefone.",
    trustedContactsLink: "Bato na ngai ba motema",
  },
  kg: {
    ...fr,
    tagline: "Bokisi - Amani",
    sos: "SOS",
    sosHint: "Bango",
    witness: "Mokangisi",
    discrete: "Mode ya kokanga",
    line: "Lobela - McBuleli IA ayokaka",
    powered: "McBuleli IA",
    back: "Koma",
    tell: "Nani ezali kosalema?",
    witnessTell: "Nani oyebaka?",
    witnessSafety: "Oka na likama. Lobela kaka.",
    placeholder: "Loba na makambo moke...",
    shareGps: "Sangisa esika na ngai",
    skipGps: "Kende na mposa",
    send: "Send",
    sending: "Kobeta...",
    gpsAsk: "Esika eza na mposa - ezali te na mposa",
    alertOk: "Alerte ekozali",
    humanSoon: "Mokano ezali na nzela",
    urgency: "Mokano",
    emergencyHint: "Soki likama ezali ya mbala - yebisa mpe ba secours ya lokal",
    home: "Ndako",
    errorGeneric: "Mabe - soki okoki, bongo bongo",
    provincePick: "Kanga bokonzi",
    usePlace: "Sangisa esika oyo",
    discreteSend: "Send na kokanga",
    discreteSafety: "Soki moto azali kotala ekran na yo, lobela na makambo moke.",
    discreteTap: "Kokanga moke na logo NGEMBA ekokisa mode ya kokanga.",
    discreteShake: "Tshika telefone 5 nsuka mpo na mode ya moke.",
    resources: "Mokano",
    prevent: "Kokisa",
    trustedContactsTitle: "Bato ba motema",
    trustedContactsSubtitle: "1 to 3 bato oyo bazo zala na nzela na operete ya NGEMBA.",
    trustedContactLabel: "Bato",
    trustedContactName: "Nkombo to nkombo ya moke",
    trustedContactPhone: "Telefone (+243...)",
    trustedContactEmail: "Email (soki ezali)",
    trustedContactRemove: "Kanga",
    trustedContactAdd: "Kokota bato",
    trustedContactsSave: "Kokota",
    trustedContactsSkip: "Na nsima",
    trustedContactsError: "Kokota bato moko na nkombo mpe telefone.",
    trustedContactsLink: "Bato na ngai ba motema",
  },
};

const URGENCY: Record<Locale, Record<string, string>> = {
  fr: { critical: "Critique", high: "Élevée", medium: "Moyenne", low: "Faible", info: "Info" },
  en: { critical: "Critical", high: "High", medium: "Moderate", low: "Low", info: "Info" },
  ln: { critical: "Likama mingi", high: "Likama", medium: "Kati-kati", low: "Moke", info: "Lisolo" },
  sw: { critical: "Hatari kubwa", high: "Hatari", medium: "Wastani", low: "Chini", info: "Taarifa" },
  lua: { critical: "Dikama dikulu", high: "Dikama", medium: "Kati", low: "Fioti", info: "Maloba" },
  kg: { critical: "Zingu ya nene", high: "Zingu", medium: "Kati", low: "Fioti", info: "Nsangu" },
};

export function urgencyLabel(locale: Locale, urgency: string): string {
  return URGENCY[locale]?.[urgency] ?? urgency;
}
