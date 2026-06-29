/** AI Assistant UI strings - EN / FR / SW (Swahili). */
export type AssistantLocale = "en" | "fr" | "sw";

export type AssistantMessages = {
  name: string;
  tagline: string;
  welcome: string;
  welcomeSub: string;
  placeholder: string;
  send: string;
  thinking: string;
  openAssistant: string;
  closeAssistant: string;
  humanSupport: string;
  simplifiedMode: string;
  quickActions: string;
  suggestedForYou: string;
  directAccess: string;
  openInApp: string;
  languageSwitched: string;
  errorGeneric: string;
  rateLimited: string;
  errorDbNotReady: string;
  /** Quick action labels */
  qa_crypto: string;
  qa_usdt: string;
  qa_trading: string;
  qa_mobile: string;
  qa_bot: string;
  qa_p2p: string;
  qa_security: string;
  qa_avec: string;
  qa_staking: string;
  qa_kyc: string;
  qa_swap: string;
  qa_bp: string;
};

export const assistantEn: AssistantMessages = {
  name: "McBuleli AI",
  tagline: "Wallet · P2P · Trade · Academy",
  welcome: "Hello - I'm McBuleli AI",
  welcomeSub:
    "I know the full McBuleli app: wallet (USDT, Pi, CDF), P2P escrow, swap, bots, staking, AVEC, Community, Academy, and Buleli Points. What can I help you with?",
  placeholder: "Ask anything about McBuleli…",
  send: "Send",
  thinking: "Thinking…",
  openAssistant: "Open AI assistant",
  closeAssistant: "Close",
  humanSupport: "Talk to human support",
  simplifiedMode: "Simple mode",
  quickActions: "Quick topics",
  suggestedForYou: "Suggested for you",
  directAccess: "Open in McBuleli",
  openInApp: "Go to this screen",
  languageSwitched: "Next replies will be in English.",
  errorGeneric: "Something went wrong. Please try again.",
  rateLimited: "Too many messages. Please wait a moment.",
  errorDbNotReady:
    "Assistant is being set up. Please try again in a few minutes.",
  qa_crypto: "Learn Crypto",
  qa_usdt: "Buy/Sell USDT",
  qa_trading: "How Trading Works",
  qa_mobile: "Mobile Money",
  qa_bot: "AI Trading Bot",
  qa_p2p: "P2P Escrow",
  qa_security: "Account Security",
  qa_avec: "AVEC Savings",
  qa_staking: "Staking",
  qa_kyc: "KYC Guide",
  qa_swap: "Swap crypto",
  qa_bp: "Buleli Points",
};

export const assistantFr: AssistantMessages = {
  name: "McBuleli IA",
  tagline: "Wallet · P2P · Trade · Academy",
  welcome: "Bonjour - je suis McBuleli IA",
  welcomeSub:
    "Je connais toute l'app McBuleli : portefeuille (USDT, Pi, CDF), escrow P2P, swap, bots, staking, AVEC, Communauté, Academy et Buleli Points. Comment puis-je vous aider ?",
  placeholder: "Posez une question sur McBuleli…",
  send: "Envoyer",
  thinking: "Réflexion…",
  openAssistant: "Ouvrir l'assistant IA",
  closeAssistant: "Fermer",
  humanSupport: "Parler au support humain",
  simplifiedMode: "Mode simple",
  quickActions: "Sujets rapides",
  suggestedForYou: "Suggestions pour vous",
  directAccess: "Accès direct dans l'app",
  openInApp: "Ouvrir cette page",
  languageSwitched: "Les prochaines réponses seront en français.",
  errorGeneric: "Une erreur s'est produite. Réessayez.",
  rateLimited: "Trop de messages. Patientez un instant.",
  errorDbNotReady:
    "L'assistant est en cours de configuration. Réessayez dans quelques minutes.",
  qa_crypto: "Apprendre la crypto",
  qa_usdt: "Acheter/Vendre USDT",
  qa_trading: "Comment trader",
  qa_mobile: "Mobile money",
  qa_bot: "Bot de trading IA",
  qa_p2p: "Escrow P2P",
  qa_security: "Sécurité du compte",
  qa_avec: "Épargne AVEC",
  qa_staking: "Staking",
  qa_kyc: "Guide KYC",
  qa_swap: "Swap crypto",
  qa_bp: "Buleli Points",
};

export const assistantSw: AssistantMessages = {
  name: "McBuleli AI",
  tagline: "Pochi · P2P · Biashara · Academy",
  welcome: "Habari - mimi ni McBuleli AI",
  welcomeSub:
    "Najua app nzima ya McBuleli: pochi (USDT, Pi, CDF), escrow P2P, swap, boti, staking, AVEC, Jumuiya, Academy na Buleli Points. Naweza kukusaidia nini?",
  placeholder: "Uliza chochote kuhusu McBuleli…",
  send: "Tuma",
  thinking: "Inafikiri…",
  openAssistant: "Fungua msaidizi wa AI",
  closeAssistant: "Funga",
  humanSupport: "Zungumza na msaada wa binadamu",
  simplifiedMode: "Hali rahisi",
  quickActions: "Mada za haraka",
  suggestedForYou: "Mapendekezo kwako",
  directAccess: "Fungua kwenye McBuleli",
  openInApp: "Nenda kwenye ukurasa huu",
  languageSwitched: "Majibu yajayo yatakuwa kwa Kiswahili.",
  errorGeneric: "Kuna hitilafu. Jaribu tena.",
  rateLimited: "Ujumbe mwingi sana. Subiri kidogo.",
  errorDbNotReady:
    "Msaidizi unasanidiwa. Jaribu tena baada ya dakika chache.",
  qa_crypto: "Jifunze Crypto",
  qa_usdt: "Nunua/Uza USDT",
  qa_trading: "Biashara inavyofanya kazi",
  qa_mobile: "Pesa ya simu",
  qa_bot: "Boti ya AI",
  qa_p2p: "Escrow P2P",
  qa_security: "Usalama wa akaunti",
  qa_avec: "Akiba AVEC",
  qa_staking: "Staking",
  qa_kyc: "Mwongozo wa KYC",
  qa_swap: "Swap crypto",
  qa_bp: "Buleli Points",
};

