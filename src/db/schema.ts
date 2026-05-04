import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  jsonb,
  uniqueIndex,
  index,
  boolean,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  /** user | agent | super_admin */
  role: varchar("role", { length: 32 }).notNull().default("user"),
  /** ISO 3166-1 alpha-2 (e.g. CD) or OTHER. */
  countryCode: varchar("country_code", { length: 8 }),
  /** none | pending | approved | rejected | manual_review */
  kycStatus: varchar("kyc_status", { length: 16 }).notNull().default("none"),
  kycUpdatedAt: timestamp("kyc_updated_at", { withTimezone: true }),
  balance: numeric("balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
  /** Pi Network balance (manual OKX-backed deposit/withdraw). */
  piBalance: numeric("pi_balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
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
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

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
    paymentMethods: text("payment_methods").notNull(),
    terms: text("terms"),
    countryCode: varchar("country_code", { length: 8 }),
    status: varchar("status", { length: 16 }).notNull().default("active"),
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

/** LIKELEMBA / AVEC — governed group savings with subscription billing (USDT). */
export const groupSavingsGroups = pgTable(
  "group_savings_groups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: varchar("type", { length: 16 }).notNull(),
    name: varchar("name", { length: 96 }).notNull(),
    countryCode: varchar("country_code", { length: 8 }),
    minMembers: integer("min_members").notNull().default(2),
    maxMembers: integer("max_members").notNull().default(30),
    contributionAmountUsdt: numeric("contribution_amount_usdt", {
      precision: 36,
      scale: 18,
    }).notNull(),
    cycleDurationDays: integer("cycle_duration_days").notNull(),
    paymentRules: text("payment_rules"),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
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
