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
  aiListening: string;
  polish: string;
  polishing: string;
  language: string;
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
  trustedContactRelation: string;
  trustedContactPhone: string;
  trustedContactEmail: string;
  trustedContactAddress: string;
  trustedContactRemove: string;
  trustedContactAdd: string;
  trustedContactsSave: string;
  trustedContactsSkip: string;
  trustedContactsError: string;
  trustedContactsLink: string;
  school: string;
  youth: string;
  schoolTitle: string;
  schoolSafety: string;
  schoolConcernPick: string;
  schoolConcernHarassment: string;
  schoolConcernViolence: string;
  schoolConcernAbuse: string;
  schoolConcernCyber: string;
  schoolConcernOther: string;
  schoolEstablishmentPlaceholder: string;
  schoolTell: string;
  schoolAnonymousNote: string;
  youthTitle: string;
  youthSubtitle: string;
  youthYourTurn: string;
  youthPlaceholder: string;
  youthSend: string;
  youthSosHint: string;
  youthBackToList: string;
  youthDisclaimer: string;
};

const fr: Copy = {
  tagline: "Sécurité - Paix",
  sos: "SOS",
  sosHint: "Danger",
  witness: "Témoin",
  discrete: "Mode discret",
  line: "Racontez - McBuleli IA comprend",
  powered: "McBuleli IA",
  aiListening: "McBuleli IA écoute",
  polish: "Clarifier",
  polishing: "Clarification...",
  language: "Langue",
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
  trustedContactsSubtitle:
    "1 à 3 proches pour aider les services si vous n'êtes plus joignable. Pas d'alerte automatique à chaque fois.",
  trustedContactLabel: "Contact",
  trustedContactName: "Prénom ou surnom",
  trustedContactRelation: "Lien (mère, ami, voisin...)",
  trustedContactPhone: "Téléphone (+243...)",
  trustedContactEmail: "Email (optionnel)",
  trustedContactAddress: "Adresse / quartier (optionnel)",
  trustedContactRemove: "Retirer",
  trustedContactAdd: "Ajouter un contact",
  trustedContactsSave: "Enregistrer",
  trustedContactsSkip: "Plus tard",
  trustedContactsError: "Ajoutez au moins un contact avec un nom et un téléphone ou email.",
  trustedContactsLink: "Mes contacts de confiance",
  school: "École",
  youth: "Jeunesse",
  schoolTitle: "Safe School - signalement protégé",
  schoolSafety: "Ton identité est protégée. Ce signalement va au référent école, séparé des dossiers adultes.",
  schoolConcernPick: "Type de situation",
  schoolConcernHarassment: "Harcèlement",
  schoolConcernViolence: "Violence",
  schoolConcernAbuse: "Abus / comportement inapproprié",
  schoolConcernCyber: "Cyberharcèlement",
  schoolConcernOther: "Autre",
  schoolEstablishmentPlaceholder: "Ex. Lycée X, commune Y",
  schoolTell: "Raconte ce qui se passe",
  schoolAnonymousNote: "Pas besoin de donner ton nom complet.",
  youthTitle: "McBuleli Jeunesse",
  youthSubtitle: "10 situations pour réfléchir - consentement, cyber, corruption, amitié. Pas de classement public.",
  youthYourTurn: "Et toi, que ferais-tu ?",
  youthPlaceholder: "Écris ta réponse...",
  youthSend: "Envoyer",
  youthSosHint: "Situation grave ? Utilise le bouton",
  youthBackToList: "<- Tous les scénarios",
  youthDisclaimer: "Guide éducatif - pas un avocat ni un médecin. En danger réel, utilise SOS NGEMBA.",
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
    aiListening: "McBuleli AI is listening",
    polish: "Clarify",
    polishing: "Clarifying...",
    language: "Language",
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
    trustedContactsSubtitle:
      "1 to 3 people who can help services if you become unreachable. Not notified automatically on every alert.",
    trustedContactLabel: "Contact",
    trustedContactName: "First name or nickname",
    trustedContactRelation: "Relation (mother, friend, neighbor...)",
    trustedContactPhone: "Phone (+243...)",
    trustedContactEmail: "Email (optional)",
    trustedContactAddress: "Address / neighborhood (optional)",
    trustedContactRemove: "Remove",
    trustedContactAdd: "Add a contact",
    trustedContactsSave: "Save",
    trustedContactsSkip: "Later",
    trustedContactsError: "Add at least one contact with a name and a phone or email.",
    trustedContactsLink: "My trusted contacts",
    school: "School",
    youth: "Youth",
    schoolTitle: "Safe School - protected report",
    schoolSafety: "Your identity is protected. This report goes to the school referent, separate from adult cases.",
    schoolConcernPick: "Type of situation",
    schoolConcernHarassment: "Harassment",
    schoolConcernViolence: "Violence",
    schoolConcernAbuse: "Abuse / inappropriate behavior",
    schoolConcernCyber: "Cyberbullying",
    schoolConcernOther: "Other",
    schoolEstablishmentPlaceholder: "E.g. High school X, district Y",
    schoolTell: "Tell us what is happening",
    schoolAnonymousNote: "You do not need to give your full name.",
    youthTitle: "McBuleli Youth",
    youthSubtitle: "10 scenarios to reflect - consent, cyber, corruption, friendship. No public ranking.",
    youthYourTurn: "What would you do?",
    youthPlaceholder: "Write your answer...",
    youthSend: "Send",
    youthSosHint: "Serious situation? Use the",
    youthBackToList: "<- All scenarios",
    youthDisclaimer: "Educational guide - not a lawyer or doctor. In real danger, use SOS NGEMBA.",
  },
  ln: {
    ...fr,
    tagline: "Bokebi - Kimia",
    sos: "SOS",
    sosHint: "Likama",
    witness: "Momonisi",
    discrete: "Mode ya kobomba",
    line: "Loba - McBuleli IA ayebi",
    powered: "McBuleli IA",
    aiListening: "McBuleli IA azali koyoka",
    polish: "Kobongisa",
    polishing: "Kobongisa...",
    language: "Monoko",
    back: "Zonga",
    tell: "Nini ezali kosalama?",
    witnessTell: "Nini omonaka?",
    witnessSafety: "Kobanga te. Tika kaka koyebisa.",
    placeholder: "Koma na maloba moke...",
    shareGps: "Kabola esika na ngai",
    skipGps: "Kende na yango te",
    send: "Tinda",
    sending: "Kotinda...",
    gpsAsk: "Esika ezali na ntina - ezali te na mobeko",
    alertOk: "Alerte eyambi",
    humanSoon: "Kobongisa ezali kosalema",
    urgency: "Likama",
    emergencyHint: "Soki likama ezali sikoyo - benga mpe ba secours ya mboka",
    home: "Ebandeli",
    errorGeneric: "Libunga - zongela lisusu",
    provincePick: "Pona province",
    usePlace: "Salela esika oyo",
    discreteSend: "Tinda na sekele",
    discreteSafety: "Soki moto azali kotala écran na yo, loba na maloba moke.",
    discreteTap: "Fina logo NGEMBA mbala misato mpo na kofungola mode ya kobomba.",
    resources: "Lisungi",
    prevent: "Kobatela",
    school: "Ekele",
    youth: "Bilenge",
    schoolTitle: "Safe School - koyebisa oyo ebombami",
    schoolSafety: "Nkombo na yo ebombami. Koyebisa oyo ekendaka na mokonzi ya ekele, esalaka te na ba dosye ya bakolo.",
    schoolConcernPick: "Lolenge ya likambo",
    schoolConcernHarassment: "Kokangisa",
    schoolConcernViolence: "Bobundisi",
    schoolConcernAbuse: "Kosala mabe / bizaleli ya mabe",
    schoolConcernCyber: "Kokangisa na internet",
    schoolConcernOther: "Mosusu",
    schoolEstablishmentPlaceholder: "Ex. Lycée X, commune Y",
    schoolTell: "Loba nini ezali kosalema",
    schoolAnonymousNote: "Kombo na yo mobimba ezali te na ntina.",
    youthTitle: "McBuleli Bilenge",
    youthSubtitle: "10 makambo mpo na kokanisa - consentement, cyber, corruption, amitié. Te na classement public.",
    youthYourTurn: "Yo, okosala nini ?",
    youthPlaceholder: "Koma eyano na yo...",
    youthSend: "Tinda",
    youthSosHint: "Likambo ya makasi ? Salela bouton",
    youthBackToList: "<- Makambo nyonso",
    youthDisclaimer: "Mokanda ya koyekola - ezali te avocat to monganga. Soki likama ya solo, salela SOS NGEMBA.",
    discreteShake: "Sukola telefoni mbala 5 mpo na mode ya kobomba.",
  },
  sw: {
    ...fr,
    tagline: "Usalama - Amani",
    sos: "SOS",
    sosHint: "Hatari",
    witness: "Shahidi",
    discrete: "Njia ya siri",
    line: "Loba - McBuleli IA eyoki",
    powered: "McBuleli IA",
    aiListening: "McBuleli IA ezali koyoka",
    polish: "Fafanua",
    polishing: "Inafafanua...",
    language: "Lugha",
    back: "Rudi",
    tell: "Nini ezali koleka?",
    witnessTell: "Omoni nini?",
    witnessSafety: "Kota na likama te. Lapola kaka.",
    placeholder: "Koma na maloba moke...",
    shareGps: "Shiriki eneo langu",
    skipGps: "Endelea bila",
    send: "Tuma",
    sending: "Inatumwa...",
    gpsAsk: "Esika esalisaka - ezali ya motindo te",
    alertOk: "Tahadhari imepokelewa",
    humanSoon: "Mwongozo unaendelea",
    urgency: "Dharura",
    emergencyHint: "Soki likama ya mbala moko - benga mpe basungi ya mboka",
    home: "Nyumbani",
    errorGeneric: "Kosa - jaribu tena",
    provincePick: "Chagua mkoa",
    usePlace: "Tumia mahali hapa",
    discreteSend: "Tuma kwa siri",
    discreteSafety: "Soki moto azali kotala ekrana na yo, koma na maloba moke.",
    discreteTap: "Gusa nembo ya NGEMBA mara tatu kufungua njia ya siri.",
    resources: "Msaada",
    prevent: "Zuia",
    school: "Shule",
    youth: "Vijana",
    schoolTitle: "Safe School - ripoti iliyolindwa",
    schoolSafety: "Kombo na yo ezali kobatama. Rapport oyo ekokende epai ya momonisi ya ekele, na esika ya kokabola na ba adultes.",
    schoolConcernPick: "Motindo ya likambo",
    schoolConcernHarassment: "Kofinga",
    schoolConcernViolence: "Mobulu",
    schoolConcernAbuse: "Kosalela mabe / bizaleli ya mabe",
    schoolConcernCyber: "Cyberkofinga",
    schoolConcernOther: "Mosusu",
    schoolEstablishmentPlaceholder: "Ex. Lycée X, commune Y",
    schoolTell: "Loba nini ezali koleka",
    schoolAnonymousNote: "Kozanga kopesa kombo na yo mobimba.",
    youthTitle: "McBuleli Vijana",
    youthSubtitle: "Makambo 10 ya kokanisa - koyokana, cyber, bokebi, bondeko. Te classement public.",
    youthYourTurn: "Yo, okosala nini?",
    youthPlaceholder: "Koma eyano na yo...",
    youthSend: "Tuma",
    youthSosHint: "Likambo ya makasi? Salela bouton",
    youthBackToList: "<- Makambo nyonso",
    youthDisclaimer: "Guide ya education - te avocat to monganga. Soki likama ya solo, salela SOS NGEMBA.",
    discreteShake: "Tingisha simu mara 5 kwa njia ya siri.",
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
    trustedContactsSubtitle: "1-3 bato pona kosalisa soki oza te. Ezali te alerte auto.",
    trustedContactLabel: "Bato",
    trustedContactName: "Nkombo to nkombo ya moke",
    trustedContactRelation: "Lien / relation",
    trustedContactPhone: "Telefone (+243...)",
    trustedContactEmail: "Email (soki ezali)",
    trustedContactAddress: "Adresse / quartier",
    trustedContactRemove: "Kanga",
    trustedContactAdd: "Kokota bato",
    trustedContactsSave: "Kokota",
    trustedContactsSkip: "Na nsima",
    trustedContactsError: "Kokota bato moko na nkombo mpe telefone to email.",
    trustedContactsLink: "Bato na ngai ba motema",
    school: "Ecole",
    youth: "Bana ba sika",
    schoolTitle: "Safe School - signalement ya kukanga",
    schoolSafety: "Identite na nge ibatelami. Signalement ikuya na referent ecole.",
    schoolConcernPick: "Mutindu wa dikama",
    schoolConcernHarassment: "Kukata",
    schoolConcernViolence: "Libanga",
    schoolConcernAbuse: "Abus",
    schoolConcernCyber: "Cyberharcelement",
    schoolConcernOther: "Kunyima",
    schoolEstablishmentPlaceholder: "Ex. Lycee X, commune Y",
    schoolTell: "Amba chinyi chidi",
    schoolAnonymousNote: "Kufunsha dijina dikulu kechi.",
    youthTitle: "McBuleli Jeunesse",
    youthSubtitle: "Ba situations 10 mpo na kukanisha. Classement kechi.",
    youthYourTurn: "Wewe, udi ukusala nki?",
    youthPlaceholder: "Soneka eyano...",
    youthSend: "Tuma",
    youthSosHint: "Dikama dikulu? Sadisha bouton",
    youthBackToList: "<- Ba scenarios nyonso",
    youthDisclaimer: "Guide ya boyekoli - avocat kechi. Mu dikama, sadisha SOS NGEMBA.",
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
    trustedContactsSubtitle: "1-3 bato pona kosalisa soki oza te. Ezali te alerte auto.",
    trustedContactLabel: "Bato",
    trustedContactName: "Nkombo to nkombo ya moke",
    trustedContactRelation: "Lien / relation",
    trustedContactPhone: "Telefone (+243...)",
    trustedContactEmail: "Email (soki ezali)",
    trustedContactAddress: "Adresse / quartier",
    trustedContactRemove: "Kanga",
    trustedContactAdd: "Kokota bato",
    trustedContactsSave: "Kokota",
    trustedContactsSkip: "Na nsima",
    trustedContactsError: "Kokota bato moko na nkombo mpe telefone to email.",
    trustedContactsLink: "Bato na ngai ba motema",
    school: "Ecole",
    youth: "Bantu ya sika",
    schoolTitle: "Safe School - signalement ya kukanga",
    schoolSafety: "Identite na nge me batama. Signalement ke kwenda na referent ecole.",
    schoolConcernPick: "Mutindu ya zingu",
    schoolConcernHarassment: "Kukata",
    schoolConcernViolence: "Libanga",
    schoolConcernAbuse: "Abus",
    schoolConcernCyber: "Cyberharcelement",
    schoolConcernOther: "Ya nkaka",
    schoolEstablishmentPlaceholder: "Ex. Lycee X, commune Y",
    schoolTell: "Vova inki ke salama",
    schoolAnonymousNote: "Ve mfunu ya kupesa nkombo ya nene.",
    youthTitle: "McBuleli Jeunesse",
    youthSubtitle: "Ba situations 10 mpo na kukanisa. Classement ve.",
    youthYourTurn: "Nge, nge ta sala nki?",
    youthPlaceholder: "Sonika eyano...",
    youthSend: "Tinda",
    youthSosHint: "Zingu ya nene? Sala bouton",
    youthBackToList: "<- Ba scenarios nyonso",
    youthDisclaimer: "Guide ya longuka - avocat ve. Na zingu, sala SOS NGEMBA.",
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
