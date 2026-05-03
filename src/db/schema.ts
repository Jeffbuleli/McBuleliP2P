import { sql } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  numeric,
  integer,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  balance: numeric("balance", { precision: 36, scale: 18 })
    .notNull()
    .default("0"),
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
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [index("withdrawals_user_idx").on(t.userId)],
);
