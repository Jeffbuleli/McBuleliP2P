import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  date,
  numeric,
  integer,
  jsonb,
  uniqueIndex,
  index,
  boolean,
  bigint,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  /** Lowercase + provider rules (Gmail dots) — unique; blocks typo duplicates at signup. */
  emailCanonical: varchar("email_canonical", { length: 255 }),
  passwordHash: text("password_hash").notNull(),
  /** user | agent | super_admin */
  role: varchar("role", { length: 32 }).notNull().default("user"),
  /** Public display name for P2P (optional). */
  displayName: varchar("display_name", { length: 64 }),
  /** Public avatar URL (optional). */
  avatarUrl: text("avatar_url"),
  /** ISO 3166-1 alpha-2 (e.g. CD) or OTHER. */
  countryCode: varchar("country_code", { length: 8 }),
  /** none | pending | approved | rejected | manual_review */
  kycStatus: varchar("kyc_status", { length: 16 }).notNull().default("none"),
  kycUpdatedAt: timestamp("kyc_updated_at", { withTimezone: true }),
  kycRejectionNote: text("kyc_rejection_note"),
  /** Didit verification session UUID — https://docs.didit.me/ */
  diditSessionId: varchar("didit_session_id", { length: 128 }),
  /** Didit session status (Not Started, In Progress, Approved, …). */
  diditSessionStatus: varchar("didit_session_status", { length: 32 }),
  /** Legal identity from Didit OCR (≠ displayName pseudo). */
  legalFirstName: varchar("legal_first_name", { length: 128 }),
  legalLastName: varchar("legal_last_name", { length: 128 }),
  birthDate: date("birth_date"),
  documentNumber: varchar("document_number", { length: 64 }),
  documentType: varchar("document_type", { length: 32 }),
  documentCountry: varchar("document_country", { length: 8 }),
  balance: numeric("balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /** Pi Network balance (manual OKX-backed deposit/withdraw). */
  piBalance: numeric("pi_balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /**
   * Pi Test sandbox (super-admin training only). Per-user — not on-chain Pi.
   * Legacy global `platform_settings.pi_test_balance` is no longer used for wallet UI.
   */
  piTestBalance: numeric("pi_test_balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /** Pi Platform app-scoped uid (set on Pi login; required for A2U payouts). */
  piUid: varchar("pi_uid", { length: 128 }),
  /** Pi username (best-effort display; set on Pi login). */
  piUsername: varchar("pi_username", { length: 64 }),
  /** Fiat pocket — USD (mobile money, internal). */
  usdBalance: numeric("usd_balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /** Fiat pocket — CDF (mobile money, internal). */
  cdfBalance: numeric("cdf_balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /** Virtual USDT for futures/options practice — not withdrawable. */
  tradeDemoUsdtBalance: numeric("trade_demo_usdt_balance", {
    precision: 36,
    scale: 18,
  })
    .notNull()
    .default("10000"),
  /** When false, API rejects live (real wallet) futures/options orders until user opts in. */
  tradeLiveEnabled: boolean("trade_live_enabled").notNull().default(true),
  /** Unique share code for referral links (nullable until backfilled). */
  referralCode: varchar("referral_code", { length: 16 }),
  referredByUserId: uuid("referred_by_user_id"),
  /** USDT earned via referral program (transfer to main wallet — future). */
  referralUsdtBalance: numeric("referral_usdt_balance", {
    precision: 36,
    scale: 18,
  })
    .notNull()
    .default("0"),
  /** Buleli Points (BP) — off-chain utility rewards; future McB claim. */
  buleliPointsBalance: integer("buleli_points_balance").notNull().default(0),
  /**
   * Agent-only allowlist of admin modules. `null` = all modules (legacy).
   * Cleared when role is not `agent`.
   */
  staffScopes: jsonb("staff_scopes").$type<string[] | null>(),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  pendingEmail: varchar("pending_email", { length: 255 }),
  sessionVersion: integer("session_version").notNull().default(0),
  totpSecretEnc: text("totp_secret_enc"),
  totpEnabledAt: timestamp("totp_enabled_at", { withTimezone: true }),
  recoveryWaChatId: varchar("recovery_wa_chat_id", { length: 64 }),
  recoveryWaPhone: varchar("recovery_wa_phone", { length: 32 }),
  waVerifiedAt: timestamp("wa_verified_at", { withTimezone: true }),
  /** Reference selfie URL from KYC for Didit biometric re-auth. */
  kycPortraitUrl: text("kyc_portrait_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
}, (table) => [
  uniqueIndex("users_email_canonical_unique")
    .on(table.emailCanonical)
    .where(sql`${table.emailCanonical} is not null`),
]);

/** One row per referee when the first qualifying deposit triggers a referrer reward. */
export const referralFirstRewards = pgTable(
  "referral_first_rewards",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    refereeUserId: uuid("referee_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" })
      .unique(),
    referrerUserId: uuid("referrer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    platformFeeUsd: numeric("platform_fee_usd", { precision: 18, scale: 8 })
      .notNull(),
    rewardUsdt: numeric("reward_usdt", { precision: 18, scale: 8 }).notNull(),
    source: varchar("source", { length: 32 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("referral_first_rewards_referrer_idx").on(t.referrerUserId),
  ],
);

export const deposits = pgTable(
  "deposits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 16 }).notNull(),
    asset: varchar("asset", { length: 32 }).notNull(),
    networkCanonical: varchar("network_canonical", { length: 32 }).notNull(),
    networkCex: varchar("network_cex", { length: 64 }).notNull(),
    addressShown: text("address_shown").notNull(),
    memoShown: text("memo_shown"),
    minConfirmations: integer("min_confirmations").notNull().default(1),
    status: varchar("status", { length: 32 }).notNull(),
    failureReason: text("failure_reason"),
    txid: varchar("txid", { length: 512 }),
    amount: numeric("amount", { precision: 36, scale: 18 }),
    /** Gross USDT the user plans to send (wizard). Distinct from `amount` (confirmed on-chain). */
    declaredAmountUsdt: numeric("declared_amount_usdt", { precision: 36, scale: 18 }),
    /** Optional user note; on-chain destination tag from the exchange remains `memoShown`. */
    userNote: text("user_note"),
    userMarkedSentAt: timestamp("user_marked_sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  },
  (t) => [
    index("deposits_user_idx").on(t.userId),
    uniqueIndex("deposits_txid_unique")
      .on(t.txid)
      .where(sql`${t.txid} IS NOT NULL`),
  ],
);

/** Append-only ledger lines for swaps, transfers, fiat flows (custodial). */
export const walletLedgerEntries = pgTable(
  "wallet_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryType: varchar("entry_type", { length: 32 }).notNull(),
    asset: varchar("asset", { length: 16 }).notNull(),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    feeUsdEquivalent: numeric("fee_usd_equivalent", {
      precision: 18,
      scale: 8,
    })
      .notNull()
      .default("0"),
    counterpartyUserId: uuid("counterparty_user_id").references(
      () => users.id,
      { onDelete: "set null" },
    ),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("wallet_ledger_user_idx").on(t.userId),
    index("wallet_ledger_batch_idx").on(t.batchId),
    index("wallet_ledger_created_idx").on(t.createdAt),
  ],
);

/** Small key/value store for platform-wide settings (super-admin managed). */
export const platformSettings = pgTable(
  "platform_settings",
  {
    key: varchar("key", { length: 64 }).primaryKey(),
    value: text("value").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

/** Training-only ledger for Pi Test balance adjustments (super-admin). */
export const piTestLedgerEntries = pgTable(
  "pi_test_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** deposit | withdraw */
    kind: varchar("kind", { length: 16 }).notNull(),
    /** Positive number as string */
    amount: varchar("amount", { length: 64 }).notNull(),
    memo: text("memo"),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    /** User whose Pi Test balance changed (null on legacy rows). */
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("pi_test_ledger_created_idx").on(t.createdAt),
    index("pi_test_ledger_user_idx").on(t.userId),
  ],
);

/** Fixed-term custodial staking — APR fixed at subscription; principal locked until maturity. */
/** P2P marketplace — fiat ↔ crypto via escrowed crypto on-platform. */
export const p2pAds = pgTable(
  "p2p_ads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** sell = maker sells crypto for fiat; buy = maker buys crypto with fiat */
    side: varchar("side", { length: 8 }).notNull(),
    asset: varchar("asset", { length: 8 }).notNull(),
    fiatCurrency: varchar("fiat_currency", { length: 8 }).notNull(),
    price: numeric("price", { precision: 36, scale: 18 }).notNull(),
    minFiat: numeric("min_fiat", { precision: 36, scale: 18 }).notNull(),
    maxFiat: numeric("max_fiat", { precision: 36, scale: 18 }).notNull(),
    /** Legacy free-text (kept for existing rows). */
    paymentMethods: text("payment_methods").notNull(),
    /** New: stable method codes for filtering + snapshotting. */
    paymentMethodCodes: jsonb("payment_method_codes").$type<string[] | null>(),
    terms: text("terms"),
    countryCode: varchar("country_code", { length: 8 }),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    /** Optional paid boost: ad ranks higher while boostedUntil > now(). */
    boostedUntil: timestamp("boosted_until", { withTimezone: true }),
    /** Optional paid boost amount (Pi). Used for within-boost ranking tiers. */
    boostAmountPi: numeric("boost_amount_pi", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    reserveTotalCrypto: numeric("reserve_total_crypto", { precision: 36, scale: 18 }),
    reserveRemainingCrypto: numeric("reserve_remaining_crypto", { precision: 36, scale: 18 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("p2p_ads_market_idx").on(t.status, t.asset, t.fiatCurrency),
    index("p2p_ads_user_idx").on(t.userId),
  ],
);

export const p2pPaymentMethodDefs = pgTable(
  "p2p_payment_method_defs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    countryCode: varchar("country_code", { length: 8 }).notNull(),
    code: varchar("code", { length: 32 }).notNull(),
    label: varchar("label", { length: 64 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("p2p_payment_method_defs_cc_code_uq").on(t.countryCode, t.code),
    index("p2p_payment_method_defs_cc_idx").on(t.countryCode, t.active, t.sortOrder),
  ],
);

export const userP2pPaymentMethods = pgTable(
  "user_p2p_payment_methods",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    countryCode: varchar("country_code", { length: 8 }).notNull(),
    methodCode: varchar("method_code", { length: 32 }).notNull(),
    accountName: varchar("account_name", { length: 96 }).notNull(),
    accountNumberOrPhone: varchar("account_number_or_phone", { length: 64 }).notNull(),
    extra: jsonb("extra").$type<Record<string, unknown> | null>(),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("user_p2p_payment_methods_user_idx").on(t.userId),
    index("user_p2p_payment_methods_cc_idx").on(t.countryCode, t.methodCode, t.active),
  ],
);

/** Pi Platform payments (U2A via SDK + A2U via Platform API). */
export const piPlatformPayments = pgTable(
  "pi_platform_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** U2A = user-to-app (SDK). A2U = app-to-user (Platform API). */
    kind: varchar("kind", { length: 8 }).notNull(),
    /** Platform payment identifier (paymentId from SDK / API). */
    paymentId: varchar("payment_id", { length: 128 }).notNull(),
    /** Pi amount (string decimal) for display/audit. */
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    memo: text("memo").notNull(),
    /** App-specific linking for fulfillment (e.g. p2p_ad_boost). */
    action: varchar("action", { length: 32 }).notNull(),
    /** Optional reference id for the action (e.g. adId). */
    actionRefId: uuid("action_ref_id"),
    /** Lifecycle: INITIATED -> APPROVED -> COMPLETED | FAILED | CANCELLED. */
    status: varchar("status", { length: 16 }).notNull().default("INITIATED"),
    txid: varchar("txid", { length: 255 }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    fulfilledAt: timestamp("fulfilled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("pi_platform_payments_payment_id_uq").on(t.paymentId),
    index("pi_platform_payments_user_idx").on(t.userId),
    index("pi_platform_payments_action_idx").on(t.action, t.actionRefId),
    index("pi_platform_payments_status_idx").on(t.status),
  ],
);

export const p2pOrders = pgTable(
  "p2p_orders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adId: uuid("ad_id")
      .notNull()
      .references(() => p2pAds.id),
    makerId: uuid("maker_id")
      .notNull()
      .references(() => users.id),
    takerId: uuid("taker_id")
      .notNull()
      .references(() => users.id),
    asset: varchar("asset", { length: 8 }).notNull(),
    fiatCurrency: varchar("fiat_currency", { length: 8 }).notNull(),
    price: numeric("price", { precision: 36, scale: 18 }).notNull(),
    fiatAmount: numeric("fiat_amount", { precision: 36, scale: 18 }).notNull(),
    cryptoAmount: numeric("crypto_amount", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 24 }).notNull().default("awaiting_payment"),
    sellerUserId: uuid("seller_user_id")
      .notNull()
      .references(() => users.id),
    buyerUserId: uuid("buyer_user_id")
      .notNull()
      .references(() => users.id),
    payerUserId: uuid("payer_user_id")
      .notNull()
      .references(() => users.id),
    paymentSnapshot: text("payment_snapshot").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    paidMarkedAt: timestamp("paid_marked_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    paymentReference: text("payment_reference"),
    paymentProofNote: text("payment_proof_note"),
    disputeReason: text("dispute_reason"),
    disputedAt: timestamp("disputed_at", { withTimezone: true }),
    platformFeeCrypto: numeric("platform_fee_crypto", { precision: 36, scale: 18 }),
    buyerReceivedCrypto: numeric("buyer_received_crypto", {
      precision: 36,
      scale: 18,
    }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("p2p_orders_maker_idx").on(t.makerId),
    index("p2p_orders_taker_idx").on(t.takerId),
    index("p2p_orders_status_expires_idx").on(t.status, t.expiresAt),
  ],
);

export const p2pOrderMessages = pgTable(
  "p2p_order_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => p2pOrders.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("p2p_order_messages_order_idx").on(t.orderId)],
);

export const p2pOrderPaymentProofs = pgTable(
  "p2p_order_payment_proofs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => p2pOrders.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /**
     * Small image only (data URL). Keep size small to avoid storage costs.
     * Expected: data:image/jpeg;base64,... or data:image/webp;base64,...
     */
    dataUrl: text("data_url").notNull(),
    mime: varchar("mime", { length: 64 }).notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("p2p_order_proofs_order_uq").on(t.orderId),
    index("p2p_order_proofs_order_idx").on(t.orderId),
    index("p2p_order_proofs_created_idx").on(t.createdAt),
  ],
);

export const p2pOrderRatings = pgTable(
  "p2p_order_ratings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => p2pOrders.id, { onDelete: "cascade" }),
    fromUserId: uuid("from_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("p2p_order_ratings_order_from_uidx").on(t.orderId, t.fromUserId),
    index("p2p_order_ratings_to_user_idx").on(t.toUserId),
  ],
);

export const userStakes = pgTable(
  "user_stakes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    asset: varchar("asset", { length: 8 }).notNull(),
    principal: numeric("principal", { precision: 36, scale: 18 }).notNull(),
    aprAnnual: numeric("apr_annual", { precision: 12, scale: 6 }).notNull(),
    termDays: integer("term_days").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 24 }).notNull().default("active"),
    interestPaid: numeric("interest_paid", { precision: 36, scale: 18 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("user_stakes_user_idx").on(t.userId),
    index("user_stakes_status_ends_idx").on(t.status, t.endsAt),
  ],
);

/** LP Pool — funds locked to back internal liquidity (USDT). */
export const lpPoolPositions = pgTable(
  "lp_pool_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    asset: varchar("asset", { length: 8 }).notNull().default("USDT"),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    lockMonths: integer("lock_months").notNull(),
    sizeTier: varchar("size_tier", { length: 8 }).notNull(),
    lockTier: varchar("lock_tier", { length: 8 }).notNull(),
    sizeMultiplier: numeric("size_multiplier", { precision: 12, scale: 6 }).notNull(),
    lockMultiplier: numeric("lock_multiplier", { precision: 12, scale: 6 }).notNull(),
    shares: numeric("shares", { precision: 36, scale: 18 }).notNull(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    payoutAnchorAt: timestamp("payout_anchor_at", { withTimezone: true }),
    nextPayoutAt: timestamp("next_payout_at", { withTimezone: true }),
    lastPayoutAt: timestamp("last_payout_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("lp_pool_positions_user_idx").on(t.userId),
    index("lp_pool_positions_status_ends_idx").on(t.status, t.endsAt),
    index("lp_pool_positions_next_payout_idx").on(t.nextPayoutAt),
  ],
);

/** One row per 24h window distribution (01:00 GMT → 01:00 GMT). */
export const lpPoolDailyDistributions = pgTable(
  "lp_pool_daily_distributions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dayStartAt: timestamp("day_start_at", { withTimezone: true }).notNull().unique(),
    dayEndAt: timestamp("day_end_at", { withTimezone: true }).notNull(),
    distributionRate: numeric("distribution_rate", { precision: 12, scale: 6 }).notNull(),
    revenueNetUsdt: numeric("revenue_net_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    rewardPoolUsdt: numeric("reward_pool_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    totalShares: numeric("total_shares", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("lp_pool_daily_distributions_day_idx").on(t.dayStartAt)],
);

/** Append-only rewards ledger: daily accruals + payouts (windowed). */
export const lpPoolRewardEntries = pgTable(
  "lp_pool_reward_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    positionId: uuid("position_id").references(() => lpPoolPositions.id, {
      onDelete: "set null",
    }),
    /** accrual | payout */
    kind: varchar("kind", { length: 16 }).notNull(),
    dayStartAt: timestamp("day_start_at", { withTimezone: true }),
    amountUsdt: numeric("amount_usdt", { precision: 36, scale: 18 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("lp_pool_reward_entries_user_idx").on(t.userId, t.createdAt),
    uniqueIndex("lp_pool_reward_entries_accrual_uidx")
      .on(t.dayStartAt, t.positionId)
      .where(sql`${t.kind} = 'accrual' AND ${t.dayStartAt} IS NOT NULL AND ${t.positionId} IS NOT NULL`),
  ],
);

/** Cached balances for UI (updated by jobs and payouts). */
export const lpPoolRewardBalances = pgTable("lp_pool_reward_balances", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  availableUsdt: numeric("available_usdt", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  totalEarnedUsdt: numeric("total_earned_usdt", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

/** Cached balances for each pool position (available for payout windows). */
export const lpPoolPositionRewardBalances = pgTable(
  "lp_pool_position_reward_balances",
  {
    positionId: uuid("position_id")
      .primaryKey()
      .references(() => lpPoolPositions.id, { onDelete: "cascade" }),
    availableUsdt: numeric("available_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    totalEarnedUsdt: numeric("total_earned_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
);

/** Loans (USDT) — secured by LP pool principal (v1). */
export const loans = pgTable(
  "loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    asset: varchar("asset", { length: 8 }).notNull().default("USDT"),
    principalUsdt: numeric("principal_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    outstandingUsdt: numeric("outstanding_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    /** open | repaid | defaulted */
    status: varchar("status", { length: 16 }).notNull().default("open"),
    aprAnnual: numeric("apr_annual", { precision: 12, scale: 6 })
      .notNull()
      .default("0"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("loans_user_status_idx").on(t.userId, t.status)],
);

export const loanCollaterals = pgTable(
  "loan_collaterals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    collateralType: varchar("collateral_type", { length: 24 }).notNull(),
    collateralId: uuid("collateral_id").notNull(),
    collateralUsdt: numeric("collateral_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    ltv: numeric("ltv", { precision: 12, scale: 6 }).notNull().default("0.5"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("loan_collaterals_loan_idx").on(t.loanId),
    uniqueIndex("loan_collaterals_loan_collateral_uidx").on(
      t.loanId,
      t.collateralType,
      t.collateralId,
    ),
  ],
);

export const loanEvents = pgTable(
  "loan_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 24 }).notNull(),
    amountUsdt: numeric("amount_usdt", { precision: 36, scale: 18 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("loan_events_loan_idx").on(t.loanId, t.createdAt)],
);

export const txidLedger = pgTable(
  "txid_ledger",
  {
    txidNorm: varchar("txid_norm", { length: 512 }).primaryKey(),
    provider: varchar("provider", { length: 16 }).notNull(),
    depositId: uuid("deposit_id")
      .notNull()
      .references(() => deposits.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("txid_ledger_deposit_idx").on(t.depositId)],
);

export const withdrawals = pgTable(
  "withdrawals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Internal tag (e.g. manual) */
    provider: varchar("provider", { length: 16 }).notNull(),
    asset: varchar("asset", { length: 32 }).notNull(),
    networkCanonical: varchar("network_canonical", { length: 32 }).notNull(),
    networkCex: varchar("network_cex", { length: 64 }).notNull(),
    toAddress: text("to_address").notNull(),
    memoTo: text("memo_to"),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    fee: numeric("fee", { precision: 36, scale: 18 }).notNull().default("0"),
    /** CEX network fee (Binance) — paid from user `fee`. */
    providerFee: numeric("provider_fee", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    /** McBuleli retained portion of user `fee` after provider fee. */
    platformFee: numeric("platform_fee", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    status: varchar("status", { length: 32 }).notNull(),
    failureReason: text("failure_reason"),
    externalId: varchar("external_id", { length: 128 }),
    txid: varchar("txid", { length: 512 }),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id),
    /** Agent responsible for this ticket (optional). */
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
    agentNote: text("agent_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("withdrawals_user_idx").on(t.userId),
    index("withdrawals_status_idx").on(t.status),
    index("withdrawals_assigned_idx").on(t.assignedToUserId),
  ],
);

export const depositSessions = pgTable(
  "deposit_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    depositId: uuid("deposit_id").references(() => deposits.id, {
      onDelete: "set null",
    }),
    asset: varchar("asset", { length: 16 }).notNull().default("USDT"),
    networkCanonical: varchar("network_canonical", { length: 32 }).notNull(),
    sharedAddress: text("shared_address").notNull(),
    memoShown: text("memo_shown"),
    expectedAmount: numeric("expected_amount", { precision: 36, scale: 18 }).notNull(),
    declaredAmount: numeric("declared_amount", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("ACTIVE"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    graceUntil: timestamp("grace_until", { withTimezone: true }).notNull(),
    matchedTxid: varchar("matched_txid", { length: 512 }),
    matchMeta: jsonb("match_meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("deposit_sessions_user_idx").on(t.userId, t.createdAt),
    index("deposit_sessions_status_idx").on(t.status, t.expiresAt),
    uniqueIndex("deposit_sessions_matched_txid_uidx")
      .on(t.matchedTxid)
      .where(sql`${t.matchedTxid} IS NOT NULL`),
    uniqueIndex("deposit_sessions_open_amount_slot_uidx")
      .on(t.networkCanonical, t.sharedAddress, t.expectedAmount)
      .where(sql`${t.status} IN ('ACTIVE', 'EXPIRED')`),
  ],
);

export const withdrawalRiskEvents = pgTable(
  "withdrawal_risk_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    withdrawalId: uuid("withdrawal_id")
      .notNull()
      .references(() => withdrawals.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    level: varchar("level", { length: 16 }).notNull(),
    reasons: jsonb("reasons").$type<string[]>().notNull().default([]),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("withdrawal_risk_events_withdrawal_idx").on(t.withdrawalId),
    index("withdrawal_risk_events_user_created_idx").on(t.userId, t.createdAt),
  ],
);

export const withdrawalQueueJobs = pgTable(
  "withdrawal_queue_jobs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    withdrawalId: uuid("withdrawal_id")
      .notNull()
      .references(() => withdrawals.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 96 }).notNull(),
    status: varchar("status", { length: 24 }).notNull().default("queued"),
    runAfter: timestamp("run_after", { withTimezone: true })
      .defaultNow()
      .notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(5),
    lockToken: varchar("lock_token", { length: 64 }),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    lastError: text("last_error"),
    providerRef: varchar("provider_ref", { length: 128 }),
    txid: varchar("txid", { length: 512 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("withdrawal_queue_jobs_idempotency_uidx").on(t.idempotencyKey),
    uniqueIndex("withdrawal_queue_jobs_withdrawal_uidx").on(t.withdrawalId),
    index("withdrawal_queue_jobs_status_run_after_idx").on(t.status, t.runAfter),
  ],
);

export const withdrawalAddressWhitelist = pgTable(
  "withdrawal_address_whitelist",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    asset: varchar("asset", { length: 16 }).notNull().default("USDT"),
    networkCanonical: varchar("network_canonical", { length: 32 }).notNull(),
    address: text("address").notNull(),
    memoTo: text("memo_to"),
    label: varchar("label", { length: 64 }),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    cooldownUntil: timestamp("cooldown_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("withdrawal_address_whitelist_user_addr_uidx").on(
      t.userId,
      t.asset,
      t.networkCanonical,
      t.address,
    ),
    index("withdrawal_address_whitelist_status_idx").on(t.userId, t.status),
  ],
);

/** Idempotent handling of PawaPay webhook deliveries (v2). */
/** Custodial USDⓈ-M-style futures (isolated margin in USDT). */
export const tradeFuturesPositions = pgTable(
  "trade_futures_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    side: varchar("side", { length: 8 }).notNull(),
    leverage: integer("leverage").notNull(),
    marginUsdt: numeric("margin_usdt", { precision: 36, scale: 18 }).notNull(),
    entryPrice: numeric("entry_price", { precision: 36, scale: 18 }).notNull(),
    liquidationPrice: numeric("liquidation_price", {
      precision: 36,
      scale: 18,
    }).notNull(),
    stopLossPrice: numeric("stop_loss_price", { precision: 36, scale: 18 }),
    takeProfitPrice: numeric("take_profit_price", { precision: 36, scale: 18 }),
    qtyBase: numeric("qty_base", { precision: 36, scale: 18 }).notNull(),
    feeOpenUsdt: numeric("fee_open_usdt", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    openedAt: timestamp("opened_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closePrice: numeric("close_price", { precision: 36, scale: 18 }),
    realizedPnlUsdt: numeric("realized_pnl_usdt", { precision: 36, scale: 18 }),
    feeCloseUsdt: numeric("fee_close_usdt", { precision: 36, scale: 18 }),
    closeReason: varchar("close_reason", { length: 16 }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    isDemo: boolean("is_demo").notNull().default(false),
  },
  (t) => [
    index("trade_futures_positions_user_idx").on(t.userId),
    index("trade_futures_positions_status_idx").on(t.status),
  ],
);

/** High/low binary-style options (fixed stake, expiry from open). */
export const tradeSimpleOptions = pgTable(
  "trade_simple_options",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    direction: varchar("direction", { length: 8 }).notNull(),
    stakeUsdt: numeric("stake_usdt", { precision: 36, scale: 18 }).notNull(),
    payoutPct: numeric("payout_pct", { precision: 12, scale: 6 }).notNull(),
    durationSec: integer("duration_sec").notNull(),
    expiryAt: timestamp("expiry_at", { withTimezone: true }).notNull(),
    entryPrice: numeric("entry_price", { precision: 36, scale: 18 }).notNull(),
    feeUsdt: numeric("fee_usdt", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    settledAt: timestamp("settled_at", { withTimezone: true }),
    settlementPrice: numeric("settlement_price", {
      precision: 36,
      scale: 18,
    }),
    outcome: varchar("outcome", { length: 8 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    isDemo: boolean("is_demo").notNull().default(false),
  },
  (t) => [
    index("trade_simple_options_user_idx").on(t.userId),
    index("trade_simple_options_status_expiry_idx").on(t.status, t.expiryAt),
  ],
);

/** AVEC — governed village savings & credit (USDT treasury + Ops approval). */
export const groupSavingsGroups = pgTable(
  "group_savings_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 16 }).notNull(),
    name: varchar("name", { length: 96 }).notNull(),
    countryCode: varchar("country_code", { length: 8 }),
    minMembers: integer("min_members").notNull().default(15),
    maxMembers: integer("max_members").notNull().default(25),
    contributionAmountUsdt: numeric("contribution_amount_usdt", {
      precision: 36,
      scale: 18,
    }).notNull(),
    cycleDurationDays: integer("cycle_duration_days").notNull(),
    maxSharesPerMeeting: integer("max_shares_per_meeting").notNull().default(5),
    meetingIntervalDays: integer("meeting_interval_days").notNull().default(7),
    socialFundUsdt: numeric("social_fund_usdt", {
      precision: 36,
      scale: 18,
    })
      .notNull()
      .default("0"),
    paymentRules: text("payment_rules"),
    logoUrl: text("logo_url"),
    address: text("address"),
    contactPhone: varchar("contact_phone", { length: 32 }),
    contactEmail: varchar("contact_email", { length: 128 }),
    publicDescription: text("public_description"),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    subscriptionStatus: varchar("subscription_status", { length: 16 })
      .notNull()
      .default("overdue"),
    nextBillingAt: timestamp("next_billing_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    /** Shareable join code (generated when group is active). */
    inviteCode: varchar("invite_code", { length: 16 }),
    /** AVEC cycle: active | closing | closed */
    cycleStatus: varchar("cycle_status", { length: 16 }).notNull().default("active"),
    cycleNumber: integer("cycle_number").notNull().default(1),
    cycleStartedAt: timestamp("cycle_started_at", { withTimezone: true }),
    cycleClosedAt: timestamp("cycle_closed_at", { withTimezone: true }),
    /** legacy | hybrid | full — collective governance mode */
    governanceMode: varchar("governance_mode", { length: 16 })
      .notNull()
      .default("legacy"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_savings_groups_invite_code_uidx").on(t.inviteCode),
    index("group_savings_groups_creator_idx").on(t.createdByUserId),
    index("group_savings_groups_status_idx").on(t.status),
    index("group_savings_groups_next_billing_idx").on(t.nextBillingAt),
  ],
);

export const groupSavingsMemberships = pgTable(
  "group_savings_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull().default("member"),
    granularRoles: jsonb("granular_roles")
      .$type<string[]>()
      .notNull()
      .default([]),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("group_savings_memberships_group_idx").on(t.groupId),
    index("group_savings_memberships_user_idx").on(t.userId),
    uniqueIndex("group_savings_memberships_group_user_uidx").on(
      t.groupId,
      t.userId,
    ),
  ],
);

export const groupWalletLedgerEntries = pgTable(
  "group_wallet_ledger_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    batchId: uuid("batch_id").notNull(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    entryType: varchar("entry_type", { length: 32 }).notNull(),
    asset: varchar("asset", { length: 16 }).notNull().default("USDT"),
    amount: numeric("amount", { precision: 36, scale: 18 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("group_wallet_ledger_group_idx").on(t.groupId),
    index("group_wallet_ledger_batch_idx").on(t.batchId),
    index("group_wallet_ledger_created_idx").on(t.createdAt),
  ],
);

export const groupSubscriptionInvoices = pgTable(
  "group_subscription_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
    amountUsdt: numeric("amount_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("5"),
    status: varchar("status", { length: 16 }).notNull(),
    attemptedAt: timestamp("attempted_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    ledgerEntryId: uuid("ledger_entry_id").references(
      () => groupWalletLedgerEntries.id,
      { onDelete: "set null" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_subscription_invoices_group_period_uidx").on(
      t.groupId,
      t.period,
    ),
    index("group_subscription_invoices_status_idx").on(t.status),
  ],
);

export const groupMessages = pgTable(
  "group_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    messageType: varchar("message_type", { length: 16 }).notNull().default("chat"),
    attachmentUrl: text("attachment_url"),
    attachmentExpiresAt: timestamp("attachment_expires_at", { withTimezone: true }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [index("group_messages_group_created_idx").on(t.groupId, t.createdAt)],
);

export const groupProposals = pgTable(
  "group_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 64 }).notNull(),
    riskTier: varchar("risk_tier", { length: 1 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    title: text("title").notNull(),
    justification: text("justification").notNull(),
    financialImpactUsdt: numeric("financial_impact_usdt", {
      precision: 36,
      scale: 18,
    }),
    beneficiaryUserId: uuid("beneficiary_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    requiredQuorumPct: integer("required_quorum_pct").notNull(),
    requiredMajorityPct: integer("required_majority_pct").notNull(),
    voteOpensAt: timestamp("vote_opens_at", { withTimezone: true }),
    voteClosesAt: timestamp("vote_closes_at", { withTimezone: true }),
    executionScheduledAt: timestamp("execution_scheduled_at", { withTimezone: true }),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    /** Linked payout request after governance execution (FK in SQL migration). */
    legacyRequestId: uuid("legacy_request_id"),
    /** members = all approved members; committee = comité only (tier B). */
    voteAudience: varchar("vote_audience", { length: 16 }).notNull().default("members"),
    retryCount: integer("retry_count").notNull().default(0),
    parentProposalId: uuid("parent_proposal_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("group_proposals_group_status_idx").on(t.groupId, t.status),
    index("group_proposals_vote_closes_idx").on(t.status, t.voteClosesAt),
    index("group_proposals_execution_scheduled_idx").on(t.status, t.executionScheduledAt),
  ],
);

export const groupVotes = pgTable(
  "group_votes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proposalId: uuid("proposal_id")
      .notNull()
      .references(() => groupProposals.id, { onDelete: "cascade" }),
    voterUserId: uuid("voter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    choice: varchar("choice", { length: 8 }).notNull(),
    weight: numeric("weight", { precision: 8, scale: 4 }).notNull().default("1"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_votes_proposal_voter_uidx").on(t.proposalId, t.voterUserId),
  ],
);

export const groupSocialFundRequests = pgTable(
  "group_social_fund_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    requesterUserId: uuid("requester_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    aidType: varchar("aid_type", { length: 32 }).notNull(),
    aidMode: varchar("aid_mode", { length: 16 }).notNull().default("grant"),
    amountUsdt: numeric("amount_usdt", { precision: 36, scale: 18 }).notNull(),
    justification: text("justification").notNull(),
    proofAttachmentUrl: text("proof_attachment_url"),
    status: varchar("status", { length: 24 }).notNull().default("pending_vote"),
    proposalId: uuid("proposal_id").references(() => groupProposals.id, {
      onDelete: "set null",
    }),
    limitsSnapshot: jsonb("limits_snapshot")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("group_social_fund_requests_group_status_idx").on(t.groupId, t.status),
    index("group_social_fund_requests_requester_idx").on(t.requesterUserId, t.createdAt),
  ],
);

export const groupPayoutRequests = pgTable(
  "group_payout_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toUserId: uuid("to_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amountUsdt: numeric("amount_usdt", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    requiredApprovals: integer("required_approvals").notNull(),
    rejectionReason: text("rejection_reason"),
    batchId: uuid("batch_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    proposalId: uuid("proposal_id").references(() => groupProposals.id, {
      onDelete: "set null",
    }),
  },
  (t) => [
    index("group_payout_requests_group_status_idx").on(t.groupId, t.status),
  ],
);

export const groupAvecLoans = pgTable(
  "group_avec_loans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    borrowerUserId: uuid("borrower_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    principalUsdt: numeric("principal_usdt", { precision: 36, scale: 18 }).notNull(),
    outstandingUsdt: numeric("outstanding_usdt", { precision: 36, scale: 18 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    requiredApprovals: integer("required_approvals").notNull(),
    interestRatePctMonth: numeric("interest_rate_pct_month", {
      precision: 8,
      scale: 4,
    })
      .notNull()
      .default("2"),
    penaltyRatePct: numeric("penalty_rate_pct", { precision: 8, scale: 4 })
      .notNull()
      .default("5"),
    loanTermDays: integer("loan_term_days").notNull().default(90),
    rejectionReason: text("rejection_reason"),
    batchId: uuid("batch_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    disbursedAt: timestamp("disbursed_at", { withTimezone: true }),
  },
  (t) => [index("group_avec_loans_group_status_idx").on(t.groupId, t.status)],
);

export const groupAvecLoanApprovals = pgTable(
  "group_avec_loan_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => groupAvecLoans.id, { onDelete: "cascade" }),
    approverUserId: uuid("approver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_avec_loan_approvals_loan_approver_uidx").on(
      t.loanId,
      t.approverUserId,
    ),
  ],
);

export const groupCycleClosureRequests = pgTable(
  "group_cycle_closure_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    initiatedByUserId: uuid("initiated_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cycleNumber: integer("cycle_number").notNull(),
    distributableUsdt: numeric("distributable_usdt", {
      precision: 36,
      scale: 18,
    }).notNull(),
    snapshot: jsonb("snapshot").$type<Record<string, unknown>>().notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    requiredApprovals: integer("required_approvals").notNull(),
    batchId: uuid("batch_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    executedAt: timestamp("executed_at", { withTimezone: true }),
  },
  (t) => [
    index("group_cycle_closure_requests_group_status_idx").on(t.groupId, t.status),
  ],
);

export const groupCycleClosureApprovals = pgTable(
  "group_cycle_closure_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => groupCycleClosureRequests.id, { onDelete: "cascade" }),
    approverUserId: uuid("approver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_cycle_closure_approvals_request_approver_uidx").on(
      t.requestId,
      t.approverUserId,
    ),
  ],
);

export const groupPayoutApprovals = pgTable(
  "group_payout_approvals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    requestId: uuid("request_id")
      .notNull()
      .references(() => groupPayoutRequests.id, { onDelete: "cascade" }),
    approverUserId: uuid("approver_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("group_payout_approvals_request_approver_uidx").on(
      t.requestId,
      t.approverUserId,
    ),
  ],
);

export const groupAuditLog = pgTable(
  "group_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    groupId: uuid("group_id")
      .notNull()
      .references(() => groupSavingsGroups.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 64 }).notNull(),
    before: jsonb("before").$type<Record<string, unknown> | null>(),
    after: jsonb("after").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("group_audit_log_group_idx").on(t.groupId),
    index("group_audit_log_created_idx").on(t.createdAt),
  ],
);

/** Cross-cutting audit trail for platform staff actions (super-admin global view). */
export const platformAdminAuditLog = pgTable(
  "platform_admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 80 }).notNull(),
    resourceType: varchar("resource_type", { length: 32 }),
    resourceId: varchar("resource_id", { length: 64 }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("platform_admin_audit_created_idx").on(t.createdAt),
    index("platform_admin_audit_actor_idx").on(t.actorUserId),
  ],
);

/**
 * Operating expenses (OPEX) — not user-wallet ledger lines.
 * Workflow: draft → submitted → approved | rejected → paid (optional).
 */
export const platformExpenses = pgTable(
  "platform_expenses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    amount: numeric("amount", { precision: 18, scale: 2 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull().default("USD"),
    category: varchar("category", { length: 64 }).notNull(),
    description: text("description").notNull(),
    vendor: text("vendor"),
    attachmentUrl: text("attachment_url"),
    /** Calendar date (YYYY-MM-DD) as stored by the app. */
    expenseDate: varchar("expense_date", { length: 10 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    approvedByUserId: uuid("approved_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    rejectedByUserId: uuid("rejected_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    rejectedAt: timestamp("rejected_at", { withTimezone: true }),
    rejectionReason: text("rejection_reason"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidNote: text("paid_note"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("platform_expenses_status_idx").on(t.status),
    index("platform_expenses_creator_idx").on(t.createdByUserId),
    index("platform_expenses_expense_date_idx").on(t.expenseDate),
    index("platform_expenses_created_idx").on(t.createdAt),
  ],
);

export const platformExpenseEvents = pgTable(
  "platform_expense_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    expenseId: uuid("expense_id")
      .notNull()
      .references(() => platformExpenses.id, { onDelete: "cascade" }),
    actorUserId: uuid("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 32 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("platform_expense_events_expense_idx").on(t.expenseId),
    index("platform_expense_events_created_idx").on(t.createdAt),
  ],
);

export const pawapayWebhookEvents = pgTable(
  "pawapay_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    dedupKey: varchar("dedup_key", { length: 512 }).notNull().unique(),
    kind: varchar("kind", { length: 16 }).notNull(),
    pawapayId: varchar("pawapay_id", { length: 64 }).notNull(),
    status: varchar("status", { length: 32 }).notNull(),
    currency: varchar("currency", { length: 8 }).notNull(),
    amount: varchar("amount", { length: 64 }).notNull(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    /** credited_usdt | refund_usdt | none | skipped_currency | no_user */
    effect: varchar("effect", { length: 32 }).notNull(),
    /** Raw JSON body for audit */
    rawBody: text("raw_body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("pawapay_webhook_user_idx").on(t.userId),
    index("pawapay_webhook_pawapay_idx").on(t.pawapayId),
  ],
);

/** Fiat deposit/withdraw transactions initiated via PawaPay (pending → completed/failed). */
export const fiatPawapayTransactions = pgTable(
  "fiat_pawapay_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** deposit | payout */
    kind: varchar("kind", { length: 16 }).notNull(),
    /** INITIATED | PROCESSING | COMPLETED | FAILED */
    status: varchar("status", { length: 24 }).notNull().default("INITIATED"),
    /** PawaPay depositId / payoutId */
    pawapayId: varchar("pawapay_id", { length: 64 }).notNull().unique(),
    currency: varchar("currency", { length: 8 }).notNull(),
    /** Amount requested at initiation (gross for deposit; net for payout). */
    amount: varchar("amount", { length: 64 }).notNull(),
    phoneNumber: varchar("phone_number", { length: 32 }),
    provider: varchar("provider", { length: 64 }),
    failureCode: varchar("failure_code", { length: 64 }),
    failureMessage: text("failure_message"),
    /** Links to our wallet ledger batch when applicable (withdrawals). */
    batchId: uuid("batch_id"),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    index("fiat_pawapay_tx_user_idx").on(t.userId),
    index("fiat_pawapay_tx_status_idx").on(t.status),
    index("fiat_pawapay_tx_kind_idx").on(t.kind),
  ],
);

/** Encrypted Binance API keys per user (demo testnet vs live). */
export const userBinanceApiCredentials = pgTable(
  "user_binance_api_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** demo = testnet keys; live = production */
    environment: varchar("environment", { length: 8 }).notNull(),
    apiKeyHint: varchar("api_key_hint", { length: 24 }).notNull(),
    credentialsCiphertext: text("credentials_ciphertext").notNull(),
    spotOk: boolean("spot_ok").notNull().default(false),
    futuresOk: boolean("futures_ok").notNull().default(false),
    /** fapi | papi — set when futuresOk after validation */
    futuresApiKind: varchar("futures_api_kind", { length: 8 }),
    lastValidationError: text("last_validation_error"),
    validatedAt: timestamp("validated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("user_binance_api_credentials_user_env_uidx").on(
      t.userId,
      t.environment,
    ),
  ],
);

/** User bot strategy config (one row per plan). */
export const botInstances = pgTable(
  "bot_instances",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 32 }).notNull(),
    billing: varchar("billing", { length: 8 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("paused"),
    config: jsonb("config").$type<Record<string, unknown>>().notNull().default({}),
    lastExecutedAt: timestamp("last_executed_at", { withTimezone: true }),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("bot_instances_user_plan_uidx").on(t.userId, t.planId),
  ],
);

export const botExecutionLog = pgTable(
  "bot_execution_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    instanceId: uuid("instance_id")
      .notNull()
      .references(() => botInstances.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 32 }).notNull(),
    action: varchar("action", { length: 32 }).notNull(),
    detail: jsonb("detail").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("bot_execution_log_instance_idx").on(t.instanceId, t.createdAt),
  ],
);

/** Paid bot plan (DCA / Grid / Futures) — demo or live billing. */
export const botSubscriptions = pgTable(
  "bot_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 32 }).notNull(),
    billing: varchar("billing", { length: 8 }).notNull(),
    pricePaid: numeric("price_paid", { precision: 18, scale: 8 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("bot_subscriptions_user_active_idx").on(
      t.userId,
      t.status,
      t.expiresAt,
    ),
  ],
);

/** Idempotent earn row — unique on (userId, idempotencyKey). */
export const rewardPointGrants = pgTable(
  "reward_point_grants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    grantType: varchar("grant_type", { length: 48 }).notNull(),
    idempotencyKey: varchar("idempotency_key", { length: 96 }).notNull(),
    points: integer("points").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex("reward_point_grants_user_idempotency_unique").on(
      t.userId,
      t.idempotencyKey,
    ),
    index("reward_point_grants_user_idx").on(t.userId, t.createdAt),
  ],
);

/** Active spend perks (fee discounts) — Phase 2. */
export const rewardPointPerks = pgTable(
  "reward_point_perks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    perkType: varchar("perk_type", { length: 48 }).notNull(),
    discountPercent: integer("discount_percent").notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    usedOrderId: uuid("used_order_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("reward_point_perks_user_active_idx").on(
      t.userId,
      t.status,
      t.expiresAt,
    ),
  ],
);

/** Append-only BP ledger (credits; debits in Phase 2). */
export const rewardPointLedger = pgTable(
  "reward_point_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    grantType: varchar("grant_type", { length: 48 }),
    note: varchar("note", { length: 128 }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("reward_point_ledger_user_created_idx").on(t.userId, t.createdAt),
  ],
);

/** BP → McB on-chain claim queue (Phase 3). */
export const mcbClaims = pgTable(
  "mcb_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bpAmount: integer("bp_amount").notNull(),
    mcbAmount: numeric("mcb_amount", { precision: 36, scale: 18 }).notNull(),
    walletAddress: varchar("wallet_address", { length: 64 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    txHash: varchar("tx_hash", { length: 128 }),
    rejectReason: text("reject_reason"),
    processedByUserId: uuid("processed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("mcb_claims_user_status_idx").on(t.userId, t.status, t.createdAt),
    index("mcb_claims_status_created_idx").on(t.status, t.createdAt),
  ],
);

/** In-app notifications (bell drawer). */
export const userNotifications = pgTable(
  "user_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: varchar("kind", { length: 48 }).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown> | null>(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("user_notifications_user_created_idx").on(t.userId, t.createdAt),
  ],
);

/** Global support chat — one open thread per end-user at a time. */
export const supportThreads = pgTable(
  "support_threads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedToUserId: uuid("assigned_to_user_id").references(() => users.id),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedReason: varchar("closed_reason", { length: 16 }),
  },
  (t) => [
    index("support_threads_last_msg_idx").on(t.lastMessageAt),
    index("support_threads_assigned_idx").on(t.assignedToUserId),
    index("support_threads_user_status_idx").on(t.userId, t.status),
  ],
);

export type SupportAttachment = {
  type: "image";
  dataUrl: string;
  mime: string;
  sizeBytes: number;
};

export const supportMessages = pgTable(
  "support_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => supportThreads.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachments: jsonb("attachments").$type<SupportAttachment[] | null>(),
    /** Mentioned user ids (@agent / @user). */
    mentions: jsonb("mentions").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    index("support_messages_thread_created_idx").on(t.threadId, t.createdAt),
  ],
);

export const supportMessageReads = pgTable(
  "support_message_reads",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => supportMessages.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("support_message_reads_uq").on(t.messageId, t.userId),
    index("support_message_reads_user_idx").on(t.userId),
  ],
);

export const kycSessions = pgTable(
  "kyc_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    diditSessionId: varchar("didit_session_id", { length: 128 }).notNull(),
    status: varchar("status", { length: 32 }).notNull().default("Not Started"),
    workflowId: varchar("workflow_id", { length: 64 }),
    verificationUrl: text("verification_url"),
    rawDecision: jsonb("raw_decision"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("kyc_sessions_didit_session_id_unique").on(t.diditSessionId),
    index("kyc_sessions_user_id_idx").on(t.userId),
  ],
);

export const kycResults = pgTable(
  "kyc_results",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => kycSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    outcome: varchar("outcome", { length: 16 }).notNull(),
    firstName: varchar("first_name", { length: 128 }),
    lastName: varchar("last_name", { length: 128 }),
    birthDate: date("birth_date"),
    documentNumber: varchar("document_number", { length: 64 }),
    documentType: varchar("document_type", { length: 32 }),
    documentCountry: varchar("document_country", { length: 8 }),
    rejectionReason: text("rejection_reason"),
    source: varchar("source", { length: 16 }).notNull().default("webhook"),
    decidedAt: timestamp("decided_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("kyc_results_user_id_idx").on(t.userId)],
);

/** Didit webhook idempotency — dedupe on event_id (V3). */
export const diditWebhookEvents = pgTable("didit_webhook_events", {
  eventId: varchar("event_id", { length: 64 }).primaryKey(),
  processedAt: timestamp("processed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const authChallenges = pgTable(
  "auth_challenges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("auth_challenges_user_purpose_idx").on(t.userId, t.purpose),
    index("auth_challenges_expires_idx").on(t.expiresAt),
  ],
);

export const userTotpBackupCodes = pgTable(
  "user_totp_backup_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("user_totp_backup_codes_user_idx").on(t.userId)],
);

export const userPasskeys = pgTable(
  "user_passkeys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    credentialId: text("credential_id").notNull(),
    publicKey: text("public_key").notNull(),
    counter: bigint("counter", { mode: "number" }).notNull().default(0),
    deviceName: varchar("device_name", { length: 64 }),
    transports: jsonb("transports").$type<string[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("user_passkeys_credential_id_unique").on(t.credentialId),
    index("user_passkeys_user_idx").on(t.userId),
  ],
);

export const waInboundEvents = pgTable(
  "wa_inbound_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    chatId: varchar("chat_id", { length: 64 }),
    phone: varchar("phone", { length: 32 }),
    body: text("body"),
    matchedUserId: uuid("matched_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    matchedChallengeId: uuid("matched_challenge_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("wa_inbound_events_created_idx").on(t.createdAt)],
);

/** McBuleli AI Virtual Assistant — conversation sessions. */
export const aiAssistantConversations = pgTable(
  "ai_assistant_conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    guestToken: varchar("guest_token", { length: 64 }),
    locale: varchar("locale", { length: 8 }).notNull().default("en"),
    pageContext: varchar("page_context", { length: 128 }),
    detectedIntents: jsonb("detected_intents")
      .$type<string[]>()
      .default([]),
    simplifiedMode: boolean("simplified_mode").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ai_assistant_conversations_user_idx").on(t.userId),
    index("ai_assistant_conversations_guest_idx").on(t.guestToken),
    index("ai_assistant_conversations_updated_idx").on(t.updatedAt),
  ],
);

export const aiAssistantMessages = pgTable(
  "ai_assistant_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => aiAssistantConversations.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("ai_assistant_messages_conversation_idx").on(
      t.conversationId,
      t.createdAt,
    ),
  ],
);

/** FAQ / knowledge base for RAG retrieval. */
export const aiAssistantKnowledge = pgTable(
  "ai_assistant_knowledge",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 128 }).notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    locale: varchar("locale", { length: 8 }).notNull().default("all"),
    title: varchar("title", { length: 256 }).notNull(),
    content: text("content").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    embedding: jsonb("embedding").$type<number[] | null>(),
    priority: integer("priority").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("ai_assistant_knowledge_slug_locale_uidx").on(t.slug, t.locale),
    index("ai_assistant_knowledge_category_idx").on(t.category),
    index("ai_assistant_knowledge_published_idx").on(t.published),
  ],
);

/** Free launch academy registrations (super-admin OPS export). */
export const trainingRegistrations = pgTable(
  "training_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    linkedAt: timestamp("linked_at", { withTimezone: true }),
    fullName: varchar("full_name", { length: 120 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 32 }).notNull(),
    city: varchar("city", { length: 80 }),
    locale: varchar("locale", { length: 8 }).notNull().default("fr"),
    experienceLevel: varchar("experience_level", { length: 24 }),
    interests: jsonb("interests").$type<string[]>().default([]),
    whatsappOptIn: boolean("whatsapp_opt_in").notNull().default(true),
    source: varchar("source", { length: 64 }).notNull().default("formation"),
    utmSource: varchar("utm_source", { length: 64 }),
    utmMedium: varchar("utm_medium", { length: 32 }),
    utmCampaign: varchar("utm_campaign", { length: 64 }),
    remindedAt: timestamp("reminded_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("training_registrations_created_idx").on(t.createdAt),
    index("training_registrations_email_idx").on(t.email),
    index("training_registrations_user_idx").on(t.userId),
  ],
);

/** Academy program catalog (Crypto, Trading, IA, P2P…). */
export const academyPrograms = pgTable(
  "academy_programs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 64 }).notNull().unique(),
    level: varchar("level", { length: 16 }).notNull().default("discovery"),
    priceUsdt: numeric("price_usdt", { precision: 36, scale: 18 }),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    summaryFr: text("summary_fr"),
    summaryEn: text("summary_en"),
    topics: jsonb("topics").$type<string[]>().default([]),
    requiresKyc: boolean("requires_kyc").notNull().default(false),
    sortOrder: integer("sort_order").notNull().default(0),
    published: boolean("published").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

/** Dated cohort / edition of a program. */
export const academyEditions = pgTable(
  "academy_editions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    programId: uuid("program_id")
      .notNull()
      .references(() => academyPrograms.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    deliveryMode: varchar("delivery_mode", { length: 16 })
      .notNull()
      .default("online"),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    cohortMeta: jsonb("cohort_meta").$type<Record<string, unknown> | null>(),
    liveBaseUrl: text("live_base_url"),
    tutorEnabled: boolean("tutor_enabled").notNull().default(true),
    ownerUserId: uuid("owner_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    source: varchar("source", { length: 24 }).notNull().default("internal"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_editions_program_slug_uidx").on(t.programId, t.slug),
    index("academy_editions_status_idx").on(t.status, t.startsAt),
    index("academy_editions_owner_idx").on(t.ownerUserId),
  ],
);

export const academyLivePurchases = pgTable(
  "academy_live_purchases",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planId: varchar("plan_id", { length: 32 }).notNull(),
    pricePaid: numeric("price_paid", { precision: 18, scale: 8 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    sessionsRemaining: integer("sessions_remaining").notNull(),
    maxParticipants: integer("max_participants").notNull(),
    maxMinutesPerSession: integer("max_minutes_per_session").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("academy_live_purchases_user_status_idx").on(
      t.userId,
      t.status,
      t.expiresAt,
    ),
  ],
);

export const academyCohortMessages = pgTable(
  "academy_cohort_messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    senderUserId: uuid("sender_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    body: text("body").notNull(),
    messageType: varchar("message_type", { length: 16 })
      .notNull()
      .default("chat"),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("academy_cohort_messages_edition_created_idx").on(
      t.editionId,
      t.createdAt,
    ),
  ],
);

export const academySessions = pgTable(
  "academy_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    kind: varchar("kind", { length: 16 }).notNull().default("live"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    liveUrl: text("live_url"),
    replayUrl: text("replay_url"),
    replayR2Key: varchar("replay_r2_key", { length: 256 }),
    replayPublishedAt: timestamp("replay_published_at", { withTimezone: true }),
    /** Host a cliqué « Démarrer le live » — invités peuvent entrer la vidéo. */
    liveStartedAt: timestamp("live_started_at", { withTimezone: true }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    uniqueIndex("academy_sessions_edition_slug_uidx").on(t.editionId, t.slug),
    index("academy_sessions_edition_starts_idx").on(t.editionId, t.startsAt),
  ],
);

export const academyModules = pgTable(
  "academy_modules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    summaryFr: text("summary_fr").notNull(),
    summaryEn: text("summary_en").notNull(),
    bodyFr: text("body_fr").notNull(),
    bodyEn: text("body_en").notNull(),
    visualKey: varchar("visual_key", { length: 16 }).notNull().default("crypto"),
    unlockAfterSlug: varchar("unlock_after_slug", { length: 64 }),
    ecosystemHref: varchar("ecosystem_href", { length: 256 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_modules_edition_slug_uidx").on(t.editionId, t.slug),
    index("academy_modules_edition_sort_idx").on(t.editionId, t.sortOrder),
  ],
);

export const academyModuleProgress = pgTable(
  "academy_module_progress",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    moduleId: uuid("module_id")
      .notNull()
      .references(() => academyModules.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_module_progress_user_module_uidx").on(
      t.userId,
      t.moduleId,
    ),
    index("academy_module_progress_user_idx").on(t.userId),
  ],
);

export const academyProgressNudges = pgTable("academy_progress_nudges", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  lastSentAt: timestamp("last_sent_at", { withTimezone: true }).notNull(),
});

export const academyEditionHosts = pgTable(
  "academy_edition_hosts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull().default("co_host"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_edition_hosts_edition_user_uidx").on(
      t.editionId,
      t.userId,
    ),
    index("academy_edition_hosts_edition_idx").on(t.editionId),
  ],
);

export const academyLearningEvents = pgTable(
  "academy_learning_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    editionId: uuid("edition_id").references(() => academyEditions.id, {
      onDelete: "set null",
    }),
    verb: varchar("verb", { length: 32 }).notNull(),
    objectType: varchar("object_type", { length: 32 }).notNull(),
    objectId: varchar("object_id", { length: 64 }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("academy_learning_events_user_created_idx").on(
      t.userId,
      t.createdAt,
    ),
    index("academy_learning_events_edition_idx").on(
      t.editionId,
      t.createdAt,
    ),
  ],
);

export const academySessionReminders = pgTable(
  "academy_session_reminders",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academySessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reminderKind: varchar("reminder_kind", { length: 16 }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_session_reminders_unique").on(
      t.sessionId,
      t.userId,
      t.reminderKind,
    ),
    index("academy_session_reminders_session_idx").on(t.sessionId),
  ],
);

export const academyEnrollments = pgTable(
  "academy_enrollments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    paidUsdt: numeric("paid_usdt", { precision: 36, scale: 18 })
      .notNull()
      .default("0"),
    paymentRef: varchar("payment_ref", { length: 64 }),
    enrolledAt: timestamp("enrolled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("academy_enrollments_user_edition_uidx").on(
      t.userId,
      t.editionId,
    ),
    index("academy_enrollments_edition_idx").on(t.editionId),
  ],
);

export const academyAttendance = pgTable(
  "academy_attendance",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    enrollmentId: uuid("enrollment_id")
      .notNull()
      .references(() => academyEnrollments.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => academySessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    method: varchar("method", { length: 16 }).notNull().default("live_button"),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("academy_attendance_enrollment_session_uidx").on(
      t.enrollmentId,
      t.sessionId,
    ),
  ],
);

export const academyQuizzes = pgTable(
  "academy_quizzes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    editionId: uuid("edition_id")
      .notNull()
      .references(() => academyEditions.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    passPercent: integer("pass_percent").notNull().default(70),
    maxAttempts: integer("max_attempts").notNull().default(3),
  },
  (t) => [
    uniqueIndex("academy_quizzes_edition_slug_uidx").on(t.editionId, t.slug),
  ],
);

export const academyQuizQuestions = pgTable(
  "academy_quiz_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => academyQuizzes.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
    promptFr: text("prompt_fr").notNull(),
    promptEn: text("prompt_en").notNull(),
    optionsFr: jsonb("options_fr").$type<string[]>().notNull(),
    optionsEn: jsonb("options_en").$type<string[]>().notNull(),
    correctIndex: integer("correct_index").notNull(),
  },
);

export const academyQuizAttempts = pgTable(
  "academy_quiz_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    quizId: uuid("quiz_id")
      .notNull()
      .references(() => academyQuizzes.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    scorePercent: integer("score_percent").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers").$type<number[] | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("academy_quiz_attempts_user_quiz_idx").on(
      t.userId,
      t.quizId,
      t.createdAt,
    ),
  ],
);

/** Badges & certificates — public verify via verify_code. */
export const academyCredentials = pgTable(
  "academy_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    programId: uuid("program_id").references(() => academyPrograms.id, {
      onDelete: "set null",
    }),
    editionId: uuid("edition_id").references(() => academyEditions.id, {
      onDelete: "set null",
    }),
    kind: varchar("kind", { length: 16 }).notNull().default("badge"),
    slug: varchar("slug", { length: 64 }).notNull(),
    titleFr: varchar("title_fr", { length: 160 }).notNull(),
    titleEn: varchar("title_en", { length: 160 }).notNull(),
    verifyCode: varchar("verify_code", { length: 32 }).notNull().unique(),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
  },
  (t) => [
    index("academy_credentials_user_idx").on(t.userId, t.issuedAt),
  ],
);

// ─── Community Hub (métadonnées — médias sur Cloudflare R2 / Stream) ───

export const communityUserProfiles = pgTable(
  "community_user_profiles",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    handle: varchar("handle", { length: 32 }).notNull().unique(),
    displayName: varchar("display_name", { length: 64 }).notNull(),
    showKycBadge: boolean("show_kyc_badge").notNull().default(false),
    bio: varchar("bio", { length: 280 }),
    avatarMediaId: uuid("avatar_media_id"),
    reputationScore: integer("reputation_score").notNull().default(0),
    postsCount: integer("posts_count").notNull().default(0),
    meta: jsonb("meta").$type<Record<string, unknown> | null>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("community_profiles_handle_idx").on(t.handle)],
);

export const communityMedia = pgTable(
  "community_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    bucket: varchar("bucket", { length: 64 }).notNull(),
    objectKey: varchar("object_key", { length: 512 }).notNull(),
    publicUrl: text("public_url").notNull(),
    fileType: varchar("file_type", { length: 16 }).notNull(),
    mimeType: varchar("mime_type", { length: 128 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSec: integer("duration_sec"),
    streamId: varchar("stream_id", { length: 64 }),
    variants: jsonb("variants").$type<Record<string, string> | null>(),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_media_owner_created_idx").on(t.ownerId, t.createdAt),
    index("community_media_status_idx").on(t.status, t.createdAt),
  ],
);

export const communityPosts = pgTable(
  "community_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    postType: varchar("post_type", { length: 16 }).notNull().default("text"),
    status: varchar("status", { length: 16 }).notNull().default("published"),
    mediaIds: jsonb("media_ids").$type<string[] | null>(),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
    shareCount: integer("share_count").notNull().default(0),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_posts_feed_idx").on(t.status, t.publishedAt),
    index("community_posts_author_idx").on(t.authorId, t.createdAt),
  ],
);

export const communityComments = pgTable(
  "community_comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    postId: uuid("post_id")
      .notNull()
      .references(() => communityPosts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    likeCount: integer("like_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_comments_post_idx").on(t.postId, t.createdAt),
    index("community_comments_author_idx").on(t.authorId, t.createdAt),
  ],
);

export const communityLikes = pgTable(
  "community_likes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 16 }).notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_likes_target_idx").on(t.targetType, t.targetId),
    index("community_likes_user_target_idx").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
    uniqueIndex("community_likes_user_target_unique").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
  ],
);

export const communityBlogCategories = pgTable(
  "community_blog_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 32 }).notNull().unique(),
    labelFr: varchar("label_fr", { length: 64 }).notNull(),
    labelEn: varchar("label_en", { length: 64 }).notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
);

export const communityBlogPosts = pgTable(
  "community_blog_posts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(
      () => communityBlogCategories.id,
      { onDelete: "set null" },
    ),
    slug: varchar("slug", { length: 120 }).notNull().unique(),
    title: varchar("title", { length: 200 }).notNull(),
    excerpt: varchar("excerpt", { length: 320 }),
    body: text("body").notNull(),
    coverMediaId: uuid("cover_media_id"),
    status: varchar("status", { length: 16 }).notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_blog_posts_status_idx").on(t.status, t.publishedAt),
    index("community_blog_posts_author_idx").on(t.authorId, t.updatedAt),
    index("community_blog_posts_category_idx").on(t.categoryId, t.publishedAt),
  ],
);

