import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { depositSessions, deposits, getDb } from "@/db";
import { fmtWalletAmount } from "@/lib/wallet-types";
import {
  walletDepositGraceMinutes,
  walletDepositSessionMinutes,
} from "@/lib/usdt-wallet-features";
import { DepositStatus } from "@/lib/status";
import { notifyStaffWithdrawalsScope } from "@/lib/staff-notifications";

const OPEN_SLOT_STATUSES = ["ACTIVE", "EXPIRED"] as const;
const ALLOCATE_MAX_ATTEMPTS = 48;

/** USDT amount equality at 6 decimals (Binance display precision). */
export function depositAmountsMatch(onChain: number, expected: number): boolean {
  if (!Number.isFinite(onChain) || !Number.isFinite(expected)) return false;
  const scale = 1_000_000;
  return Math.round(onChain * scale) === Math.round(expected * scale);
}

/** Random offset 0.000001–0.009999 USDT (9999 slots). */
export function randomDepositOffset(): number {
  return (Math.floor(Math.random() * 9999) + 1) / 1_000_000;
}

function isPgUniqueViolation(e: unknown, constraint?: string): boolean {
  const info = e as { code?: string; constraint?: string };
  if (info?.code !== "23505") return false;
  if (constraint && info.constraint !== constraint) return false;
  return true;
}

