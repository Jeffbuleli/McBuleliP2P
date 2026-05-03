import { z } from "zod";
import type { CexId } from "./networks";

const email = z.string().trim().min(3).max(255).email();

export const registerSchema = z.object({
  email: email,
  password: z.string().min(8).max(128),
});

export const loginSchema = registerSchema;

const cex: z.ZodType<CexId> = z.union([z.literal("binance"), z.literal("okx")]);

const networkEnum = z.enum(["TRC20", "ERC20", "BEP20"]);

export const depositIntentSchema = z.object({
  provider: cex,
  asset: z.literal("USDT"),
  network: networkEnum,
});

export const depositConfirmSchema = z.object({
  txid: z.string().trim().min(8).max(512),
});

export const withdrawalSchema = z.object({
  asset: z.literal("USDT"),
  network: networkEnum,
  address: z.string().trim().min(10).max(256),
  memo: z.string().trim().max(256).optional(),
  amount: z.string().regex(/^\d+(\.\d+)?$/),
});

export const adminCompleteWithdrawalSchema = z.object({
  txid: z.string().trim().min(8).max(512),
  agentNote: z.string().trim().max(2000).optional(),
});

export const adminRejectWithdrawalSchema = z.object({
  reason: z.string().trim().min(3).max(1000),
});

export const adminSetRoleSchema = z.object({
  role: z.enum(["user", "agent", "super_admin"]),
});
