import type { AssistantLocale } from "@/lib/assistant/messages";
import { recommendServices } from "@/lib/assistant/intent";
import { cryptoDepositHref, cryptoWithdrawHref } from "@/lib/wallet-money-routes";

export type GuidanceAction = {
  label: string;
  href: string;
  reason: string;
};

type RouteDef = {
  href: string;
  keywords: string[];
  labels: Record<AssistantLocale, string>;
  reasons: Record<AssistantLocale, string>;
};

const ROUTES: RouteDef[] = [
  {
    href: "/app/profile/kyc",
    keywords: [
      "kyc",
      "didit",
      "identit",
      "identity",
      "vérification",
      "verification",
      "kitambulisho",
      "profil → kyc",
      "profile → kyc",
    ],
    labels: {
      en: "Complete KYC",
      fr: "Compléter le KYC",
      sw: "Kamilisha KYC",
    },
    reasons: {
      en: "Open identity verification in the app",
      fr: "Ouvrir la vérification d'identité dans l'app",
      sw: "Fungua uthibitisho wa utambulisho kwenye app",
    },
  },
  {
    href: cryptoDepositHref("USDT"),
    keywords: [
      "deposit",
      "dépôt",
      "amana",
      "txid",
      "déposer",
      "wallet → deposit",
      "portefeuille → dépôt",
    ],
    labels: {
      en: "Deposit USDT / Pi",
      fr: "Déposer USDT / Pi",
      sw: "Weka USDT / Pi",
    },
    reasons: {
      en: "Get your deposit address and instructions",
      fr: "Obtenir l'adresse et les instructions de dépôt",
      sw: "Pata anwani na maelekezo ya amana",
    },
  },
  {
    href: cryptoWithdrawHref("USDT"),
    keywords: [
      "withdraw",
      "retrait",
      "kutoa",
      "retirer",
      "wallet → withdraw",
    ],
    labels: {
      en: "Withdraw crypto",
      fr: "Retirer des crypto",
      sw: "Toa crypto",
    },
    reasons: {
      en: "Start a withdrawal from your wallet",
      fr: "Lancer un retrait depuis votre portefeuille",
      sw: "Anza kutoa kutoka pochi yako",
    },
  },
  {
    href: "/app/wallet",
    keywords: [
      "wallet",
      "portefeuille",
      "pochi",
      "balance",
      "solde",
      "historique",
      "history",
    ],
    labels: {
      en: "Open wallet",
      fr: "Ouvrir le portefeuille",
      sw: "Fungua pochi",
    },
    reasons: {
      en: "View balances and transaction history",
      fr: "Voir soldes et historique",
      sw: "Angalia salio na historia",
    },
  },
  {
    href: "/app/p2p",
    keywords: [
      "p2p",
      "escrow",
      "marketplace",
      "mobile money",
      "acheteur",
      "vendeur",
      "annonce",
    ],
    labels: {
      en: "P2P marketplace",
      fr: "Marketplace P2P",
      sw: "Soko la P2P",
    },
    reasons: {
      en: "Buy or sell with escrow protection",
      fr: "Acheter ou vendre avec escrow",
      sw: "Nunua au uza kwa escrow",
    },
  },
  {
    href: "/app/trade/bots",
    keywords: [
      "trading bot",
      "bot de trading",
      "boti",
      "futures",
      "options",
      "trade →",
    ],
    labels: {
      en: "AI trading bots",
      fr: "Bots de trading IA",
      sw: "Boti za biashara AI",
    },
    reasons: {
      en: "Configure automated trading",
      fr: "Configurer le trading automatisé",
      sw: "Sanidi biashara otomatiki",
    },
  },
  {
    href: "/app/staking",
    keywords: ["staking", "stake", "rendement", "yield", "apy"],
    labels: {
      en: "Staking",
      fr: "Staking",
      sw: "Staking",
    },
    reasons: {
      en: "Explore staking programs",
      fr: "Explorer les programmes de staking",
      sw: "Chunguza programu za staking",
    },
  },
  {
    href: "/app/community",
    keywords: [
      "community",
      "communauté",
      "feed",
      "blog",
      "question",
      "signal",
      "trader",
      "buleli points",
      "bp",
    ],
    labels: {
      en: "Community Hub",
      fr: "Hub Communauté",
      sw: "Jumuiya ya McBuleli",
    },
    reasons: {
      en: "Open feed, blogs, Q&A, signals, and trader rankings",
      fr: "Ouvrir fil, blogs, Q&R, signaux et classement traders",
      sw: "Fungua mipasho, blogu, maswali na ishara za biashara",
    },
  },
  {
    href: "/app/groups",
    keywords: ["avec", "tontine", "group savings", "épargne collective", "groups"],
    labels: {
      en: "AVEC / group savings",
      fr: "Épargne AVEC",
      sw: "Akiba ya kikundi AVEC",
    },
    reasons: {
      en: "Join or manage a savings group",
      fr: "Rejoindre ou gérer un groupe d'épargne",
      sw: "Jiunge au simamia kikundi cha akiba",
    },
  },
  {
    href: "/app/profile/security",
    keywords: [
      "2fa",
      "passkey",
      "password",
      "mot de passe",
      "sécurité",
      "security",
      "usalama",
      "authenticator",
    ],
    labels: {
      en: "Account security",
      fr: "Sécurité du compte",
      sw: "Usalama wa akaunti",
    },
    reasons: {
      en: "Enable 2FA, passkey, recovery",
      fr: "Activer 2FA, passkey, récupération",
      sw: "Washa 2FA, passkey, urejeshaji",
    },
  },
  {
    href: "/app/support",
    keywords: [
      "support",
      "human",
      "agent",
      "dispute",
      "litige",
      "fraude",
      "fraud",
      "hi@mcbuleli",
    ],
    labels: {
      en: "Human support",
      fr: "Support humain",
      sw: "Msaada wa binadamu",
    },
    reasons: {
      en: "Talk to the McBuleli support team",
      fr: "Contacter l'équipe support McBuleli",
      sw: "Wasiliana na timu ya msaada",
    },
  },
  {
    href: "/register",
    keywords: ["register", "inscription", "sign up", "créer un compte", "s'inscrire"],
    labels: {
      en: "Create account",
      fr: "Créer un compte",
      sw: "Fungua akaunti",
    },
    reasons: {
      en: "Register on McBuleli",
      fr: "S'inscrire sur McBuleli",
      sw: "Jisajili kwenye McBuleli",
    },
  },
  {
    href: "/login",
    keywords: ["login", "connexion", "sign in", "se connecter"],
    labels: {
      en: "Log in",
      fr: "Se connecter",
      sw: "Ingia",
    },
    reasons: {
      en: "Access your McBuleli account",
      fr: "Accéder à votre compte McBuleli",
      sw: "Fikia akaunti yako McBuleli",
    },
  },
];

function haystack(args: {
  userMessage: string;
  assistantReply: string;
}): string {
  return `${args.userMessage}\n${args.assistantReply}`.toLowerCase();
}

function matchRoutes(
  text: string,
  locale: AssistantLocale,
): GuidanceAction[] {
  const out: GuidanceAction[] = [];
  for (const route of ROUTES) {
    if (route.keywords.some((kw) => text.includes(kw.toLowerCase()))) {
      out.push({
        href: route.href,
        label: route.labels[locale],
        reason: route.reasons[locale],
      });
    }
  }
  return out;
}

/** Merge intent-based + content-based deep links (max 3, deduped). */
export function resolveGuidanceActions(args: {
  userMessage: string;
  assistantReply: string;
  locale: AssistantLocale;
  intents: string[];
}): GuidanceAction[] {
  const text = haystack(args);
  const fromContent = matchRoutes(text, args.locale);
  const fromIntents = recommendServices(args.intents, args.locale);

  const seen = new Set<string>();
  const merged: GuidanceAction[] = [];

  for (const item of [...fromContent, ...fromIntents]) {
    if (seen.has(item.href)) continue;
    seen.add(item.href);
    merged.push(item);
    if (merged.length >= 3) break;
  }

  return merged;
}