export async function isOpenDepositAmountSlotTaken(args: {
  networkCanonical: string;
  sharedAddress: string;
  expectedAmount: string;
}): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: depositSessions.id })
    .from(depositSessions)
    .where(
      and(
        eq(depositSessions.networkCanonical, args.networkCanonical),
        eq(depositSessions.sharedAddress, args.sharedAddress),
        eq(depositSessions.expectedAmount, args.expectedAmount),
        inArray(depositSessions.status, [...OPEN_SLOT_STATUSES]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Pick a unique payable amount for this network + shared deposit address. */
export async function allocateUniqueExpectedAmount(args: {
  declared: number;
  networkCanonical: string;
  sharedAddress: string;
}): Promise<string> {
  for (let i = 0; i < ALLOCATE_MAX_ATTEMPTS; i++) {
    const expectedAmount = fmtWalletAmount(args.declared + randomDepositOffset());
    const taken = await isOpenDepositAmountSlotTaken({
      networkCanonical: args.networkCanonical,
      sharedAddress: args.sharedAddress,
      expectedAmount,
    });
    if (!taken) return expectedAmount;
  }
  throw new Error("deposit_amount_slot_exhausted");
}

export async function createDepositSession(args: {
  userId: string;
  depositId: string;
  networkCanonical: string;
  sharedAddress: string;
  memoShown?: string | null;
  declaredAmount: number;
}): Promise<{ id: string; expiresAt: string; graceUntil: string; expectedAmount: string }> {
  const db = getDb();
  const now = Date.now();
  const expiresAt = new Date(now + walletDepositSessionMinutes() * 60_000);
  const graceUntil = new Date(now + walletDepositGraceMinutes() * 60_000);

  let lastErr: unknown;
  for (let attempt = 0; attempt < ALLOCATE_MAX_ATTEMPTS; attempt++) {
    const expectedAmount = await allocateUniqueExpectedAmount({
      declared: args.declaredAmount,
      networkCanonical: args.networkCanonical,
      sharedAddress: args.sharedAddress,
    });

    try {
      const [row] = await db
        .insert(depositSessions)
        .values({
          userId: args.userId,
          depositId: args.depositId,
          asset: "USDT",
          networkCanonical: args.networkCanonical,
          sharedAddress: args.sharedAddress,
          memoShown: args.memoShown ?? null,
          expectedAmount,
          declaredAmount: fmtWalletAmount(args.declaredAmount),
          status: "ACTIVE",
          expiresAt,
          graceUntil,
        })
        .returning({
          id: depositSessions.id,
          expiresAt: depositSessions.expiresAt,
          graceUntil: depositSessions.graceUntil,
          expectedAmount: depositSessions.expectedAmount,
        });

      return {
        id: row.id,
        expiresAt: row.expiresAt.toISOString(),
        graceUntil: row.graceUntil.toISOString(),
        expectedAmount: String(row.expectedAmount),
      };
    } catch (e) {
      if (
        isPgUniqueViolation(e, "deposit_sessions_open_amount_slot_uidx") ||
        isPgUniqueViolation(e)
      ) {
        lastErr = e;
        continue;
      }
      throw e;
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error("deposit_amount_slot_exhausted");
}

export async function getSessionByDepositId(depositId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(depositSessions)
    .where(eq(depositSessions.depositId, depositId))
    .orderBy(asc(depositSessions.createdAt))
    .limit(1);
  return row ?? null;
}

export async function markExpiredSessionsNow(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .update(depositSessions)
    .set({ status: "EXPIRED", updatedAt: now })
    .where(
      and(
        eq(depositSessions.status, "ACTIVE"),
        lte(depositSessions.expiresAt, now),
      ),
    )
    .returning({ id: depositSessions.id });
  return rows.length;
}

export async function markMatchedSession(args: {
  sessionId: string;
  txid: string;
  matchMeta?: Record<string, unknown>;
}) {
  const db = getDb();
  await db
    .update(depositSessions)
    .set({
      status: "MATCHED",
      matchedTxid: args.txid,
      matchMeta: args.matchMeta ?? null,
      updatedAt: new Date(),
    })
    .where(eq(depositSessions.id, args.sessionId));
}

export async function markSessionsAmbiguous(args: {
  sessionIds: string[];
  txid: string;
  onChainAmount: string;
  network: string;
}): Promise<void> {
  if (!args.sessionIds.length) return;
  const db = getDb();
  const now = new Date();
  const meta = {
    reason: "amount_collision",
    txid: args.txid,
    onChainAmount: args.onChainAmount,
    network: args.network,
    flaggedAt: now.toISOString(),
    sessionIds: args.sessionIds,
  };

  await db
    .update(depositSessions)
    .set({
      status: "AMBIGUOUS",
      matchedTxid: args.txid,
      matchMeta: meta,
      updatedAt: now,
    })
    .where(inArray(depositSessions.id, args.sessionIds));

  const sessions = await db
    .select({ depositId: depositSessions.depositId })
    .from(depositSessions)
    .where(inArray(depositSessions.id, args.sessionIds));

  const depositIds = sessions
    .map((s) => s.depositId)
    .filter((id): id is string => Boolean(id));

  if (depositIds.length) {
    await db
      .update(deposits)
      .set({
        status: DepositStatus.PENDING_VALIDATION,
        failureReason: "deposit_amount_ambiguous",
      })
      .where(inArray(deposits.id, depositIds));
  }

  await notifyStaffWithdrawalsScope({
    kind: "admin_deposit_review",
    payload: {
      reason: "deposit_amount_ambiguous",
      txid: args.txid,
      amount: args.onChainAmount,
      network: args.network,
      sessionIds: args.sessionIds,
      depositIds,
    },
  });
}

export async function listScannableSessions(limit = 200) {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      id: depositSessions.id,
      userId: depositSessions.userId,
      depositId: depositSessions.depositId,
      networkCanonical: depositSessions.networkCanonical,
      sharedAddress: depositSessions.sharedAddress,
      expectedAmount: depositSessions.expectedAmount,
      declaredAmount: depositSessions.declaredAmount,
      status: depositSessions.status,
      expiresAt: depositSessions.expiresAt,
      graceUntil: depositSessions.graceUntil,
    })
    .from(depositSessions)
    .where(
      and(
        inArray(depositSessions.status, [...OPEN_SLOT_STATUSES]),
        lte(sql`${depositSessions.createdAt}`, now),
      ),
    )
    .orderBy(asc(depositSessions.createdAt))
    .limit(limit);
  return rows;
}

export async function setSessionScanFailed(sessionId: string, reason: string) {
  const db = getDb();
  await db
    .update(depositSessions)
    .set({
      status: "FAILED",
      matchMeta: { reason },
      updatedAt: new Date(),
    })
    .where(eq(depositSessions.id, sessionId));
}

export async function setSessionExpiredPendingScan(sessionIds: string[]) {
  if (!sessionIds.length) return;
  const db = getDb();
  await db
    .update(depositSessions)
    .set({ status: "EXPIRED_PENDING_SCAN", updatedAt: new Date() })
    .where(inArray(depositSessions.id, sessionIds));
}

export async function setDepositStatusForSession(
  sessionId: string,
  status: "EXPIRED_PENDING_SCAN" | "PENDING_VALIDATION" | "FAILED",
) {
  const db = getDb();
  const [s] = await db
    .select({ depositId: depositSessions.depositId })
    .from(depositSessions)
    .where(eq(depositSessions.id, sessionId))
    .limit(1);
  if (!s?.depositId) return;
  await db
    .update(deposits)
    .set({ status, failureReason: status === "FAILED" ? "deposit_session_failed" : null })
    .where(eq(deposits.id, s.depositId));
}
