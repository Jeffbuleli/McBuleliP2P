/** RAG syllabus for Academy tutor - category `academy`. */
export const ACADEMY_KNOWLEDGE_SEED = [
  {
    slug: "academy-mcbuleli-overview",
    category: "academy",
    locale: "all" as const,
    title: "McBuleli platform overview",
    content:
      "McBuleli is a fintech for users in Africa (especially DRC). Core features: USDT/PI wallet, P2P marketplace with internal escrow, AI trading bots, staking, group savings (AVEC), Buleli Points (utility rewards, not cash), and McBuleli Academy for training on crypto, trading, AI tools, and P2P.",
    tags: ["edition:juin-2026", "launch"],
    priority: 10,
  },
  {
    slug: "academy-crypto-wallet-basics",
    category: "academy",
    locale: "all" as const,
    title: "Crypto & wallet basics",
    content:
      "USDT is a stablecoin pegged to USD used inside McBuleli for P2P, deposits, withdrawals, and paid courses. Users deposit via on-chain transfer with TXID confirmation. Never share seed phrases. KYC unlocks higher limits and future on-chain McB claims.",
    tags: ["edition:juin-2026", "crypto", "session:1"],
    priority: 9,
  },
  {
    slug: "academy-p2p-escrow",
    category: "academy",
    locale: "all" as const,
    title: "P2P & escrow",
    content:
      "McBuleli P2P locks seller crypto in escrow until the buyer pays via agreed mobile money or bank methods. Disputes can be opened if payment issues occur. Fees may apply; Buleli Points can discount P2P fees.",
    tags: ["edition:juin-2026", "p2p", "session:3"],
    priority: 9,
  },
  {
    slug: "academy-trading-ai-bots",
    category: "academy",
    locale: "all" as const,
    title: "Trading & AI bots",
    content:
      "Trading involves risk of loss. McBuleli offers demo and live futures bots with optional AI assist signals. Bots require a subscription paid in USDT from wallet balance. AI suggestions are educational, not guaranteed profit.",
    tags: ["edition:juin-2026", "trading", "ia", "session:2"],
    priority: 8,
  },
  {
    slug: "academy-buleli-points",
    category: "academy",
    locale: "all" as const,
    title: "Buleli Points & Academy rewards",
    content:
      "Buleli Points (BP) reward verified email, KYC, staking, P2P trades, and Academy actions: enrolling in a cohort, attending live sessions, passing quizzes. BP are utility credits for perks (fee discounts), not securities or promised token value.",
    tags: ["edition:juin-2026", "rewards"],
    priority: 8,
  },
  {
    slug: "academy-live-sessions-fr",
    category: "academy",
    locale: "fr" as const,
    title: "Sessions live juin 2026",
    content:
      "Cohorte juin 2026 : soirée de lancement 8 juin 19h GMT+1, puis samedis 15, 22 et 29 juin 18h30–20h00. Marquez votre présence dans l'app pendant la fenêtre live. Quiz fondamentaux disponible après inscription.",
    tags: ["edition:juin-2026", "schedule"],
    priority: 10,
  },
  {
    slug: "academy-live-sessions-en",
    category: "academy",
    locale: "en" as const,
    title: "June 2026 live sessions",
    content:
      "June 2026 cohort: launch evening 8 June 7 PM GMT+1, then Saturdays 15, 22, 29 June 6:30–8 PM. Check in from the app during the live window. Fundamentals quiz available after enrollment.",
    tags: ["edition:juin-2026", "schedule"],
    priority: 10,
  },
] as const;
