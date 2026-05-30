import type { AssistantLocale } from "@/lib/assistant/messages";

export type KnowledgeSeed = {
  slug: string;
  category: string;
  locale: "all" | AssistantLocale;
  title: string;
  content: string;
  tags: string[];
  priority: number;
};

/** Built-in knowledge — synced to DB on first assistant boot. */
export const ASSISTANT_KNOWLEDGE_SEED: KnowledgeSeed[] = [
  {
    slug: "what-is-mcbuleli",
    category: "platform",
    locale: "all",
    title: "What is McBuleli?",
    content:
      "McBuleli (mcbuleli.org) is an Africa-focused fintech platform. It offers a crypto wallet (USDT, Pi), P2P marketplace with escrow, mobile money integration, AI trading bots, group savings (AVEC/tontines), staking, and financial education. Users access it via web/PWA on phone or desktop.",
    tags: ["platform", "overview", "africa"],
    priority: 100,
  },
  {
    slug: "crypto-basics",
    category: "education",
    locale: "all",
    title: "Crypto basics for beginners",
    content:
      "Cryptocurrency is digital money on a blockchain. A wallet stores your crypto — think of it like a digital bank account. USDT is a stablecoin pegged to ~1 USD, useful for saving value and transfers. Never share your password, seed phrase, or 2FA codes. Start small and learn before investing large amounts.",
    tags: ["crypto", "beginner", "wallet", "blockchain"],
    priority: 90,
  },
  {
    slug: "usdt-deposit",
    category: "wallet",
    locale: "all",
    title: "How to deposit USDT",
    content:
      "Go to Wallet → Deposit → choose USDT and network (TRC20, BEP20, or ERC20). McBuleli shows a deposit address and unique amount. Send USDT on-chain, then paste your TXID (transaction ID) to confirm. TRC20 is often cheapest for fees. Never send the wrong network — funds can be lost.",
    tags: ["usdt", "deposit", "txid", "trc20"],
    priority: 85,
  },
  {
    slug: "usdt-withdraw",
    category: "wallet",
    locale: "all",
    title: "How to withdraw USDT",
    content:
      "Go to Wallet → Withdraw. Enter destination address, network, and net amount. McBuleli charges a fixed platform fee (~2 USDT). Minimum net is ~5 USDT external, ~1 USDT for internal McBuleli transfers. Status: Queued → Processing → Completed or Rejected (balance refunded if rejected). Enable 2FA or passkey for withdrawals.",
    tags: ["usdt", "withdraw", "fee", "minimum"],
    priority: 85,
  },
  {
    slug: "p2p-escrow",
    category: "p2p",
    locale: "all",
    title: "P2P escrow protection",
    content:
      "McBuleli P2P locks the seller's crypto in escrow until the buyer confirms mobile money payment. Never release crypto before receiving payment. If there's a dispute, use the in-app dispute flow — do not trade outside the platform. Escrow protects both parties.",
    tags: ["p2p", "escrow", "mobile money", "dispute"],
    priority: 80,
  },
  {
    slug: "mobile-money",
    category: "fiat",
    locale: "all",
    title: "Mobile money on McBuleli",
    content:
      "McBuleli integrates mobile money (e.g. M-Pesa, Orange Money, Airtel, MTN) in supported corridors like DRC. Use P2P to buy/sell crypto against mobile money, or wallet fiat features where available. Always verify the recipient number and amount before confirming payment.",
    tags: ["mobile money", "mpesa", "orange", "mtn", "rdc"],
    priority: 75,
  },
  {
    slug: "ai-trading-bot",
    category: "trading",
    locale: "all",
    title: "AI Trading Bot",
    content:
      "McBuleli offers automated trading bots that connect to exchange APIs. Bots use technical indicators and optional AI signals. Trading involves risk — you can lose money. Start with demo/small amounts. Configure bots in Trade → Bots. Never share API keys with anyone except through McBuleli's secure setup.",
    tags: ["bot", "trading", "ai", "automation"],
    priority: 70,
  },
  {
    slug: "kyc-didit",
    category: "kyc",
    locale: "all",
    title: "KYC verification (Didit)",
    content:
      "KYC (Know Your Customer) verifies your identity. McBuleli uses Didit in Profile → KYC. Required for higher limits and some features. Have your ID document ready. Verification usually takes minutes to hours. If rejected, check the reason in-app and retry with clear photos.",
    tags: ["kyc", "didit", "identity", "verification"],
    priority: 80,
  },
  {
    slug: "account-security",
    category: "security",
    locale: "all",
    title: "Account security",
    content:
      "Secure your McBuleli account: use a strong unique password, enable 2FA (TOTP authenticator), add a passkey if your device supports it, and link WhatsApp for recovery in Profile → Security. McBuleli will never ask for your full password or seed phrase via chat or WhatsApp.",
    tags: ["security", "2fa", "passkey", "password"],
    priority: 85,
  },
  {
    slug: "avec-savings",
    category: "avec",
    locale: "all",
    title: "AVEC group savings",
    content:
      "AVEC (Association Villageoise d'Épargne et de Crédit) on McBuleli lets groups save together — like digital tontines. Members contribute on a schedule, can request internal loans, and track cycles. Great for community finance in Africa. Find it under Groups in the app.",
    tags: ["avec", "tontine", "group", "savings", "community"],
    priority: 65,
  },
  {
    slug: "staking",
    category: "staking",
    locale: "all",
    title: "Staking on McBuleli",
    content:
      "Staking lets you earn rewards by locking crypto for a period. McBuleli offers staking programs — check Staking in the app for current APY, minimums, and lock duration. Understand that staked funds may not be instantly withdrawable. Returns are not guaranteed.",
    tags: ["staking", "yield", "rewards", "invest"],
    priority: 65,
  },
  {
    slug: "pi-network",
    category: "wallet",
    locale: "all",
    title: "Pi Network on McBuleli",
    content:
      "McBuleli supports Pi deposits and withdrawals (manual verification). Pi is a mobile-mined cryptocurrency. Deposits require TXID confirmation like USDT. Check wallet minimums and fees in-app. Pi operations may take longer due to manual review.",
    tags: ["pi", "pi network", "deposit"],
    priority: 60,
  },
  {
    slug: "human-support",
    category: "support",
    locale: "all",
    title: "Human support escalation",
    content:
      "For fraud, account hacks, P2P disputes unresolved after guidance, balance errors, or KYC blocks: escalate to human support via Support in the app (/app/support) or contact hi@mcbuleli.org. Provide account email (masked), transaction ID, and screenshots. McBuleli AI cannot modify balances or approve transactions.",
    tags: ["support", "escalation", "human", "dispute"],
    priority: 95,
  },
];
