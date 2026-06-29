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

/** Built-in knowledge - upserted to DB on assistant boot (slug + locale). */
export const ASSISTANT_KNOWLEDGE_SEED: KnowledgeSeed[] = [
  {
    slug: "what-is-mcbuleli",
    category: "platform",
    locale: "all",
    title: "What is McBuleli?",
    content:
      "McBuleli (mcbuleli.org) is an Africa-focused fintech super-app. Products live in one account: custodial wallet (USDT, Pi, USD, CDF), P2P marketplace with escrow, mobile money corridors, crypto swap, fiat deposit/withdraw (MoMo/card where enabled), AI trading bots (Spot DCA/Grid + Futures with AI assist), staking, AVEC group savings, Community Hub (feed, Q&A, signals), McBuleli Academy (live cohorts), and Buleli Points (BP) rewards convertible to McB utility token. Access via web/PWA on phone or desktop.",
    tags: ["platform", "overview", "africa", "super-app"],
    priority: 100,
  },
  {
    slug: "crypto-basics",
    category: "education",
    locale: "all",
    title: "Crypto basics for beginners",
    content:
      "Cryptocurrency is digital money on a blockchain. Your McBuleli wallet holds balances custodially - like a digital account you control with email + security keys. USDT is a stablecoin pegged near 1 USD. Pi is a mobile-mined coin supported on McBuleli. Never share password, seed phrase, or 2FA codes. Start small, use P2P escrow and Academy to learn before large amounts.",
    tags: ["crypto", "beginner", "wallet", "blockchain"],
    priority: 90,
  },
  {
    slug: "usdt-deposit",
    category: "wallet",
    locale: "all",
    title: "How to deposit USDT",
    content:
      "Wallet → Deposit → USDT (/app/wallet/deposit?asset=USDT). Step 1: pick network (TRC20, BEP20, or ERC20). Step 2: McBuleli shows a deposit address and exact amount to send. Send USDT on-chain, then paste your TXID to confirm. TRC20 is often cheapest. Wrong network = lost funds. Track status in Wallet → History.",
    tags: ["usdt", "deposit", "txid", "trc20", "bep20"],
    priority: 85,
  },
  {
    slug: "usdt-withdraw",
    category: "wallet",
    locale: "all",
    title: "How to withdraw USDT",
    content:
      "Wallet → Withdraw → USDT (/app/wallet/withdraw?asset=USDT). Enter destination address, network, and amount. Platform fee is about 2 USDT. Minimum net ~5 USDT external, ~1 USDT internal McBuleli transfer. Status flow: Queued → Processing → Completed or Rejected (balance refunded if rejected). Enable 2FA or passkey in Profile → Security before withdrawing.",
    tags: ["usdt", "withdraw", "fee", "minimum"],
    priority: 85,
  },
  {
    slug: "wallet-swap",
    category: "wallet",
    locale: "all",
    title: "Crypto swap in wallet",
    content:
      "Wallet → Swap (/app/wallet/swap) converts between supported assets (e.g. USDT ↔ Pi) inside McBuleli. Pick source and destination asset, enter amount, review rate and fees, then confirm. Swaps are instant on-platform - no on-chain TXID needed. Check balances and history in Wallet → History.",
    tags: ["swap", "exchange", "usdt", "pi", "wallet"],
    priority: 82,
  },
  {
    slug: "wallet-fiat-cdf",
    category: "wallet",
    locale: "all",
    title: "Fiat wallet (USD / CDF)",
    content:
      "McBuleli supports fiat balances USD and CDF in the wallet alongside crypto. Deposit: Wallet → Deposit → fiat → MoMo or card where enabled (/app/wallet/fiat/deposit). Withdraw: /app/wallet/fiat/withdraw. Use P2P to convert between fiat and USDT/Pi in supported corridors. Always verify provider, amount, and reference before confirming.",
    tags: ["fiat", "cdf", "usd", "mobile money", "momo"],
    priority: 78,
  },
  {
    slug: "p2p-escrow",
    category: "p2p",
    locale: "all",
    title: "P2P escrow protection",
    content:
      "McBuleli P2P (/app/p2p) matches buyers and sellers with escrow. On Buy tab you see sell-side ads; on Sell tab, buy-side ads. Seller crypto is locked until payment is confirmed. Rules panel explains: verify MoMo/bank balance (not screenshots), pay only inside active order, open dispute if release fails. Never trade outside McBuleli - no escrow protection off-platform.",
    tags: ["p2p", "escrow", "mobile money", "dispute", "buy", "sell"],
    priority: 80,
  },
  {
    slug: "p2p-safety-rules",
    category: "p2p",
    locale: "all",
    title: "P2P safety tips",
    content:
      "Stay safe on P2P: reject fake receipts - check your MoMo/bank app directly. Never pay after an order is cancelled. Beware triangle scams (one payment, multiple parties). No chargebacks on crypto - confirm funds received. McBuleli escrow is only inside active orders. Tap Rules on P2P hub for illustrated safety cards.",
    tags: ["p2p", "scam", "safety", "fake receipt", "fraud"],
    priority: 79,
  },
  {
    slug: "mobile-money",
    category: "fiat",
    locale: "all",
    title: "Mobile money on McBuleli",
    content:
      "McBuleli supports mobile money (M-Pesa, Orange Money, Airtel, MTN, Vodacom, etc.) in corridors like DRC. Primary path: P2P with escrow - pay the seller's MoMo number shown in the order. Fiat wallet deposit/withdraw uses local providers where enabled. Always verify recipient number, amount, and that the order is still active before sending.",
    tags: ["mobile money", "mpesa", "orange", "mtn", "rdc", "momo"],
    priority: 75,
  },
  {
    slug: "ai-trading-bot",
    category: "trading",
    locale: "all",
    title: "AI Trading Bots",
    content:
      "Trade → Bots (/app/trade/bots): automated strategies on your connected exchange API keys (encrypted). Plans include DCA Spot, Grid Spot, and Futures USD-M. Day and Swing presets set rhythm and risk. Futures bots can enable AI assist - external McBuleli AI worker sends market signals; TA smart gate still applies. Trading risks loss - start demo/small size. Guide: /app/trade/bots/guide.",
    tags: ["bot", "trading", "ai", "futures", "dca", "grid"],
    priority: 70,
  },
  {
    slug: "kyc-didit",
    category: "kyc",
    locale: "all",
    title: "KYC verification (Didit)",
    content:
      "KYC verifies identity via Didit in Profile → KYC (/app/profile/kyc). Needed for higher limits, McB claim, and some features. Have ID ready, good lighting, clear photos. Usually minutes to hours. If rejected, read the reason in-app and retry. Approved KYC grants Buleli Points (BP) reward once.",
    tags: ["kyc", "didit", "identity", "verification"],
    priority: 80,
  },
  {
    slug: "account-security",
    category: "security",
    locale: "all",
    title: "Account security",
    content:
      "Secure McBuleli in Profile → Security (/app/profile/security): strong unique password, 2FA (TOTP authenticator), passkey/WebAuthn if supported, WhatsApp recovery link. McBuleli never asks for full password, seed phrase, or 2FA codes via chat, email, or WhatsApp. Withdrawals and sensitive changes require security verification.",
    tags: ["security", "2fa", "passkey", "password", "whatsapp"],
    priority: 85,
  },
  {
    slug: "avec-savings",
    category: "avec",
    locale: "all",
    title: "AVEC group savings",
    content:
      "AVEC on McBuleli (/app/wallet/groups or /app/groups) is digital group savings - tontines with cycles, contributions, internal loans, treasury rules, and social fund. Admins configure governance; members track shares in-app. Good for community finance in Africa. Join via invite link or create a new group.",
    tags: ["avec", "tontine", "group", "savings", "community"],
    priority: 65,
  },
  {
    slug: "staking",
    category: "staking",
    locale: "all",
    title: "Staking on McBuleli",
    content:
      "Staking (/app/staking or Wallet → Staking) locks USDT or Pi for a fixed term to earn rewards. See APY, minimum, and lock duration before confirming. Staked funds are not instantly withdrawable until maturity. Opening staking can earn Buleli Points. Returns are not guaranteed - read terms in-app.",
    tags: ["staking", "yield", "rewards", "usdt", "pi"],
    priority: 65,
  },
  {
    slug: "pi-network",
    category: "wallet",
    locale: "all",
    title: "Pi Network on McBuleli",
    content:
      "Pi deposit: Wallet → Deposit → Pi (/app/wallet/deposit?asset=PI) - paste TXID after on-chain send. Pi withdraw: /app/wallet/withdraw?asset=PI. Manual review may apply; allow extra processing time. Pi Test sandbox exists for training (/app/wallet/pi-test) - not real funds.",
    tags: ["pi", "pi network", "deposit", "withdraw"],
    priority: 60,
  },
  {
    slug: "community-hub",
    category: "community",
    locale: "all",
    title: "McBuleli Community Hub",
    content:
      "Community (/app/community): social feed, blogs, Q&A, trading signals (educational, not financial advice), trader leaderboard, follows, and Buleli Points for useful posts. Signals and rankings are informational - do your own research. Daily BP earn caps apply to prevent farming.",
    tags: ["community", "feed", "blog", "signals", "buleli points"],
    priority: 68,
  },
  {
    slug: "academy-training",
    category: "academy",
    locale: "all",
    title: "McBuleli Academy",
    content:
      "Academy (/app/academy): structured training cohorts on crypto, trading, P2P, and AI. Live sessions, quizzes, syllabus per edition. Earn Buleli Points for enrollment, attendance, and quiz pass. Free registration also at mcbuleli.org/formation. Educational only - not personalized investment advice.",
    tags: ["academy", "formation", "training", "live", "quiz"],
    priority: 68,
  },
  {
    slug: "buleli-points-mcb",
    category: "rewards",
    locale: "all",
    title: "Buleli Points and McB token",
    content:
      "Buleli Points (BP) reward useful actions: email verify, KYC, P2P trades, staking, Academy, Community, first bot subscription, etc. Monthly earn cap ~4000 BP per user. Spend BP on boosts and perks in-app. Claim McB on-chain (BSC BEP-20) at 100 BP = 1 McB when enabled - requires approved KYC. View balance: Wallet → Points (/app/wallet/points). No price promises - utility token only.",
    tags: ["buleli points", "bp", "mcb", "rewards", "claim"],
    priority: 72,
  },
  {
    slug: "human-support",
    category: "support",
    locale: "all",
    title: "Human support escalation",
    content:
      "Escalate to humans for fraud, hacks, unresolved P2P disputes, balance errors, or KYC blocks: Support in app (/app/support) or hi@mcbuleli.org. Include account email, order/transaction ID, and screenshots. McBuleli IA cannot modify balances, approve KYC, or release escrow - only guide you through the app.",
    tags: ["support", "escalation", "human", "dispute"],
    priority: 95,
  },
];
