/** Map URL pathname segments to contextual help hints for the AI. */
export function detectPageContext(pathname: string): string | null {
  const p = pathname.toLowerCase();
  if (p.includes("/deposit")) return "deposit";
  if (p.includes("/withdraw")) return "withdraw";
  if (p.includes("/wallet")) return "wallet";
  if (p.includes("/p2p")) return "p2p";
  if (p.includes("/trade/bots")) return "ai_bot";
  if (p.includes("/trade/futures")) return "futures";
  if (p.includes("/trade/options")) return "options";
  if (p.includes("/trade")) return "trading";
  if (p.includes("/groups") || p.includes("/avec")) return "avec";
  if (p.includes("/staking")) return "staking";
  if (p.includes("/profile/kyc")) return "kyc";
  if (p.includes("/profile/security")) return "security";
  if (p.includes("/community")) return "community";
  if (p.includes("/academy")) return "academy";
  if (p.includes("/support")) return "support";
  if (p.includes("/register")) return "register";
  if (p.includes("/login")) return "login";
  if (p === "/" || p.includes("/about")) return "landing";
  return null;
}

export function pageContextHint(
  ctx: string | null,
  locale: "en" | "fr" | "sw",
): string {
  if (!ctx) return "";
  const hints: Record<string, Record<"en" | "fr" | "sw", string>> = {
    deposit: {
      en: "User is on the USDT/Pi deposit page. Explain deposit steps, TXID confirmation, and network choice simply.",
      fr: "L'utilisateur est sur la page de dépôt. Expliquez les étapes, la confirmation TXID et le choix du réseau simplement.",
      sw: "Mtumiaji yuko kwenye ukurasa wa amana. Eleza hatua za amana, uthibitisho wa TXID na mtandao kwa urahisi.",
    },
    withdraw: {
      en: "User is on the withdrawal page. Explain net amount, fees (~2 USDT), minimums, and status tracking.",
      fr: "L'utilisateur est sur la page de retrait. Expliquez le net, les frais (~2 USDT), les minimums et le suivi.",
      sw: "Mtumiaji yuko kwenye ukurasa wa kutoa. Eleza kiasi halisi, ada (~2 USDT), kiwango cha chini na ufuatiliaji.",
    },
    wallet: {
      en: "User is viewing their crypto wallet. Help with balances, history, and next steps.",
      fr: "L'utilisateur consulte son portefeuille. Aidez avec soldes, historique et prochaines étapes.",
      sw: "Mtumiaji anaangalia pochi yake. Saidia kuhusu salio, historia na hatua zinazofuata.",
    },
    p2p: {
      en: "User is on P2P marketplace. Explain escrow, mobile money payment, and dispute safety.",
      fr: "L'utilisateur est sur le marketplace P2P. Expliquez l'escrow, le paiement mobile money et les litiges.",
      sw: "Mtumiaji yuko kwenye soko la P2P. Eleza escrow, malipo ya pesa ya simu na usalama wa migogoro.",
    },
    ai_bot: {
      en: "User is exploring AI Trading Bot. Explain setup, risks, and that crypto trading involves loss risk.",
      fr: "L'utilisateur explore le bot IA. Expliquez la configuration, les risques — le trading comporte des pertes possibles.",
      sw: "Mtumiaji anachunguza Boti ya AI. Eleza usanidi, hatari — biashara ya crypto ina hatari ya hasara.",
    },
    trading: {
      en: "User is in the trading section. Explain tools available and risk disclaimers.",
      fr: "L'utilisateur est dans la section trading. Expliquez les outils et les risques.",
      sw: "Mtumiaji yuko kwenye sehemu ya biashara. Eleza zana na onyo la hatari.",
    },
    avec: {
      en: "User is in AVEC/group savings. Explain tontines, group contributions, and community finance.",
      fr: "L'utilisateur est dans l'épargne AVEC. Expliquez tontines, cotisations et finance communautaire.",
      sw: "Mtumiaji yuko kwenye akiba ya kikundi AVEC. Eleza michango ya kikundi na fedha za jamii.",
    },
    staking: {
      en: "User is on staking. Explain how staking works, yields, and lock periods if any.",
      fr: "L'utilisateur est sur le staking. Expliquez le fonctionnement, les rendements et les durées de blocage.",
      sw: "Mtumiaji yuko kwenye staking. Eleza jinsi staking inavyofanya kazi na mapato.",
    },
    kyc: {
      en: "User is on KYC page. Explain why identity verification matters and Didit process.",
      fr: "L'utilisateur est sur la page KYC. Expliquez l'importance de la vérification d'identité et Didit.",
      sw: "Mtumiaji yuko kwenye ukurasa wa KYC. Eleza umuhimu wa uthibitisho wa utambulisho na Didit.",
    },
    security: {
      en: "User is on security settings. Guide on 2FA, passkeys, WhatsApp recovery.",
      fr: "L'utilisateur est dans les paramètres de sécurité. Guidez sur 2FA, passkeys, récupération WhatsApp.",
      sw: "Mtumiaji yuko kwenye mipangilio ya usalama. Eleza 2FA, passkeys, na urejeshaji wa WhatsApp.",
    },
    community: {
      en: "User is in McBuleli Community Hub. Explain feed, blogs, Q&A, trading signals (educational only), trader leaderboard, Buleli Points rewards — not financial advice.",
      fr: "L'utilisateur est dans le Hub Communauté McBuleli. Expliquez fil, blogs, Q&R, signaux (éducatifs), classement traders, Buleli Points — pas de conseil financier.",
      sw: "Mtumiaji yuko kwenye Jumuiya ya McBuleli. Eleza mipasho, blogu, maswali, ishara za biashara (elimu tu), na Buleli Points.",
    },
    academy: {
      en: "User is in McBuleli Academy (training cohort). Help with syllabus, live sessions, quiz, Buleli Points — not personalized investment advice.",
      fr: "L'utilisateur est dans McBuleli Academy (cohorte). Aidez sur le syllabus, les lives, le quiz, les Buleli Points — pas de conseil d'investissement personnalisé.",
      sw: "Mtumiaji yuko katika McBuleli Academy. Saidia kuhusu mada, vikao live, jaribio la maswali, Buleli Points.",
    },
    support: {
      en: "User is on human support chat. Offer to help but remind they can also talk to agents here.",
      fr: "L'utilisateur est sur le support humain. Proposez de l'aide et rappelez qu'un agent peut intervenir.",
      sw: "Mtumiaji yuko kwenye msaada wa binadamu. Saidia na ukumbushe kuwa mawakala wanapatikana.",
    },
    register: {
      en: "User is registering. Guide signup, email verification, and first steps.",
      fr: "L'utilisateur s'inscrit. Guidez l'inscription, la vérification e-mail et les premiers pas.",
      sw: "Mtumiaji anajisajili. Eleza usajili, uthibitisho wa barua pepe na hatua za kwanza.",
    },
    login: {
      en: "User is logging in. Help with login methods, password reset, WhatsApp recovery.",
      fr: "L'utilisateur se connecte. Aidez avec connexion, mot de passe oublié, récupération WhatsApp.",
      sw: "Mtumiaji anaingia. Saidia kuhusu njia za kuingia, nenosiri lililosahaulika, urejeshaji WhatsApp.",
    },
    landing: {
      en: "Visitor on marketing/home page. Welcome warmly and explain what McBuleli offers for African users.",
      fr: "Visiteur sur la page d'accueil. Accueillez chaleureusement et présentez McBuleli pour l'Afrique.",
      sw: "Mgeni kwenye ukurasa wa nyumbani. Karibisha na eleza McBuleli kwa watumiaji wa Afrika.",
    },
  };
  const row = hints[ctx];
  if (!row) return "";
  return row[locale] ?? row.en;
}
