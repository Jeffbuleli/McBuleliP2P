import { z } from "zod";
import type { CexId } from "./networks";

const email = z.string().trim().min(3).max(255).email();

export const loginSchema = z.object({
  email: email,
  password: z.string().min(8).max(128),
});

export const registerSchema = loginSchema.extend({
  displayName: z
    .string()
    .trim()
    .min(2, "Pseudo too short")
    .max(32, "Pseudo too long")
    .regex(/^[\p{L}\p{N}._ -]+$/u, "Invalid characters in pseudo"),
  /** ISO 3166-1 alpha-2, or OTHER if the user is outside the quick list. */
  countryCode: z
    .string()
    .trim()
    .length(2)
    .regex(/^[A-Z]{2}$/)
    .optional(),
  referralCode: z.string().trim().min(4).max(16).optional(),
});

const networkEnum = z.enum(["TRC20", "ERC20", "BEP20"]);

const cexBinance: z.ZodType<Extract<CexId, "binance">> = z.literal("binance");

const depositUsdtIntent = z.object({
  provider: cexBinance,
  asset: z.literal("USDT"),
  network: networkEnum,
  /** Planned gross USDT deposit (validated against corridor minimums server-side). */
  declaredAmountUsdt: z.string().regex(/^\d+(\.\d+)?$/),
  /** Optional reference / memo for the user’s own records (not the exchange destination tag). */
  userNote: z.string().trim().max(512).optional(),
});

const depositPiIntent = z.object({
  provider: z.literal("manual"),
  asset: z.literal("PI"),
  network: z.literal("PI_MAIN"),
  declaredAmountPi: z.string().regex(/^\d+(\.\d+)?$/),
  userNote: z.string().trim().max(512).optional(),
});

/** USDT via Binance address; Pi via super-admin receive address (manual review). */
export const depositIntentSchema = z.discriminatedUnion("asset", [
  depositUsdtIntent,
  depositPiIntent,
]);

export const depositConfirmSchema = z.object({
  txid: z.string().trim().min(8).max(512),
});

export const withdrawalSchema = z.discriminatedUnion("asset", [
  z.object({
    asset: z.literal("USDT"),
    network: networkEnum,
    address: z.string().trim().min(10).max(256),
    memo: z.string().trim().max(256).optional(),
    /** Net USDT to destination; platform fee is added on top (see `/api/config/withdraw-fees`). */
    amount: z.string().regex(/^\d+(\.\d+)?$/),
  }),
  z.object({
    asset: z.literal("PI"),
    network: z.literal("PI_MAIN"),
    address: z.string().trim().min(20).max(128),
    memo: z.string().trim().max(256).optional(),
    amount: z.string().regex(/^\d+(\.\d+)?$/),
  }),
]);

export const adminCompleteWithdrawalSchema = z.object({
  txid: z.string().trim().min(8).max(512),
  agentNote: z.string().trim().max(2000).optional(),
});

export const adminRejectWithdrawalSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const adminApproveDepositSchema = z.object({
  amount: z.string().regex(/^\d+(\.\d+)?$/),
  agentNote: z.string().trim().max(2000).optional(),
});

export const adminRejectDepositSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

const staffScopeZ = z.enum(["withdrawals", "groups", "p2p_disputes"]);

export const adminSetRoleSchema = z
  .object({
    role: z.enum(["user", "agent", "super_admin"]),
    /** When `role` is `agent`, optional explicit module list. Omit to leave unchanged. */
    staffScopes: z.array(staffScopeZ).nullable().optional(),
  })
  .strict();