export const communityQuestions = pgTable(
  "community_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    body: text("body").notNull(),
    tags: jsonb("tags").$type<string[] | null>(),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    acceptedAnswerId: uuid("accepted_answer_id"),
    viewCount: integer("view_count").notNull().default(0),
    answerCount: integer("answer_count").notNull().default(0),
    voteScore: integer("vote_score").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_questions_status_idx").on(t.status, t.createdAt),
    index("community_questions_author_idx").on(t.authorId, t.createdAt),
  ],
);

export const communityAnswers = pgTable(
  "community_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    questionId: uuid("question_id")
      .notNull()
      .references(() => communityQuestions.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    voteScore: integer("vote_score").notNull().default(0),
    isAccepted: boolean("is_accepted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_answers_question_idx").on(
      t.questionId,
      t.voteScore,
      t.createdAt,
    ),
    index("community_answers_author_idx").on(t.authorId, t.createdAt),
  ],
);

export const communityReports = pgTable(
  "community_reports",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    reporterId: uuid("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetType: varchar("target_type", { length: 16 }).notNull(),
    targetId: uuid("target_id").notNull(),
    reason: varchar("reason", { length: 32 }).notNull(),
    details: text("details"),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_reports_status_idx").on(t.status, t.createdAt),
    index("community_reports_target_idx").on(t.targetType, t.targetId),
  ],
);

