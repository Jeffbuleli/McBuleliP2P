export type Locale = "fr" | "en";

export const localeLabels: Record<Locale, string> = {
  fr: "FR",
  en: "EN",
};

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
  },
};

export function urgencyLabel(locale: Locale, urgency: string): string {
  const map: Record<string, { fr: string; en: string }> = {
    critical: { fr: "Critique", en: "Critical" },
    high: { fr: "Elevee", en: "High" },
    medium: { fr: "Moyenne", en: "Medium" },
    low: { fr: "Faible", en: "Low" },
    info: { fr: "Info", en: "Info" },
  };
  const row = map[urgency] ?? { fr: urgency, en: urgency };
  return locale === "en" ? row.en : row.fr;
}
