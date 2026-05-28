import { inArray, isNotNull } from "drizzle-orm";
import { canonicalFromBinanceNetwork } from "@/lib/networks";
import { binanceDepositIsSuccessful, binanceRecentDepositHistory } from "@/lib/binance";
import { applyConfirmedDeposit } from "@/lib/deposit-verify";
import { getDb, depositSessions, deposits, txidLedger } from "@/db";
import {
  depositAmountsMatch,
  listScannableSessions,
  markMatchedSession,
  markSessionsAmbiguous,
  setDepositStatusForSession,
  setSessionExpiredPendingScan,
} from "@/lib/wallet-deposit-sessions";

function sameAddr(a: string, b: string): boolean {
  const x = a.trim();
  const y = b.trim();
  if (x.startsWith("0x") || y.startsWith("0x")) return x.toLowerCase() === y.toLowerCase();
  return x === y;
}

type HistoryRow = Awaited<
  ReturnType<typeof binanceRecentDepositHistory>
>[number];

function sessionMatchesRow(
  s: {
    networkCanonical: string;
    sharedAddress: string;
    expectedAmount: string;
  },
  row: HistoryRow,
): boolean {
  if (!binanceDepositIsSuccessful(row)) return false;
  const netCanon = canonicalFromBinanceNetwork(row.coin, row.network);
  if (netCanon !== s.networkCanonical) return false;
  if (!sameAddr(row.address, s.sharedAddress)) return false;
  const amt = Number(row.amount);
  const expAmt = Number(s.expectedAmount);
  return depositAmountsMatch(amt, expAmt);
}

async function loadUsedTxids(): Promise<Set<string>> {
  const db = getDb();
  const used = new Set<string>();

  const ledger = await db
    .select({ txid: txidLedger.txidNorm })
    .from(txidLedger)
    .limit(5000);
  for (const r of ledger) {
    if (r.txid) used.add(r.txid.toLowerCase());
  }

  const matched = await db
    .select({ txid: depositSessions.matchedTxid })
    .from(depositSessions)
    .where(isNotNull(depositSessions.matchedTxid))
    .limit(5000);
  for (const r of matched) {
    if (r.txid) used.add(r.txid.toLowerCase());
  }

  return used;
}

export async function runDepositScanner(): Promise<{
  scanned: number;
  matched: number;
  ambiguous: number;
  expiredPending: number;
  failed: number;
}> {
  const db = getDb();
  const sessions = await listScannableSessions(200);
  const now = Date.now();
  const expiredPending: string[] = [];
  let matched = 0;
  let ambiguous = 0;
  let failed = 0;

  if (sessions.length === 0) {
    return { scanned: 0, matched: 0, ambiguous: 0, expiredPending: 0, failed: 0 };
  }

  const depositsById = new Map(
    (
      await db
        .select()
        .from(deposits)
        .where(
          inArray(
            deposits.id,
            sessions.map((s) => s.depositId).filter((x): x is string => Boolean(x)),
          ),
        )
    ).map((d) => [d.id, d]),
  );

  const usedTxids = await loadUsedTxids();
  const flaggedAmbiguousTxids = new Set<string>();

  const history = await binanceRecentDepositHistory({
    coin: "USDT",
    startTimeMs: now - 24 * 3600_000,
    endTimeMs: now + 5 * 60_000,
    limit: 1000,
  });

  for (const row of history) {
    if (!binanceDepositIsSuccessful(row)) continue;
    const txidRaw = row.txId?.trim();
    if (!txidRaw || txidRaw.length < 8) continue;
    const txid = txidRaw.toLowerCase();
    if (usedTxids.has(txid) || flaggedAmbiguousTxids.has(txid)) continue;

    const candidates = sessions.filter((s) => sessionMatchesRow(s, row));
    if (candidates.length === 0) continue;

    if (candidates.length > 1) {
      await markSessionsAmbiguous({
        sessionIds: candidates.map((c) => c.id),
        txid,
        onChainAmount: String(row.amount),
        network: row.network,
      });
      flaggedAmbiguousTxids.add(txid);
      ambiguous += candidates.length;
      continue;
    }

    const s = candidates[0]!;
    if (!s.depositId) continue;
    const dep = depositsById.get(s.depositId);
    if (!dep || dep.asset !== "USDT" || dep.provider !== "binance") continue;

    try {
      await applyConfirmedDeposit({
        deposit: dep,
        userId: dep.userId,
        txidNorm: txid,
        amountStr: String(row.amount),
      });
      await markMatchedSession({
        sessionId: s.id,
        txid,
        matchMeta: {
          network: row.network,
          rawAmount: row.amount,
          matchedAt: new Date().toISOString(),
        },
      });
      usedTxids.add(txid);
      matched++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("already used")) {
        usedTxids.add(txid);
        continue;
      }
      failed++;
      await setDepositStatusForSession(s.id, "FAILED");
    }
  }

  for (const s of sessions) {
    if (new Date(s.graceUntil).getTime() <= now) {
      const dep = s.depositId ? depositsById.get(s.depositId) : null;
      if (dep?.status === "CONFIRMED") continue;
      expiredPending.push(s.id);
    }
  }

  await setSessionExpiredPendingScan(expiredPending);
  for (const id of expiredPending) {
    await setDepositStatusForSession(id, "EXPIRED_PENDING_SCAN");
  }

  return {
    scanned: sessions.length,
    matched,
    ambiguous,
    expiredPending: expiredPending.length,
    failed,
  };
}