export function getAssistantMessages(locale: AssistantLocale): AssistantMessages {
  if (locale === "fr") return assistantFr;
  if (locale === "sw") return assistantSw;
  return assistantEn;
}

export function resolveAssistantLocale(
  appLocale: string,
  preferred?: string | null,
): AssistantLocale {
  const p = preferred?.trim().toLowerCase();
  if (p === "fr" || p === "sw" || p === "en") return p;
  return appLocale === "fr" ? "fr" : "en";
}

export type QuickActionKey =
  | "crypto"
  | "usdt"
  | "trading"
  | "mobile"
  | "bot"
  | "p2p"
  | "security"
  | "avec"
  | "staking"
  | "kyc"
  | "swap"
  | "bp";

export const QUICK_ACTION_KEYS: QuickActionKey[] = [
  "crypto",
  "usdt",
  "p2p",
  "swap",
  "bot",
  "mobile",
  "trading",
  "security",
  "avec",
  "staking",
  "bp",
  "kyc",
];

export function quickActionLabel(
  locale: AssistantLocale,
  key: QuickActionKey,
): string {
  const m = getAssistantMessages(locale);
  const map: Record<QuickActionKey, string> = {
    crypto: m.qa_crypto,
    usdt: m.qa_usdt,
    trading: m.qa_trading,
    mobile: m.qa_mobile,
    bot: m.qa_bot,
    p2p: m.qa_p2p,
    security: m.qa_security,
    avec: m.qa_avec,
    staking: m.qa_staking,
    kyc: m.qa_kyc,
    swap: m.qa_swap,
    bp: m.qa_bp,
  };
  return map[key];
}

export function quickActionPrompt(
  locale: AssistantLocale,
  key: QuickActionKey,
): string {
  const prompts: Record<AssistantLocale, Record<QuickActionKey, string>> = {
    en: {
      crypto: "Explain crypto basics for a complete beginner in Africa.",
      usdt: "How do I buy and sell USDT on McBuleli?",
      trading: "How does trading work on McBuleli?",
      mobile: "How does mobile money work with McBuleli?",
      bot: "Tell me about the AI Trading Bot.",
      p2p: "How does P2P escrow protect my money?",
      security: "How do I secure my McBuleli account?",
      avec: "What is AVEC group savings on McBuleli?",
      staking: "How does staking work on McBuleli?",
      kyc: "Why is KYC important and how do I complete it?",
      swap: "How do I swap between USDT and Pi in the wallet?",
      bp: "What are Buleli Points and how do I earn McB?",
    },
    fr: {
      crypto: "Expliquez les bases de la crypto pour un débutant en Afrique.",
      usdt: "Comment acheter et vendre de l'USDT sur McBuleli ?",
      trading: "Comment fonctionne le trading sur McBuleli ?",
      mobile: "Comment fonctionne le mobile money avec McBuleli ?",
      bot: "Parlez-moi du bot de trading IA.",
      p2p: "Comment l'escrow P2P protège mon argent ?",
      security: "Comment sécuriser mon compte McBuleli ?",
      avec: "Qu'est-ce que l'épargne collective AVEC sur McBuleli ?",
      staking: "Comment fonctionne le staking sur McBuleli ?",
      kyc: "Pourquoi le KYC est important et comment le compléter ?",
      swap: "Comment échanger USDT et Pi dans le portefeuille ?",
      bp: "Que sont les Buleli Points et comment obtenir des McB ?",
    },
    sw: {
      crypto: "Eleza misingi ya crypto kwa mwanzo kabisa barani Afrika.",
      usdt: "Ninanunua na kuuza USDT kwenye McBuleli vipi?",
      trading: "Biashara inavyofanya kazi kwenye McBuleli vipi?",
      mobile: "Pesa ya simu inavyofanya kazi na McBuleli vipi?",
      bot: "Niambie kuhusu Boti ya Biashara ya AI.",
      p2p: "Escrow ya P2P inalinda pesa yangu vipi?",
      security: "Ninalinda akaunti yangu ya McBuleli vipi?",
      avec: "Akiba ya kikundi AVEC ni nini kwenye McBuleli?",
      staking: "Staking inavyofanya kazi kwenye McBuleli vipi?",
      kyc: "Kwa nini KYC ni muhimu na ninakamilisha vipi?",
      swap: "Ninabadilisha USDT na Pi kwenye pochi vipi?",
      bp: "Buleli Points ni nini na ninapata McB vipi?",
    },
  };
  return prompts[locale][key];
}
