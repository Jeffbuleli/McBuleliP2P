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
  const L = {
    en: {
      bot: "AI Trading Bot",
      botR: "You seem interested in trading",
      p2p: "P2P Marketplace",
      p2pR: "Great for buying/selling with mobile money",
      stakeR: "Explore staking and yields",
      wallet: "Wallet",
      walletR: "Mobile money deposits & withdrawals",
      deposit: "USDT Deposit",
      depositR: "Start with a guided deposit",
      kycR: "Complete your identity verification",
      sec: "Security",
      secR: "Strengthen your account security",
      avecR: "Group savings with your community",
    },
    fr: {
      bot: "Bot de trading IA",
      botR: "Vous semblez intéressé par le trading",
      p2p: "Marketplace P2P",
      p2pR: "Idéal pour acheter/vendre avec mobile money",
      stakeR: "Explorez le staking et les rendements",
      wallet: "Portefeuille",
      walletR: "Dépôts et retraits mobile money",
      deposit: "Dépôt USDT",
      depositR: "Commencez par un dépôt guidé",
      kycR: "Complétez votre vérification d'identité",
      sec: "Sécurité",
      secR: "Renforcez la sécurité de votre compte",
      avecR: "Épargne collective avec votre communauté",
    },
    sw: {
      bot: "Boti ya biashara AI",
      botR: "Unaonekana una nia ya biashara",
      p2p: "Soko la P2P",
      p2pR: "Bora kwa kununua/kuuza kwa pesa ya simu",
      stakeR: "Chunguza staking na mapato",
      wallet: "Pochi",
      walletR: "Amana na kutoa kwa pesa ya simu",
      deposit: "Amana USDT",
      depositR: "Anza kwa amana ya mwongozo",
      kycR: "Kamilisha uthibitisho wa utambulisho",
      sec: "Usalama",
      secR: "Imarisha usalama wa akaunti yako",
      avecR: "Akiba ya kikundi na jamii yako",
    },
  }[locale === "fr" ? "fr" : locale === "sw" ? "sw" : "en"];

  const recs: { label: string; href: string; reason: string; match: UserIntent }[] = [
    {
      match: "trader",
      label: L.bot,
      href: "/app/trade/bots",
      reason: L.botR,
    },
    {
      match: "p2p",
      label: L.p2p,
      href: "/app/p2p",
      reason: L.p2pR,
    },
    {
      match: "investor",
      label: "Staking",
      href: "/app/staking",
      reason: L.stakeR,
    },
    {
      match: "mobile_money",
      label: L.wallet,
      href: "/app/wallet",
      reason: L.walletR,
    },
    {
      match: "beginner",
      label: L.deposit,
      href: "/app/deposit",
      reason: L.depositR,
    },
    {
      match: "kyc",
      label: "KYC",
      href: "/app/profile/kyc",
      reason: L.kycR,
    },
    {
      match: "security",
      label: L.sec,
      href: "/app/profile/security",
      reason: L.secR,
    },
    {
      match: "investor",
      label: "AVEC",
      href: "/app/groups",
      reason: L.avecR,
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
