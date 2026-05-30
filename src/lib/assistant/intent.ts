import type { AssistantLocale } from "@/lib/assistant/messages";

export type UserIntent =
  | "beginner"
  | "trader"
  | "investor"
  | "p2p"
  | "mobile_money"
  | "pi"
  | "visitor"
  | "security"
  | "kyc";

const INTENT_KEYWORDS: Record<UserIntent, string[]> = {
  beginner: [
    "beginner",
    "new",
    "start",
    "what is",
    "explain",
    "simple",
    "débutant",
    "commencer",
    "c'est quoi",
    "mwanzo",
    "eleza",
  ],
  trader: [
    "trade",
    "trading",
    "bot",
    "futures",
    "options",
    "chart",
    "signal",
    "bot",
    "biashara",
  ],
  investor: [
    "invest",
    "staking",
    "stake",
    "yield",
    "pool",
    "liquidity",
    "rendement",
    "placer",
  ],
  p2p: [
    "p2p",
    "escrow",
    "marketplace",
    "seller",
    "buyer",
    "annonce",
    "vendeur",
    "acheteur",
  ],
  mobile_money: [
    "mobile money",
    "mpesa",
    "m-pesa",
    "orange money",
    "airtel",
    "mtn",
    "vodacom",
    "pawapay",
    "simu",
  ],
  pi: ["pi network", "pi coin", "pi browser", "mining pi"],
  visitor: ["price", "fees", "how much", "frais", "combien"],
  security: [
    "password",
    "2fa",
    "passkey",
    "hack",
    "secure",
    "mot de passe",
    "sécurité",
    "usalama",
  ],
  kyc: [
    "kyc",
    "verify",
    "identity",
    "didit",
    "verification",
    "identité",
    "kitambulisho",
  ],
};

export function classifyUserIntent(text: string): UserIntent[] {
  const lower = text.toLowerCase();
  const scores = new Map<UserIntent, number>();
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS) as [
    UserIntent,
    string[],
  ][]) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) score += 1;
    }
    if (score > 0) scores.set(intent, score);
  }
  const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return ["visitor"];
  return sorted.slice(0, 3).map(([k]) => k);
}

export function mergeIntents(existing: string[], detected: UserIntent[]): string[] {
  const set = new Set([...existing, ...detected]);
  return [...set].slice(0, 8);
}

export function recommendServices(
  intents: string[],
  locale: AssistantLocale,
): { label: string; href: string; reason: string }[] {
  const recs: { label: string; href: string; reason: string; match: UserIntent }[] = [
    {
      match: "trader",
      label: locale === "fr" ? "Bot de trading IA" : "AI Trading Bot",
      href: "/app/trade/bots",
      reason:
        locale === "fr"
          ? "Vous semblez intéressé par le trading"
          : "You seem interested in trading",
    },
    {
      match: "p2p",
      label: locale === "fr" ? "Marketplace P2P" : "P2P Marketplace",
      href: "/app/p2p",
      reason:
        locale === "fr"
          ? "Idéal pour acheter/vendre avec mobile money"
          : "Great for buying/selling with mobile money",
    },
    {
      match: "investor",
      label: "Staking",
      href: "/app/staking",
      reason:
        locale === "fr"
          ? "Explorez le staking et les rendements"
          : "Explore staking and yields",
    },
    {
      match: "mobile_money",
      label: locale === "fr" ? "Portefeuille" : "Wallet",
      href: "/app/wallet",
      reason:
        locale === "fr"
          ? "Dépôts et retraits mobile money"
          : "Mobile money deposits & withdrawals",
    },
    {
      match: "beginner",
      label: locale === "fr" ? "Dépôt USDT" : "USDT Deposit",
      href: "/app/deposit",
      reason:
        locale === "fr"
          ? "Commencez par un dépôt guidé"
          : "Start with a guided deposit",
    },
    {
      match: "kyc",
      label: "KYC",
      href: "/app/profile/kyc",
      reason:
        locale === "fr"
          ? "Complétez votre vérification d'identité"
          : "Complete your identity verification",
    },
    {
      match: "security",
      label: locale === "fr" ? "Sécurité" : "Security",
      href: "/app/profile/security",
      reason:
        locale === "fr"
          ? "Renforcez la sécurité de votre compte"
          : "Strengthen your account security",
    },
    {
      match: "investor",
      label: "AVEC",
      href: "/app/groups",
      reason:
        locale === "fr"
          ? "Épargne collective avec votre communauté"
          : "Group savings with your community",
    },
  ];

  const out: { label: string; href: string; reason: string }[] = [];
  for (const r of recs) {
    if (intents.includes(r.match) && out.length < 3) {
      out.push({ label: r.label, href: r.href, reason: r.reason });
    }
  }
  return out;
}

export function shouldUseSimplifiedMode(
  messages: { role: string; content: string }[],
  intents: string[],
): boolean {
  if (intents.includes("beginner")) return true;
  const userMsgs = messages.filter((m) => m.role === "user");
  if (userMsgs.length <= 2) return false;
  const confusion = /don't understand|confused|pas compris|compliqu|too hard|difficile|sielewi|ngumu/i;
  const recent = userMsgs.slice(-3).some((m) => confusion.test(m.content));
  return recent;
}