export const communityUserBlocks = pgTable(
  "community_user_blocks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    blockerId: uuid("blocker_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    blockedId: uuid("blocked_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_blocks_blocker_idx").on(t.blockerId, t.createdAt),
    index("community_blocks_pair_idx").on(t.blockerId, t.blockedId),
  ],
);

/** Phase 3 — signaux trading communautaires (pas d'exécution auto). */
export const communityTradingSignals = pgTable(
  "community_trading_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    side: varchar("side", { length: 8 }).notNull(),
    entryPrice: numeric("entry_price", { precision: 36, scale: 18 }),
    targetPrice: numeric("target_price", { precision: 36, scale: 18 }),
    stopPrice: numeric("stop_price", { precision: 36, scale: 18 }),
    note: varchar("note", { length: 500 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("open"),
    outcome: varchar("outcome", { length: 16 }),
    isEducational: boolean("is_educational").notNull().default(true),
    publishedAt: timestamp("published_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("community_signals_author_idx").on(t.authorId, t.publishedAt),
    index("community_signals_status_idx").on(t.status, t.publishedAt),
  ],
);

/** Phase 3 — copy-trading : suivi trader (exécution auto = futur). */
export const communityTraderFollows = pgTable(
  "community_trader_follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    traderId: uuid("trader_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("community_trader_follows_pair_unique").on(
      t.followerId,
      t.traderId,
    ),
    index("community_trader_follows_trader_idx").on(t.traderId, t.createdAt),
  ],
);

export const communityReputationEvents = pgTable(
  "community_reputation_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    reason: varchar("reason", { length: 48 }).notNull(),
    refType: varchar("ref_type", { length: 16 }),
    refId: uuid("ref_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("community_reputation_user_idx").on(t.userId, t.createdAt)],
);

export const communityBadges = pgTable(
  "community_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 32 }).notNull().unique(),
    labelFr: varchar("label_fr", { length: 64 }).notNull(),
    labelEn: varchar("label_en", { length: 64 }).notNull(),
    iconKey: varchar("icon_key", { length: 16 }).notNull().default("star"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
);

export const communityUserBadges = pgTable(
  "community_user_badges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: uuid("badge_id")
      .notNull()
      .references(() => communityBadges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("community_user_badges_unique").on(t.userId, t.badgeId),
    index("community_user_badges_user_idx").on(t.userId, t.earnedAt),
  ],
);
