import { and, asc, desc, eq, gt, gte, inArray, isNull, lte, or, sql, isNotNull } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import {
  getDb,
  p2pAds,
  p2pDisputeEvidence,
  p2pPaymentMethodDefs,
  p2pOrderMessages,
  p2pOrderPaymentProofs,
  p2pOrderRatings,
  p2pOrders,
  userP2pPaymentMethods,
  users,
} from "@/db";
import { moderateP2pChatText } from "@/lib/p2p-chat-moderation";
import { p2pLegalDisplayName } from "@/lib/p2p-name-match";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import {
  isAllowedP2pQuoteFiat,
  isP2pCryptoQuoteCurrency,
  minCryptoForAsset,
  paymentWindowMinutes,
  p2pExpiryReminderLeadMinutes,
  p2pReleaseWindowMinutes,
  p2pReleaseReminderLeadMinutes,
  p2pAllowedQuoteFiats,
  p2pFeeBpsConfigured,
  p2pBoostDurationDays,
  p2pBoostFeeUsdt,
  p2pCryptoQuotePairsEnabled,
  p2pDisputeResponseHours,
  p2pListingFeeAmount,
  p2pListingFeeAsset,
  p2pMaxDisputeEvidenceFiles,
  p2pMaxOrdersPerUserPerDay,
  p2pQuoteFiatRestrictionEnabled,
  type P2pAdStatus,
  type P2pCryptoAsset,
  type P2pOrderStatus,
  type P2pSide,
} from "@/lib/p2p-config";
import { fmtWalletAmount, numFromNumeric, type WalletAsset } from "@/lib/wallet-types";
import { maskTraderEmail, p2pDisplayName } from "@/lib/p2p-display";
import { isKycApproved } from "@/lib/kyc-policy";
import { effectiveP2pCountryCode } from "@/lib/p2p-country-code";
import {
  adMatchesPaymentKind,
  type P2pMarketView,
  type P2pPaymentKindFilter,
} from "@/lib/p2p-market-view";
import { sortP2pMarketAds, type P2pMarketSort } from "@/lib/p2p-market-sort";
import {
  isP2pVerifiedMerchant,
  isP2pUserOnline,
  loadP2pLastActiveMap,
  loadSellerReleaseMedianMap,
} from "@/lib/p2p-merchant-service";
import { getP2pCatalogMethodLabel } from "@/lib/p2p-payment-method-catalog";
import {
  fetchOrderNotifyCtx,
  notifyP2pDisputeRefunded,
  notifyP2pDisputeReleased,
  notifyP2pOrderCancelled,
  notifyP2pOrderCreated,
  notifyP2pOrderDisputed,
  notifyP2pOrderExpired,
  notifyP2pOrderExpiring,
  notifyP2pReleaseReminder,
  notifyP2pOrderAutoReleased,
  notifyP2pOrderMessage,
  notifyP2pOrderPaid,
  notifyP2pOrderProof,
  notifyP2pOrderReleased,
  notifyP2pSupportMessage,
} from "@/lib/p2p-notifications";

const AD_ACTIVE = "active";
const AD_PAUSED = "paused";
const AD_CLOSED = "closed";

const ST_AWAIT = "awaiting_payment";
const ST_PAID = "paid";
const ST_RELEASED = "released";
const ST_CANCELLED = "cancelled";
const ST_EXPIRED = "expired";
const ST_DISPUTED = "disputed";
const ST_REFUNDED = "refunded";

function numericAdd(a: string, b: string): string {
  const x = Number(a);
  const y = Number(b);
  if (!Number.isFinite(x) || !Number.isFinite(y)) return a;
  return fmtWalletAmount(x + y);
}

async function buildPaymentSnapshot(args: {
  tx: any;
  sellerUserId: string;
  countryCode: string | null;
  paymentMethodCodes: string[] | null;
  legacyPaymentMethods: string;
  onlyCode?: string | null;
}): Promise<string> {
  let codes = args.paymentMethodCodes?.map((c) => c.trim().toUpperCase()).filter(Boolean) ?? [];
  const only = args.onlyCode?.trim().toUpperCase();
  if (only) {
    if (codes.length && !codes.includes(only)) {
      throw new Error("p2p_payment_method_invalid");
    }
    codes = codes.length ? [only] : [only];
  }
  if (!codes.length) return args.legacyPaymentMethods;

  const cc = effectiveP2pCountryCode(args.countryCode);
  const defs = await args.tx
    .select({
      code: p2pPaymentMethodDefs.code,
      label: p2pPaymentMethodDefs.label,
    })
    .from(p2pPaymentMethodDefs)
    .where(
      and(
        eq(p2pPaymentMethodDefs.countryCode, cc),
        inArray(p2pPaymentMethodDefs.code, codes),
      ),
    );
  const labelByCode = new Map(defs.map((d: any) => [String(d.code), String(d.label)]));

  const mine = await args.tx
    .select({
      methodCode: userP2pPaymentMethods.methodCode,
      accountName: userP2pPaymentMethods.accountName,
      accountNumberOrPhone: userP2pPaymentMethods.accountNumberOrPhone,
      extra: userP2pPaymentMethods.extra,
      active: userP2pPaymentMethods.active,
    })
    .from(userP2pPaymentMethods)
    .where(
      and(
        eq(userP2pPaymentMethods.userId, args.sellerUserId),
        eq(userP2pPaymentMethods.countryCode, cc),
        inArray(userP2pPaymentMethods.methodCode, codes),
        eq(userP2pPaymentMethods.active, true),
      ),
    );

  const lines: string[] = [];
  for (const c of codes) {
    const label = labelByCode.get(c) ?? getP2pCatalogMethodLabel(cc, c) ?? c;
    const hits = mine.filter((m: any) => m.methodCode === c);
    if (!hits.length) continue;
    for (const h of hits) {
      const ex = (h.extra ?? {}) as Record<string, string>;
      const bankBits = [ex.bankName, ex.iban, ex.swift].filter(Boolean).join(" · ");
      const detail = bankBits
        ? `${h.accountName} · ${bankBits}`
        : `${h.accountName} · ${h.accountNumberOrPhone}`;
      lines.push(`${label}: ${detail}`);
    }
  }

  return lines.length ? lines.join("\n") : args.legacyPaymentMethods;
}

/** Escrow → buyer (minus optional platform fee to treasury). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function finalizeReleaseToBuyer(tx: any, o: typeof p2pOrders.$inferSelect, now: Date, previousStatus: string) {
  const gross = Number(o.cryptoAmount);
  if (!Number.isFinite(gross) || gross <= 0) {
    throw new Error("p2p_invalid_amount");
  }

  const bps = p2pFeeBpsConfigured();
  const treasuryEnv = process.env.P2P_FEE_TREASURY_USER_ID?.trim();
  let feeCrypto = 0;
  let netToBuyer = gross;

  if (bps > 0 && treasuryEnv) {
    const [treasuryRow] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, treasuryEnv))
      .limit(1);
    if (treasuryRow) {
      feeCrypto = gross * (bps / 10_000);
      const { applyP2pFeeDiscountInTx } = await import("@/lib/reward-point-perks");
      feeCrypto = await applyP2pFeeDiscountInTx(
        tx,
        o.buyerUserId,
        o.id,
        feeCrypto,
      );
      netToBuyer = gross - feeCrypto;
      if (netToBuyer <= 1e-18 || feeCrypto + 1e-18 >= gross) {
        feeCrypto = 0;
        netToBuyer = gross;
      }
    }
  }

  const netStr = fmtWalletAmount(netToBuyer);
  const feeStr = fmtWalletAmount(feeCrypto);
  const asset = asWalletCrypto(o.asset);
  const batchId = randomUUID();

  await creditUserAsset(tx, o.buyerUserId, asset, netStr);

  const rows: {
    batchId: string;
    userId: string;
    entryType: string;
    asset: string;
    amount: string;
    feeUsdEquivalent: string;
    counterpartyUserId?: string | null;
    meta?: Record<string, unknown> | null;
  }[] = [
    {
      batchId,
      userId: o.buyerUserId,
      entryType: "p2p_release",
      asset: o.asset,
      amount: netStr,
      feeUsdEquivalent: "0",
      counterpartyUserId: o.sellerUserId,
      meta: {
        orderId: o.id,
        grossCrypto: o.cryptoAmount.toString(),
        feeCrypto: feeCrypto > 0 ? feeStr : "0",
        netToBuyer: netStr,
      },
    },
  ];

  if (feeCrypto > 1e-24 && treasuryEnv) {
    await creditUserAsset(tx, treasuryEnv, asset, feeStr);
    rows.push({
      batchId,
      userId: treasuryEnv,
      entryType: "p2p_platform_fee",
      asset: o.asset,
      amount: feeStr,
      feeUsdEquivalent: "0",
      counterpartyUserId: o.buyerUserId,
      meta: { orderId: o.id },
    });
  }

  await insertWalletLedgerLines(tx, rows);

  const [upd] = await tx
    .update(p2pOrders)
    .set({
      status: ST_RELEASED,
      releasedAt: now,
      updatedAt: now,
      platformFeeCrypto: feeCrypto > 1e-24 ? feeStr : null,
      buyerReceivedCrypto: netStr,
    })
    .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, previousStatus)))
    .returning({ id: p2pOrders.id });

  if (!upd) {
    throw new Error("p2p_action_not_allowed");
  }
}

function asWalletCrypto(asset: string): WalletAsset {
  return asset === "PI" ? "PI" : "USDT";
}

function asQuoteWalletAsset(code: string): WalletAsset | null {
  const c = code.trim().toUpperCase();
  if (c === "USDT") return "USDT";
  if (c === "PI") return "PI";
  return null;
}

export function tradeRoles(args: {
  side: P2pSide;
  makerId: string;
  takerId: string;
}): { sellerUserId: string; buyerUserId: string; payerUserId: string } {
  if (args.side === "sell") {
    return {
      sellerUserId: args.makerId,
      buyerUserId: args.takerId,
      payerUserId: args.takerId,
    };
  }
  return {
    sellerUserId: args.takerId,
    buyerUserId: args.makerId,
    payerUserId: args.makerId,
  };
}

export async function processExpiredP2pOrders(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const expired = await db
    .select()
    .from(p2pOrders)
    .where(and(eq(p2pOrders.status, ST_AWAIT), lte(p2pOrders.expiresAt, now)));

  for (const o of expired) {
    await db.transaction(async (tx) => {
      const [cur] = await tx
        .select({ o: p2pOrders, ad: p2pAds })
        .from(p2pOrders)
        .innerJoin(p2pAds, eq(p2pOrders.adId, p2pAds.id))
        .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, ST_AWAIT)))
        .limit(1);
      if (!cur) return;

      const sellerId = cur.o.sellerUserId;
      const cryptoStr = cur.o.cryptoAmount.toString();
      const asset = asWalletCrypto(cur.o.asset);
      const batchId = randomUUID();

      const usesReserve =
        (cur.ad.side as P2pSide) === "sell" &&
        cur.ad.reserveRemainingCrypto != null &&
        cur.ad.reserveTotalCrypto != null;
      if (usesReserve) {
        const next = numericAdd(String(cur.ad.reserveRemainingCrypto), cryptoStr);
        await tx
          .update(p2pAds)
          .set({ reserveRemainingCrypto: next, updatedAt: now })
          .where(eq(p2pAds.id, cur.ad.id));
      } else {
        await creditUserAsset(tx, sellerId, asset, cryptoStr);
      }

      await tx
        .update(p2pOrders)
        .set({
          status: ST_EXPIRED,
          cancelledAt: now,
          updatedAt: now,
        })
        .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, ST_AWAIT)));

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: sellerId,
          entryType: "p2p_escrow_refund",
          asset: cur.o.asset,
          amount: cryptoStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: cur.o.buyerUserId,
          meta: { orderId: o.id, reason: usesReserve ? "expired_replenish_reserve" : "expired" },
        },
      ]);
    });
    const ctx = await fetchOrderNotifyCtx(o.id);
    if (ctx) void notifyP2pOrderExpired(ctx);
  }

  // Best-effort purge of old proof attachments for closed orders.
  await purgeClosedP2pPaymentProofs();
  return expired.length;
}

/** Warn payers before the payment window closes (cron-driven). */
export async function processExpiringP2pOrderReminders(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const leadMs = p2pExpiryReminderLeadMinutes() * 60 * 1000;
  const horizon = new Date(now.getTime() + leadMs);

  const due = await db
    .select({ id: p2pOrders.id })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_AWAIT),
        gt(p2pOrders.expiresAt, now),
        lte(p2pOrders.expiresAt, horizon),
        isNull(p2pOrders.expiryReminderSentAt),
      ),
    );

  let sent = 0;
  for (const row of due) {
    const marked = await db
      .update(p2pOrders)
      .set({ expiryReminderSentAt: now, updatedAt: now })
      .where(
        and(
          eq(p2pOrders.id, row.id),
          eq(p2pOrders.status, ST_AWAIT),
          isNull(p2pOrders.expiryReminderSentAt),
        ),
      )
      .returning({ id: p2pOrders.id });
    if (marked.length === 0) continue;
    const ctx = await fetchOrderNotifyCtx(row.id);
    if (ctx) {
      void notifyP2pOrderExpiring(ctx);
      sent += 1;
    }
  }
  return sent;
}

/** Remind sellers before crypto auto-releases to the buyer. */
export async function processP2pReleaseReminders(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const leadMs = p2pReleaseReminderLeadMinutes() * 60 * 1000;
  const horizon = new Date(now.getTime() + leadMs);

  const due = await db
    .select({ id: p2pOrders.id })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_PAID),
        isNotNull(p2pOrders.autoReleaseAt),
        gt(p2pOrders.autoReleaseAt, now),
        lte(p2pOrders.autoReleaseAt, horizon),
        isNull(p2pOrders.releaseReminderSentAt),
      ),
    );

  let sent = 0;
  for (const row of due) {
    const marked = await db
      .update(p2pOrders)
      .set({ releaseReminderSentAt: now, updatedAt: now })
      .where(
        and(
          eq(p2pOrders.id, row.id),
          eq(p2pOrders.status, ST_PAID),
          isNull(p2pOrders.releaseReminderSentAt),
        ),
      )
      .returning({ id: p2pOrders.id });
    if (marked.length === 0) continue;
    const ctx = await fetchOrderNotifyCtx(row.id);
    if (ctx) {
      void notifyP2pReleaseReminder(ctx);
      sent += 1;
    }
  }
  return sent;
}

/** Auto-release escrowed crypto to buyer when seller does not release in time. */
export async function processAutoReleaseP2pOrders(): Promise<number> {
  const db = getDb();
  const now = new Date();

  const due = await db
    .select({ id: p2pOrders.id })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_PAID),
        isNotNull(p2pOrders.autoReleaseAt),
        lte(p2pOrders.autoReleaseAt, now),
      ),
    );

  let released = 0;
  for (const row of due) {
    try {
      await db.transaction(async (tx) => {
        const [o] = await tx
          .select()
          .from(p2pOrders)
          .where(and(eq(p2pOrders.id, row.id), eq(p2pOrders.status, ST_PAID)))
          .limit(1);
        if (!o?.autoReleaseAt || o.autoReleaseAt > now) return;
        await finalizeReleaseToBuyer(tx, o, now, ST_PAID);
      });
      const ctx = await fetchOrderNotifyCtx(row.id);
      if (ctx) {
        void notifyP2pOrderAutoReleased(ctx);
        void import("@/lib/reward-points-service").then(({ tryGrantP2pTradeCompletedPoints }) =>
          tryGrantP2pTradeCompletedPoints({
            userId: ctx.buyerUserId,
            orderId: row.id,
          }).catch((err) => {
            console.warn("[p2p] reward points grant skipped", err);
          }),
        );
      }
      released += 1;
    } catch (err) {
      console.warn("[p2p] auto-release failed", row.id, err);
    }
  }
  return released;
}

/** Paid-order automation — reminders + auto-release (cron + lazy fallback). */
export async function processP2pPaidOrderAutomation(): Promise<void> {
  await processP2pReleaseReminders();
  await processAutoReleaseP2pOrders();
}

function proofRetentionDays(): number {
  const n = Number(process.env.P2P_PROOF_RETENTION_DAYS ?? "7");
  return Number.isFinite(n) && n >= 0 && n <= 90 ? Math.floor(n) : 7;
}

async function purgeClosedP2pPaymentProofs(): Promise<void> {
  const days = proofRetentionDays();
  if (days === 0) return;
  const db = getDb();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Delete proof data after orders are definitely closed (released/refunded/cancelled/expired) and old enough.
  await db
    .update(p2pOrderPaymentProofs)
    .set({ dataUrl: "", deletedAt: new Date() })
    .where(
      and(
        sql`${p2pOrderPaymentProofs.deletedAt} is null`,
        lte(p2pOrderPaymentProofs.createdAt, cutoff),
        inArray(
          p2pOrderPaymentProofs.orderId,
          db
            .select({ id: p2pOrders.id })
            .from(p2pOrders)
            .where(
              and(
                inArray(p2pOrders.status, [
                  ST_RELEASED,
                  ST_CANCELLED,
                  ST_EXPIRED,
                  ST_REFUNDED,
                ]),
                lte(p2pOrders.updatedAt, cutoff),
              ),
            ),
        ),
      ),
    );
}

function normalizeP2pProofMime(mime: string, dataUrl: string): string | null {
  let m = mime.toLowerCase().replace("image/jpg", "image/jpeg");
  if (["image/jpeg", "image/png", "image/webp"].includes(m)) return m;
  const fromData = /^data:(image\/[a-z0-9.+-]+);/i.exec(dataUrl)?.[1]?.toLowerCase();
  if (fromData) {
    m = fromData.replace("image/jpg", "image/jpeg");
    if (["image/jpeg", "image/png", "image/webp"].includes(m)) return m;
    if (m.startsWith("image/")) return "image/jpeg";
  }
  return dataUrl.startsWith("data:image/") ? "image/jpeg" : null;
}

export async function upsertP2pPaymentProof(args: {
  orderId: string;
  userId: string;
  dataUrl: string;
  mime: string;
  sizeBytes: number;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const db = getDb();

  const [o] = await db
    .select({
      id: p2pOrders.id,
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
      payerUserId: p2pOrders.payerUserId,
      status: p2pOrders.status,
    })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };
  if (o.makerId !== args.userId && o.takerId !== args.userId) {
    return { ok: false, message: "p2p_order_not_found" };
  }
  if (o.payerUserId !== args.userId) {
    return { ok: false, message: "p2p_action_not_allowed" };
  }
  if (![ST_AWAIT, ST_PAID, ST_DISPUTED].includes(o.status)) {
    return { ok: false, message: "p2p_action_not_allowed" };
  }

  const dataUrl = args.dataUrl.trim();
  const mime = args.mime.trim().toLowerCase();
  const sizeBytes = Math.max(0, Math.floor(args.sizeBytes || 0));

  if (!dataUrl.startsWith("data:image/")) {
    return { ok: false, message: "p2p_proof_invalid" };
  }
  const mimeNorm = normalizeP2pProofMime(mime, dataUrl);
  if (!mimeNorm) {
    return { ok: false, message: "p2p_proof_invalid" };
  }
  const maxBytes = Number(process.env.P2P_PROOF_MAX_BYTES ?? "250000");
  const limit = Number.isFinite(maxBytes) && maxBytes > 50_000 ? Math.floor(maxBytes) : 250_000;
  if (sizeBytes <= 0 || sizeBytes > limit) {
    return { ok: false, message: "p2p_proof_too_large" };
  }

  // One proof per order (per payer) is enough; overwrite old.
  const [row] = await db
    .insert(p2pOrderPaymentProofs)
    .values({
      orderId: args.orderId,
      userId: args.userId,
      dataUrl,
      mime: mimeNorm,
      sizeBytes,
      deletedAt: null,
    })
    .onConflictDoUpdate({
      target: p2pOrderPaymentProofs.orderId,
      set: {
        dataUrl,
        mime: mimeNorm,
        sizeBytes,
        deletedAt: null,
        createdAt: new Date(),
      },
    })
    .returning({ id: p2pOrderPaymentProofs.id });

  if (!row) return { ok: false, message: "p2p_action_not_allowed" };
  const ctx = await fetchOrderNotifyCtx(args.orderId);
  if (ctx) void notifyP2pOrderProof(ctx);
  return { ok: true, id: row.id };
}

export async function getP2pPaymentProof(args: {
  orderId: string;
  userId: string;
}): Promise<
  | { ok: true; proof: { id: string; mime: string; sizeBytes: number; dataUrl: string | null } }
  | { ok: false; message: string }
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const [o] = await db
    .select({
      id: p2pOrders.id,
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
    })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };
  if (o.makerId !== args.userId && o.takerId !== args.userId) {
    return { ok: false, message: "p2p_order_not_found" };
  }

  const [p] = await db
    .select({
      id: p2pOrderPaymentProofs.id,
      mime: p2pOrderPaymentProofs.mime,
      sizeBytes: p2pOrderPaymentProofs.sizeBytes,
      dataUrl: p2pOrderPaymentProofs.dataUrl,
      deletedAt: p2pOrderPaymentProofs.deletedAt,
    })
    .from(p2pOrderPaymentProofs)
    .where(eq(p2pOrderPaymentProofs.orderId, args.orderId))
    .limit(1);

  if (!p) {
    return { ok: true, proof: { id: "", mime: "", sizeBytes: 0, dataUrl: null } };
  }
  return {
    ok: true,
    proof: {
      id: p.id,
      mime: p.mime,
      sizeBytes: p.sizeBytes,
      dataUrl: p.deletedAt ? null : p.dataUrl || null,
    },
  };
}

async function checkP2pOrderVelocity(
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const max = p2pMaxOrdersPerUserPerDay();
  if (max <= 0) return { ok: true };

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const db = getDb();
  const rows = await db
    .select({ id: p2pOrders.id })
    .from(p2pOrders)
    .where(and(eq(p2pOrders.takerId, userId), gte(p2pOrders.createdAt, since)));

  if (rows.length >= max) return { ok: false, message: "p2p_velocity_limit" };
  return { ok: true };
}

export async function addP2pDisputeEvidence(args: {
  orderId: string;
  userId: string;
  dataUrl: string;
  mime: string;
  sizeBytes: number;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const db = getDb();
  const [o] = await db
    .select({
      id: p2pOrders.id,
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
      status: p2pOrders.status,
    })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };
  if (o.makerId !== args.userId && o.takerId !== args.userId) {
    return { ok: false, message: "p2p_order_not_found" };
  }
  if (o.status !== ST_DISPUTED) return { ok: false, message: "p2p_action_not_allowed" };

  const dataUrl = args.dataUrl.trim();
  const mime = args.mime.trim().toLowerCase();
  const sizeBytes = Math.max(0, Math.floor(args.sizeBytes || 0));
  if (!dataUrl.startsWith("data:image/")) return { ok: false, message: "p2p_proof_invalid" };
  const mimeNorm = normalizeP2pProofMime(mime, dataUrl);
  if (!mimeNorm) return { ok: false, message: "p2p_proof_invalid" };
  const maxBytes = Number(process.env.P2P_PROOF_MAX_BYTES ?? "250000");
  const limit = Number.isFinite(maxBytes) && maxBytes > 50_000 ? Math.floor(maxBytes) : 250_000;
  if (sizeBytes <= 0 || sizeBytes > limit) return { ok: false, message: "p2p_proof_too_large" };

  const existing = await db
    .select({ id: p2pDisputeEvidence.id })
    .from(p2pDisputeEvidence)
    .where(eq(p2pDisputeEvidence.orderId, args.orderId));
  if (existing.length >= p2pMaxDisputeEvidenceFiles()) {
    return { ok: false, message: "p2p_dispute_evidence_max" };
  }

  const [row] = await db
    .insert(p2pDisputeEvidence)
    .values({
      orderId: args.orderId,
      userId: args.userId,
      dataUrl,
      mime: mimeNorm,
      sizeBytes,
    })
    .returning({ id: p2pDisputeEvidence.id });

  if (!row) return { ok: false, message: "p2p_action_not_allowed" };
  return { ok: true, id: row.id };
}

export async function listP2pDisputeEvidence(args: {
  orderId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      items: { id: string; mime: string; sizeBytes: number; dataUrl: string; createdAt: string }[];
    }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [o] = await db
    .select({ makerId: p2pOrders.makerId, takerId: p2pOrders.takerId })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };
  if (o.makerId !== args.userId && o.takerId !== args.userId) {
    return { ok: false, message: "p2p_order_not_found" };
  }

  const rows = await db
    .select()
    .from(p2pDisputeEvidence)
    .where(eq(p2pDisputeEvidence.orderId, args.orderId))
    .orderBy(asc(p2pDisputeEvidence.createdAt));

  return {
    ok: true,
    items: rows.map((r) => ({
      id: r.id,
      mime: r.mime,
      sizeBytes: r.sizeBytes,
      dataUrl: r.dataUrl,
      createdAt: r.createdAt.toISOString(),
    })),
  };
}

async function loadP2pTradeCountMap(userIds: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (!uniq.length) return out;

  const db = getDb();
  const rows = await db
    .select({
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
    })
    .from(p2pOrders)
    .where(
      and(
        eq(p2pOrders.status, ST_RELEASED),
        or(inArray(p2pOrders.makerId, uniq), inArray(p2pOrders.takerId, uniq)),
      ),
    );

  const set = new Set(uniq);
  for (const r of rows) {
    if (set.has(r.makerId)) out.set(r.makerId, (out.get(r.makerId) ?? 0) + 1);
    if (set.has(r.takerId)) out.set(r.takerId, (out.get(r.takerId) ?? 0) + 1);
  }
  return out;
}

async function loadReputationMap(
  userIds: string[],
): Promise<Map<string, { avg: number; count: number }>> {
  const out = new Map<string, { avg: number; count: number }>();
  const uniq = [...new Set(userIds)].filter(Boolean);
  if (uniq.length === 0) return out;

  const db = getDb();
  const agg = await db
    .select({
      uid: p2pOrderRatings.toUserId,
      avgStars: sql<number>`avg(${p2pOrderRatings.stars})::double precision`,
      cnt: sql<number>`count(*)::int`,
    })
    .from(p2pOrderRatings)
    .where(inArray(p2pOrderRatings.toUserId, uniq))
    .groupBy(p2pOrderRatings.toUserId);

  for (const row of agg) {
    out.set(row.uid, {
      avg: Number(row.avgStars),
      count: Number(row.cnt),
    });
  }
  return out;
}

export async function listMarketAds(filters: {
  asset?: P2pCryptoAsset;
  fiat?: string;
  side?: P2pSide;
  country?: string;
  paymentContains?: string;
  paymentKind?: P2pPaymentKindFilter;
  fiatQuotesOnly?: boolean;
  boostedOnly?: boolean;
  trustedOnly?: boolean;
  sort?: P2pMarketSort;
  marketView?: P2pMarketView;
}): Promise<
  {
    id: string;
    side: string;
    asset: string;
    fiatCurrency: string;
    price: string;
    minFiat: string;
    maxFiat: string;
    paymentMethods: string;
    paymentMethodCodes: string[] | null;
    terms: string | null;
    countryCode: string | null;
    createdAt: string;
    makerUserId: string;
    makerName: string;
    makerAvatarUrl: string | null;
    makerKycApproved: boolean;
    makerVerifiedMerchant: boolean;
    makerRating: { avg: number; count: number } | null;
    makerTradeCount: number;
    makerReleaseMedianMinutes: number | null;
    makerLastActiveAt: string | null;
    makerOnline: boolean;
    boostedUntil: string | null;
    boostAmountPi: string;
    reserveTotalCrypto: string | null;
    reserveRemainingCrypto: string | null;
  }[]
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const cond = [eq(p2pAds.status, AD_ACTIVE)];
  if (p2pQuoteFiatRestrictionEnabled()) {
    cond.push(inArray(p2pAds.fiatCurrency, p2pAllowedQuoteFiats()));
  }
  if (filters.asset) cond.push(eq(p2pAds.asset, filters.asset));
  if (filters.fiat) cond.push(eq(p2pAds.fiatCurrency, filters.fiat));
  if (filters.side) cond.push(eq(p2pAds.side, filters.side));
  if (filters.fiatQuotesOnly || !p2pCryptoQuotePairsEnabled()) {
    cond.push(sql`${p2pAds.fiatCurrency} not in ('USDT', 'PI')`);
  }
  if (filters.country) {
    cond.push(eq(p2pAds.countryCode, effectiveP2pCountryCode(filters.country)));
  }
  if (filters.boostedOnly) cond.push(sql`${p2pAds.boostedUntil} > now()`);
  if (filters.paymentContains?.trim()) {
    const q = `%${filters.paymentContains.trim().toLowerCase()}%`;
    cond.push(sql`lower(${p2pAds.paymentMethods}) like ${q}`);
  }

  const rows = await db
    .select({
      ad: p2pAds,
      u: {
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        piUsername: users.piUsername,
        kycStatus: users.kycStatus,
      },
    })
    .from(p2pAds)
    .innerJoin(users, eq(p2pAds.userId, users.id))
    .where(and(...cond))
    .orderBy(desc(p2pAds.createdAt));

  const userIds = rows.map((r) => r.ad.userId);
  const [rep, trades, lastActive, releaseMedian] = await Promise.all([
    loadReputationMap(userIds),
    loadP2pTradeCountMap(userIds),
    loadP2pLastActiveMap(userIds),
    loadSellerReleaseMedianMap(userIds),
  ]);

  const mapped = rows.map(({ ad, u }) => {
    const kycApproved = isKycApproved(u.kycStatus);
    const rating = rep.get(ad.userId) ?? null;
    const tradeCount = trades.get(ad.userId) ?? 0;
    const lastAt = lastActive.get(ad.userId) ?? null;
    return {
      id: ad.id,
      side: ad.side,
      asset: ad.asset,
      fiatCurrency: ad.fiatCurrency,
      price: ad.price.toString(),
      minFiat: ad.minFiat.toString(),
      maxFiat: ad.maxFiat.toString(),
      paymentMethods: ad.paymentMethods,
      paymentMethodCodes: (ad.paymentMethodCodes as string[] | null) ?? null,
      terms: ad.terms,
      countryCode: ad.countryCode,
      createdAt: ad.createdAt.toISOString(),
      makerUserId: ad.userId,
      makerName: p2pDisplayName(u),
      makerAvatarUrl: u.avatarUrl ?? null,
      makerKycApproved: kycApproved,
      makerVerifiedMerchant: isP2pVerifiedMerchant({
        kycApproved,
        ratingAvg: rating?.avg ?? 0,
        ratingCount: rating?.count ?? 0,
        completedTrades: tradeCount,
      }),
      makerRating: rating,
      makerTradeCount: tradeCount,
      makerReleaseMedianMinutes: releaseMedian.get(ad.userId) ?? null,
      makerLastActiveAt: lastAt,
      makerOnline: isP2pUserOnline(lastAt),
      boostedUntil: ad.boostedUntil ? ad.boostedUntil.toISOString() : null,
      boostAmountPi: ad.boostAmountPi.toString(),
      reserveTotalCrypto: ad.reserveTotalCrypto?.toString() ?? null,
      reserveRemainingCrypto: ad.reserveRemainingCrypto?.toString() ?? null,
    };
  });

  const kindFiltered =
    filters.paymentKind && filters.paymentKind !== "all"
      ? mapped.filter((a) =>
          adMatchesPaymentKind(a.paymentMethodCodes, a.paymentMethods, filters.paymentKind!),
        )
      : mapped;

  const trustedMinAvg = Number(process.env.P2P_TRUSTED_MIN_AVG ?? "4.5");
  const trustedMinCount = Number(process.env.P2P_TRUSTED_MIN_COUNT ?? "10");

  const filtered = filters.trustedOnly
    ? kindFiltered.filter((a) => {
        const r = a.makerRating;
        return (
          r != null &&
          Number.isFinite(r.avg) &&
          Number.isFinite(r.count) &&
          r.avg >= trustedMinAvg &&
          r.count >= trustedMinCount
        );
      })
    : kindFiltered;

  const sort = filters.sort ?? "default";
  const marketView: P2pMarketView =
    filters.marketView ??
    (filters.side === "sell" ? "buy" : filters.side === "buy" ? "sell" : "buy");

  return sortP2pMarketAds(filtered, sort, marketView);
}

export async function getAdForTaker(args: {
  adId: string;
  takerId: string;
}): Promise<
  | {
      ok: true;
      ad: {
        id: string;
        side: P2pSide;
        asset: string;
        fiatCurrency: string;
        price: string;
        minFiat: string;
        maxFiat: string;
        paymentMethods: string;
        paymentOptions: { code: string; label: string }[];
        terms: string | null;
        countryCode: string | null;
        makerName: string;
        makerUserId: string;
        makerAvatarUrl: string | null;
        makerKycApproved: boolean;
        makerRating: { avg: number; count: number } | null;
        makerTradeCount: number;
        reserveTotalCrypto: string | null;
        reserveRemainingCrypto: string | null;
      };
    }
  | { ok: false; message: string }
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const [row] = await db
    .select({
      ad: p2pAds,
      u: {
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        piUsername: users.piUsername,
        kycStatus: users.kycStatus,
      },
    })
    .from(p2pAds)
    .innerJoin(users, eq(p2pAds.userId, users.id))
    .where(eq(p2pAds.id, args.adId))
    .limit(1);

  if (!row) return { ok: false, message: "p2p_ad_not_found" };
  if (row.ad.status !== AD_ACTIVE) return { ok: false, message: "p2p_ad_inactive" };
  if (!isAllowedP2pQuoteFiat(String(row.ad.fiatCurrency))) {
    return { ok: false, message: "p2p_ad_inactive" };
  }
  if (row.ad.userId === args.takerId) {
    return { ok: false, message: "p2p_cannot_trade_own_ad" };
  }

  const rep = await loadReputationMap([row.ad.userId]);
  const trades = await loadP2pTradeCountMap([row.ad.userId]);
  const cc = effectiveP2pCountryCode(row.ad.countryCode);
  const codes =
    (row.ad.paymentMethodCodes as string[] | null)?.map((c) => c.trim().toUpperCase()).filter(Boolean) ??
    [];
  const paymentOptions = codes.map((code) => ({
    code,
    label: getP2pCatalogMethodLabel(cc, code) ?? code,
  }));

  return {
    ok: true,
    ad: {
      id: row.ad.id,
      side: row.ad.side as P2pSide,
      asset: row.ad.asset,
      fiatCurrency: row.ad.fiatCurrency,
      price: row.ad.price.toString(),
      minFiat: row.ad.minFiat.toString(),
      maxFiat: row.ad.maxFiat.toString(),
      paymentMethods: row.ad.paymentMethods,
      paymentOptions,
      terms: row.ad.terms,
      countryCode: row.ad.countryCode,
      makerName: p2pDisplayName(row.u),
      makerUserId: row.ad.userId,
      makerAvatarUrl: row.u.avatarUrl ?? null,
      makerKycApproved: isKycApproved(row.u.kycStatus),
      makerRating: rep.get(row.ad.userId) ?? null,
      makerTradeCount: trades.get(row.ad.userId) ?? 0,
      reserveTotalCrypto: row.ad.reserveTotalCrypto?.toString() ?? null,
      reserveRemainingCrypto: row.ad.reserveRemainingCrypto?.toString() ?? null,
    },
  };
}

export async function listUserAds(userId: string) {
  await processExpiredP2pOrders();
  const db = getDb();
  const rows = await db
    .select()
    .from(p2pAds)
    .where(eq(p2pAds.userId, userId))
    .orderBy(desc(p2pAds.createdAt));
  return rows.map((ad) => ({
    id: ad.id,
    side: ad.side,
    asset: ad.asset,
    fiatCurrency: ad.fiatCurrency,
    price: ad.price.toString(),
    minFiat: ad.minFiat.toString(),
    maxFiat: ad.maxFiat.toString(),
    paymentMethods: ad.paymentMethods,
    terms: ad.terms,
    countryCode: ad.countryCode,
    status: ad.status as P2pAdStatus,
    boostedUntil: ad.boostedUntil ? ad.boostedUntil.toISOString() : null,
    boostAmountPi: ad.boostAmountPi.toString(),
    createdAt: ad.createdAt.toISOString(),
  }));
}

export async function createAd(args: {
  userId: string;
  side: P2pSide;
  asset: P2pCryptoAsset;
  fiatCurrency: string;
  priceStr: string;
  minFiatStr: string;
  maxFiatStr: string;
  paymentMethods: string;
  paymentMethodCodes?: string[] | null;
  reserveAmountCryptoStr?: string | null;
  terms?: string;
  countryCode?: string | null;
}): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  const price = Number(args.priceStr);
  const minF = Number(args.minFiatStr);
  const maxF = Number(args.maxFiatStr);
  if (!Number.isFinite(price) || price <= 0) return { ok: false, message: "p2p_invalid_price" };
  if (!Number.isFinite(minF) || !Number.isFinite(maxF) || minF <= 0 || maxF < minF) {
    return { ok: false, message: "p2p_invalid_limits" };
  }
  if (!isAllowedP2pQuoteFiat(args.fiatCurrency)) {
    return { ok: false, message: "p2p_quote_fiat_not_allowed" };
  }
  const isCryptoQuote = isP2pCryptoQuoteCurrency(args.fiatCurrency);
  if (isCryptoQuote && !p2pCryptoQuotePairsEnabled()) {
    return { ok: false, message: "p2p_crypto_pairs_disabled" };
  }
  if (args.side === "buy" && isCryptoQuote) {
    return { ok: false, message: "p2p_buy_ad_fiat_only" };
  }
  const minCryptoOrder = minF / price;
  const platMinCrypto = minCryptoForAsset(args.asset);
  if (minCryptoOrder + 1e-12 < platMinCrypto) {
    return { ok: false, message: "p2p_min_below_platform" };
  }
  const pm = args.paymentMethods.trim();
  if (!isCryptoQuote && pm.length < 3) {
    return { ok: false, message: "p2p_payment_methods_required" };
  }

  const listingFee = fmtWalletAmount(p2pListingFeeAmount());
  const listingFeeNum = Number(listingFee);
  if (listingFeeNum > 0) {
    const dbCheck = getDb();
    const [urow] = await dbCheck
      .select({ balance: users.balance })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    if (!urow) return { ok: false, message: "wallet_not_found" };
    const feeBal = numFromNumeric(String(urow.balance));
    if (feeBal + 1e-18 < listingFeeNum) {
      return { ok: false, message: "p2p_listing_fee_insufficient" };
    }
  }

  if (args.side === "sell") {
    const db = getDb();
    const [urow] = await db
      .select({
        balance: users.balance,
        piBalance: users.piBalance,
      })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    if (!urow) return { ok: false, message: "wallet_not_found" };
    const wa = asWalletCrypto(args.asset);
    const bal =
      wa === "USDT"
        ? numFromNumeric(String(urow.balance))
        : numFromNumeric(String(urow.piBalance));
    const maxCryptoNeeded = maxF / price;
    const needStr = fmtWalletAmount(maxCryptoNeeded);
    const need = Number(needStr);
    if (!Number.isFinite(need) || need <= 0) {
      return { ok: false, message: "p2p_invalid_limits" };
    }
    if (bal + 1e-18 < need) {
      return { ok: false, message: "p2p_sell_insufficient_balance" };
    }
  }

  const db = getDb();
  const [prof] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);
  const adCountryCode = args.countryCode?.trim()
    ? effectiveP2pCountryCode(args.countryCode)
    : effectiveP2pCountryCode(prof?.countryCode ?? null);

  const now = new Date();
  try {
    const [row] = await db.transaction(async (tx) => {
      if (listingFeeNum > 0) {
        const feeAsset = asWalletCrypto(p2pListingFeeAsset());
        await debitUserAsset(tx, args.userId, feeAsset, listingFee);
        await insertWalletLedgerLines(tx, [
          {
            batchId: randomUUID(),
            userId: args.userId,
            entryType: "p2p_listing_fee",
            asset: p2pListingFeeAsset(),
            amount: `-${listingFee}`,
            feeUsdEquivalent: listingFee,
            meta: { side: args.side, fiatCurrency: args.fiatCurrency },
          },
        ]);
      }

      let reserveTotal: string | null = null;
      let reserveRemaining: string | null = null;

      if (args.side === "sell") {
        const reserve = Number(fmtWalletAmount(maxF / price));
        if (!Number.isFinite(reserve) || reserve <= 0) {
          throw new Error("p2p_invalid_limits");
        }
        reserveTotal = fmtWalletAmount(reserve);
        reserveRemaining = reserveTotal;

        // Lock reserve from wallet now.
        const wa = asWalletCrypto(args.asset);
        await debitUserAsset(tx, args.userId, wa, reserveTotal);
        await insertWalletLedgerLines(tx, [
          {
            batchId: randomUUID(),
            userId: args.userId,
            entryType: "p2p_ad_reserve_lock",
            asset: args.asset,
            amount: `-${reserveTotal}`,
            feeUsdEquivalent: "0",
            meta: { side: "sell", fiatCurrency: args.fiatCurrency },
          },
        ]);
      }

      // If new codes provided, ensure user has at least one active method configured per selected code.
      const codes =
        args.paymentMethodCodes && args.paymentMethodCodes.length
          ? args.paymentMethodCodes.map((s) => s.trim().toUpperCase()).filter(Boolean)
          : [];
      if (!isCryptoQuote && codes.length) {
        const cc = adCountryCode;
        const mine = await tx
          .select({ code: userP2pPaymentMethods.methodCode })
          .from(userP2pPaymentMethods)
          .where(
            and(
              eq(userP2pPaymentMethods.userId, args.userId),
              eq(userP2pPaymentMethods.countryCode, cc),
              inArray(userP2pPaymentMethods.methodCode, codes),
              eq(userP2pPaymentMethods.active, true),
            ),
          );
        const have = new Set(mine.map((m: any) => String(m.code)));
        const anyMissing = codes.some((c) => !have.has(c));
        if (anyMissing) {
          throw new Error("p2p_payment_methods_required");
        }
      }

      const [ins] = await tx
        .insert(p2pAds)
        .values({
          userId: args.userId,
          side: args.side,
          asset: args.asset,
          fiatCurrency: args.fiatCurrency,
          price: fmtWalletAmount(price),
          minFiat: fmtWalletAmount(minF),
          maxFiat: fmtWalletAmount(maxF),
          paymentMethods: isCryptoQuote ? `On-platform: ${args.fiatCurrency}` : pm,
          paymentMethodCodes:
            !isCryptoQuote && codes.length ? codes : null,
          reserveTotalCrypto: reserveTotal,
          reserveRemainingCrypto: reserveRemaining,
          terms: args.terms?.trim() || null,
          countryCode: adCountryCode,
          status: AD_ACTIVE,
          updatedAt: now,
        })
        .returning({ id: p2pAds.id });

      if (!ins?.id) throw new Error("p2p_ad_create_failed");
      return [ins];
    });

    if (!row?.id) return { ok: false, message: "p2p_ad_create_failed" };
    return { ok: true, id: row.id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("p2p_")) return { ok: false, message: msg };
    return { ok: false, message: "p2p_ad_create_failed" };
  }

}

/** Boost ad ranking — fee debited from main USDT balance. */
export async function boostP2pAd(args: {
  userId: string;
  adId: string;
}): Promise<{ ok: true; boostedUntil: string } | { ok: false; message: string }> {
  const fee = fmtWalletAmount(p2pBoostFeeUsdt());
  const feeNum = Number(fee);
  if (feeNum <= 0) return { ok: false, message: "p2p_boost_unavailable" };

  const db = getDb();
  const [urow] = await db
    .select({ balance: users.balance })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);
  if (!urow) return { ok: false, message: "wallet_not_found" };
  const bal = numFromNumeric(String(urow.balance));
  if (bal + 1e-18 < feeNum) {
    return { ok: false, message: "p2p_boost_insufficient_usdt" };
  }

  const days = p2pBoostDurationDays();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  try {
    await db.transaction(async (tx) => {
      const [ad] = await tx
        .select({ id: p2pAds.id, status: p2pAds.status })
        .from(p2pAds)
        .where(and(eq(p2pAds.id, args.adId), eq(p2pAds.userId, args.userId)))
        .limit(1);
      if (!ad) throw new Error("p2p_ad_not_found");
      if (ad.status === AD_CLOSED) throw new Error("p2p_ad_closed");

      await debitUserAsset(tx, args.userId, "USDT", fee);
      await insertWalletLedgerLines(tx, [
        {
          batchId: randomUUID(),
          userId: args.userId,
          entryType: "p2p_ad_boost",
          asset: "USDT",
          amount: `-${fee}`,
          feeUsdEquivalent: fee,
          meta: { adId: args.adId },
        },
      ]);

      const existingUntil = await tx
        .select({ boostedUntil: p2pAds.boostedUntil, boostAmountPi: p2pAds.boostAmountPi })
        .from(p2pAds)
        .where(eq(p2pAds.id, args.adId))
        .limit(1);
      const curUntil = existingUntil[0]?.boostedUntil;
      const baseMs =
        curUntil && new Date(curUntil).getTime() > Date.now()
          ? new Date(curUntil).getTime()
          : Date.now();
      const newUntil = new Date(baseMs + days * 24 * 60 * 60 * 1000);
      const prevBoost = Number(existingUntil[0]?.boostAmountPi ?? 0);
      const newBoostAmt = prevBoost + feeNum;

      await tx
        .update(p2pAds)
        .set({
          boostedUntil: newUntil,
          boostAmountPi: String(newBoostAmt),
          updatedAt: new Date(),
        })
        .where(eq(p2pAds.id, args.adId));
    });
    return { ok: true, boostedUntil: until.toISOString() };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("p2p_")) return { ok: false, message: msg };
    return { ok: false, message: "p2p_boost_failed" };
  }
}

export async function updateAdStatus(args: {
  userId: string;
  adId: string;
  status: P2pAdStatus;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (![AD_ACTIVE, AD_PAUSED, AD_CLOSED].includes(args.status)) {
    return { ok: false, message: "p2p_invalid_status" };
  }
  const db = getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const [cur] = await tx
        .select()
        .from(p2pAds)
        .where(and(eq(p2pAds.id, args.adId), eq(p2pAds.userId, args.userId)))
        .limit(1);
      if (!cur) throw new Error("p2p_ad_not_found");

      if (args.status === AD_CLOSED && cur.side === "sell" && cur.reserveRemainingCrypto != null) {
        const remaining = Number(cur.reserveRemainingCrypto);
        if (Number.isFinite(remaining) && remaining > 1e-18) {
          const wa = asWalletCrypto(cur.asset);
          const amt = fmtWalletAmount(remaining);
          await creditUserAsset(tx, args.userId, wa, amt);
          await insertWalletLedgerLines(tx, [
            {
              batchId: randomUUID(),
              userId: args.userId,
              entryType: "p2p_ad_reserve_unlock",
              asset: cur.asset,
              amount: amt,
              feeUsdEquivalent: "0",
              meta: { adId: cur.id },
            },
          ]);
        }
        await tx
          .update(p2pAds)
          .set({
            status: AD_CLOSED,
            reserveRemainingCrypto: "0",
            updatedAt: now,
          })
          .where(eq(p2pAds.id, cur.id));
        return;
      }

      await tx
        .update(p2pAds)
        .set({ status: args.status, updatedAt: now })
        .where(eq(p2pAds.id, cur.id));
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "p2p_ad_not_found") return { ok: false, message: msg };
    return { ok: false, message: "p2p_action_not_allowed" };
  }
}

export async function updateAdDetails(args: {
  userId: string;
  adId: string;
  priceStr?: string;
  minFiatStr?: string;
  maxFiatStr?: string;
  terms?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const [cur] = await db
    .select()
    .from(p2pAds)
    .where(and(eq(p2pAds.id, args.adId), eq(p2pAds.userId, args.userId)))
    .limit(1);
  if (!cur) return { ok: false, message: "p2p_ad_not_found" };
  if (cur.status === AD_CLOSED) return { ok: false, message: "p2p_ad_inactive" };

  const price = args.priceStr != null ? Number(args.priceStr) : Number(cur.price);
  const minF = args.minFiatStr != null ? Number(args.minFiatStr) : Number(cur.minFiat);
  const maxF = args.maxFiatStr != null ? Number(args.maxFiatStr) : Number(cur.maxFiat);
  const terms = args.terms !== undefined ? (args.terms?.trim() || null) : cur.terms;

  if (!Number.isFinite(price) || price <= 0) return { ok: false, message: "p2p_invalid_price" };
  if (!Number.isFinite(minF) || !Number.isFinite(maxF) || minF <= 0 || maxF < minF) {
    return { ok: false, message: "p2p_invalid_limits" };
  }
  const minCryptoOrder = minF / price;
  const platMinCrypto = minCryptoForAsset(cur.asset as P2pCryptoAsset);
  if (minCryptoOrder + 1e-12 < platMinCrypto) {
    return { ok: false, message: "p2p_min_below_platform" };
  }

  const now = new Date();
  try {
    await db.transaction(async (tx) => {
      const [locked] = await tx
        .select()
        .from(p2pAds)
        .where(and(eq(p2pAds.id, args.adId), eq(p2pAds.userId, args.userId)))
        .limit(1);
      if (!locked || locked.status === AD_CLOSED) throw new Error("p2p_ad_not_found");

      let reserveTotal = locked.reserveTotalCrypto;
      let reserveRemaining = locked.reserveRemainingCrypto;

      if (locked.side === "sell") {
        const oldTotal = Number(locked.reserveTotalCrypto ?? 0);
        const oldRem = Number(locked.reserveRemainingCrypto ?? 0);
        const lockedInOrders = Math.max(0, oldTotal - oldRem);
        const newTotal = Number(fmtWalletAmount(maxF / price));
        if (!Number.isFinite(newTotal) || newTotal <= 0) throw new Error("p2p_invalid_limits");
        const newRem = newTotal - lockedInOrders;
        if (newRem < -1e-18) throw new Error("p2p_max_below_open_orders");

        const delta = newTotal - oldTotal;
        const wa = asWalletCrypto(locked.asset as P2pCryptoAsset);
        if (delta > 1e-18) {
          const debitAmt = fmtWalletAmount(delta);
          await debitUserAsset(tx, args.userId, wa, debitAmt);
          await insertWalletLedgerLines(tx, [
            {
              batchId: randomUUID(),
              userId: args.userId,
              entryType: "p2p_ad_reserve_lock",
              asset: locked.asset as P2pCryptoAsset,
              amount: `-${debitAmt}`,
              feeUsdEquivalent: "0",
              meta: { adId: locked.id, reason: "edit_increase" },
            },
          ]);
        } else if (delta < -1e-18) {
          const creditAmt = fmtWalletAmount(oldRem - Math.max(0, newRem));
          if (Number(creditAmt) > 1e-18) {
            await creditUserAsset(tx, args.userId, wa, creditAmt);
            await insertWalletLedgerLines(tx, [
              {
                batchId: randomUUID(),
                userId: args.userId,
                entryType: "p2p_ad_reserve_unlock",
                asset: locked.asset as P2pCryptoAsset,
                amount: creditAmt,
                feeUsdEquivalent: "0",
                meta: { adId: locked.id, reason: "edit_decrease" },
              },
            ]);
          }
        }
        reserveTotal = fmtWalletAmount(newTotal);
        reserveRemaining = fmtWalletAmount(Math.max(0, newRem));
      }

      await tx
        .update(p2pAds)
        .set({
          price: price.toString(),
          minFiat: minF.toString(),
          maxFiat: maxF.toString(),
          terms,
          reserveTotalCrypto: reserveTotal,
          reserveRemainingCrypto: reserveRemaining,
          updatedAt: now,
        })
        .where(eq(p2pAds.id, locked.id));
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.startsWith("p2p_")) return { ok: false, message: msg };
    if (msg === "wallet_not_found" || msg === "wallet_insufficient_balance") {
      return { ok: false, message: "p2p_sell_insufficient_balance" };
    }
    return { ok: false, message: "p2p_action_not_allowed" };
  }
}

export async function createOrder(args: {
  takerId: string;
  adId: string;
  fiatAmountStr: string;
  paymentMethodCode?: string | null;
}): Promise<{ ok: true; orderId: string } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const fiatAmount = Number(args.fiatAmountStr);
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) {
    return { ok: false, message: "p2p_invalid_amount" };
  }

  const vel = await checkP2pOrderVelocity(args.takerId);
  if (!vel.ok) return vel;

  const db = getDb();
  try {
    const orderId = await db.transaction(async (tx) => {
      const [ad] = await tx
        .select({
          ad: p2pAds,
          email: users.email,
        })
        .from(p2pAds)
        .innerJoin(users, eq(p2pAds.userId, users.id))
        .where(eq(p2pAds.id, args.adId))
        .limit(1);

      if (!ad) throw new Error("p2p_ad_not_found");
      if (ad.ad.status !== AD_ACTIVE) throw new Error("p2p_ad_inactive");
      if (!isAllowedP2pQuoteFiat(String(ad.ad.fiatCurrency))) {
        throw new Error("p2p_ad_inactive");
      }
      if (ad.ad.userId === args.takerId) throw new Error("p2p_cannot_trade_own_ad");

      const minF = Number(ad.ad.minFiat);
      const maxF = Number(ad.ad.maxFiat);
      const price = Number(ad.ad.price);
      const asset = ad.ad.asset as P2pCryptoAsset;
      const platMinFiat = minCryptoForAsset(asset) * price;
      const effectiveMinF = Math.max(minF, platMinFiat);
      let effectiveMaxF = maxF;
      const usesReserve =
        (ad.ad.side as P2pSide) === "sell" &&
        ad.ad.reserveRemainingCrypto != null &&
        ad.ad.reserveTotalCrypto != null;
      if (usesReserve) {
        const rem = Number(ad.ad.reserveRemainingCrypto);
        if (Number.isFinite(rem) && rem >= 0 && Number.isFinite(price) && price > 0) {
          effectiveMaxF = Math.min(maxF, rem * price);
        }
      }
      if (fiatAmount + 1e-12 < effectiveMinF || fiatAmount > effectiveMaxF + 1e-12) {
        throw new Error("p2p_amount_out_of_range");
      }

      const cryptoRaw = fiatAmount / price;
      const minC = minCryptoForAsset(asset);
      if (cryptoRaw + 1e-18 < minC) throw new Error("p2p_below_min_crypto");

      const cryptoStr = fmtWalletAmount(cryptoRaw);
      const cryptoNum = Number(cryptoStr);
      if (!Number.isFinite(cryptoNum) || cryptoNum <= 0) throw new Error("p2p_invalid_amount");

      const { sellerUserId, buyerUserId, payerUserId } = tradeRoles({
        side: ad.ad.side as P2pSide,
        makerId: ad.ad.userId,
        takerId: args.takerId,
      });

      const wa = asWalletCrypto(asset);
      const quoteCode = String(ad.ad.fiatCurrency);
      const cryptoQuote = isP2pCryptoQuoteCurrency(quoteCode);
      const quoteAsset = cryptoQuote ? asQuoteWalletAsset(quoteCode) : null;
      if (cryptoQuote && (!quoteAsset || quoteAsset === wa)) {
        throw new Error("p2p_invalid_limits");
      }
      if (usesReserve) {
        const rem = Number(ad.ad.reserveRemainingCrypto);
        if (!Number.isFinite(rem) || rem + 1e-18 < cryptoNum) {
          // SELL ad: insufficient seller reserve; do not blame buyer.
          throw new Error("p2p_sell_insufficient_balance");
        }
      } else {
        const [sellerRow] = await tx
          .select({
            balance: users.balance,
            piBalance: users.piBalance,
          })
          .from(users)
          .where(eq(users.id, sellerUserId));

        if (!sellerRow) throw new Error("wallet_not_found");
        const bal =
          wa === "USDT"
            ? numFromNumeric(sellerRow.balance)
            : numFromNumeric(sellerRow.piBalance);
        if (bal + 1e-18 < cryptoNum) {
          throw new Error(
            (ad.ad.side as P2pSide) === "sell"
              ? "p2p_sell_insufficient_balance"
              : "p2p_buy_escrow_insufficient_balance",
          );
        }
      }

      if (cryptoQuote && quoteAsset) {
        const [payerRow] = await tx
          .select({
            balance: users.balance,
            piBalance: users.piBalance,
          })
          .from(users)
          .where(eq(users.id, payerUserId));
        if (!payerRow) throw new Error("wallet_not_found");
        const payerBal =
          quoteAsset === "USDT"
            ? numFromNumeric(payerRow.balance)
            : numFromNumeric(payerRow.piBalance);
        if (payerBal + 1e-18 < fiatAmount) {
          throw new Error("wallet_insufficient_balance");
        }
      }

      const windowMin = paymentWindowMinutes();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowMin * 60_000);
      const batchId = randomUUID();
      if (usesReserve) {
        // Decrement reserve remaining.
        const remStr = fmtWalletAmount(Number(ad.ad.reserveRemainingCrypto));
        const next = fmtWalletAmount(Number(remStr) - cryptoNum);
        const [upd] = await tx
          .update(p2pAds)
          .set({ reserveRemainingCrypto: next, updatedAt: now })
          .where(eq(p2pAds.id, args.adId))
          .returning({ id: p2pAds.id });
        if (!upd) throw new Error("p2p_order_create_failed");
      } else {
        await debitUserAsset(tx, sellerUserId, wa, cryptoStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: sellerUserId,
            entryType: "p2p_escrow_lock",
            asset,
            amount: `-${cryptoStr}`,
            feeUsdEquivalent: "0",
            counterpartyUserId: buyerUserId,
            meta: {
              adId: args.adId,
              fiatAmount: fmtWalletAmount(fiatAmount),
              price: ad.ad.price.toString(),
            },
          },
        ]);
      }

      const adCodes =
        (ad.ad.paymentMethodCodes as string[] | null)?.map((c) => c.trim().toUpperCase()).filter(Boolean) ??
        [];
      let chosenCode = args.paymentMethodCode?.trim().toUpperCase() || null;
      if (adCodes.length === 1) chosenCode = adCodes[0]!;
      else if (adCodes.length > 1 && !chosenCode) {
        throw new Error("p2p_payment_method_required");
      } else if (chosenCode && adCodes.length && !adCodes.includes(chosenCode)) {
        throw new Error("p2p_payment_method_invalid");
      }

      const paymentSnapshot = await buildPaymentSnapshot({
        tx,
        sellerUserId,
        countryCode: ad.ad.countryCode ?? null,
        paymentMethodCodes: (ad.ad.paymentMethodCodes as string[] | null) ?? null,
        legacyPaymentMethods: ad.ad.paymentMethods,
        onlyCode: chosenCode,
      });

      const paidMarkedAt = cryptoQuote ? now : null;
      const [ins] = await tx
        .insert(p2pOrders)
        .values({
          adId: args.adId,
          makerId: ad.ad.userId,
          takerId: args.takerId,
          asset,
          fiatCurrency: ad.ad.fiatCurrency,
          price: ad.ad.price,
          fiatAmount: fmtWalletAmount(fiatAmount),
          cryptoAmount: cryptoStr,
          status: cryptoQuote ? ST_PAID : ST_AWAIT,
          sellerUserId,
          buyerUserId,
          payerUserId,
          paymentSnapshot: cryptoQuote && quoteAsset
            ? `On-platform: ${quoteAsset}`
            : paymentSnapshot,
          expiresAt,
          paidMarkedAt,
          updatedAt: now,
        })
        .returning({ id: p2pOrders.id });

      const oid = ins?.id;
      if (!oid) throw new Error("p2p_order_create_failed");

      if (cryptoQuote && quoteAsset) {
        const quoteStr = fmtWalletAmount(fiatAmount);
        const quoteBatch = randomUUID();
        await debitUserAsset(tx, payerUserId, quoteAsset, quoteStr);
        await creditUserAsset(tx, sellerUserId, quoteAsset, quoteStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId: quoteBatch,
            userId: payerUserId,
            entryType: "p2p_quote_out",
            asset: quoteAsset,
            amount: `-${quoteStr}`,
            feeUsdEquivalent: "0",
            counterpartyUserId: sellerUserId,
            meta: { orderId: oid, quoteAsset },
          },
          {
            batchId: quoteBatch,
            userId: sellerUserId,
            entryType: "p2p_quote_in",
            asset: quoteAsset,
            amount: quoteStr,
            feeUsdEquivalent: "0",
            counterpartyUserId: payerUserId,
            meta: { orderId: oid, quoteAsset },
          },
        ]);

        // Immediately release escrowed crypto to buyer.
        const [o] = await tx
          .select()
          .from(p2pOrders)
          .where(eq(p2pOrders.id, oid))
          .limit(1);
        if (!o) throw new Error("p2p_order_create_failed");
        await finalizeReleaseToBuyer(tx, o, now, ST_PAID);
      }
      return oid;
    });
    const ctx = await fetchOrderNotifyCtx(orderId);
    if (ctx) {
      void notifyP2pOrderCreated(ctx);
      if (ctx.status === ST_RELEASED) {
        void notifyP2pOrderReleased(ctx);
      }
    }
    return { ok: true, orderId };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "p2p_order_create_failed";
    if (
      msg === "wallet_not_found" ||
      msg === "wallet_insufficient_balance" ||
      msg.startsWith("p2p_")
    ) {
      return { ok: false, message: msg };
    }
    return { ok: false, message: "p2p_order_create_failed" };
  }
}

export async function getOrderDetailForUser(args: {
  orderId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      order: {
        id: string;
        adId: string;
        side: P2pSide;
        asset: string;
        fiatCurrency: string;
        price: string;
        fiatAmount: string;
        cryptoAmount: string;
        status: P2pOrderStatus;
        expiresAt: string;
        paidMarkedAt: string | null;
        autoReleaseAt: string | null;
        releasedAt: string | null;
        cancelledAt: string | null;
        paymentSnapshot: string;
        makerMasked: string;
        takerMasked: string;
        counterpartyName: string;
        counterpartyAvatarUrl: string | null;
        role: "maker" | "taker";
        youAreSeller: boolean;
        youArePayer: boolean;
        youAreBuyer: boolean;
        createdAt: string;
        paymentReference: string | null;
        paymentProofNote: string | null;
        disputeReason: string | null;
        disputedAt: string | null;
        disputeResponseDueAt: string | null;
        refundedAt: string | null;
        platformFeeCrypto: string | null;
        buyerReceivedCrypto: string | null;
        counterpartyId: string;
        counterpartyVerifiedName: string | null;
        counterpartyKycApproved: boolean;
        hasRated: boolean;
        canRate: boolean;
        chatAllowsNewMessages: boolean;
        viewerAvatarUrl: string | null;
      };
    }
  | { ok: false; message: string }
> {
  await processExpiredP2pOrders();
  await processP2pPaidOrderAutomation();
  const db = getDb();
  const [hit] = await db
    .select({
      o: p2pOrders,
      ad: p2pAds,
    })
    .from(p2pOrders)
    .innerJoin(p2pAds, eq(p2pOrders.adId, p2pAds.id))
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);

  if (!hit) return { ok: false, message: "p2p_order_not_found" };
  const o = hit.o;
  const uid = args.userId;
  if (o.makerId !== uid && o.takerId !== uid) {
    return { ok: false, message: "p2p_order_not_found" };
  }

  const [mk] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      piUsername: users.piUsername,
      avatarUrl: users.avatarUrl,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, o.makerId))
    .limit(1);
  const [tk] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      piUsername: users.piUsername,
      avatarUrl: users.avatarUrl,
      legalFirstName: users.legalFirstName,
      legalLastName: users.legalLastName,
      kycStatus: users.kycStatus,
    })
    .from(users)
    .where(eq(users.id, o.takerId))
    .limit(1);

  const [existingRating] = await db
    .select({ id: p2pOrderRatings.id })
    .from(p2pOrderRatings)
    .where(
      and(eq(p2pOrderRatings.orderId, o.id), eq(p2pOrderRatings.fromUserId, uid)),
    )
    .limit(1);

  const [viewerRow] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, uid))
    .limit(1);

  const role = o.makerId === uid ? ("maker" as const) : ("taker" as const);
  const youAreSeller = o.sellerUserId === uid;
  const youArePayer = o.payerUserId === uid;
  const youAreBuyer = o.buyerUserId === uid;
  const counterpartyId = o.makerId === uid ? o.takerId : o.makerId;
  const counterpartyRow = o.makerId === uid ? tk : mk;
  const st = o.status;
  const chatAllowsNewMessages = ![
    ST_RELEASED,
    ST_CANCELLED,
    ST_EXPIRED,
    ST_REFUNDED,
  ].includes(st);

  return {
    ok: true,
    order: {
      id: o.id,
      adId: o.adId,
      side: hit.ad.side as P2pSide,
      asset: o.asset,
      fiatCurrency: o.fiatCurrency,
      price: o.price.toString(),
      fiatAmount: o.fiatAmount.toString(),
      cryptoAmount: o.cryptoAmount.toString(),
      status: o.status as P2pOrderStatus,
      expiresAt: o.expiresAt.toISOString(),
      paidMarkedAt: o.paidMarkedAt?.toISOString() ?? null,
      autoReleaseAt: o.autoReleaseAt?.toISOString() ?? null,
      releasedAt: o.releasedAt?.toISOString() ?? null,
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
      paymentSnapshot: o.paymentSnapshot,
      makerMasked: maskTraderEmail(mk?.email ?? ""),
      takerMasked: maskTraderEmail(tk?.email ?? ""),
      counterpartyName: counterpartyRow ? p2pDisplayName(counterpartyRow) : "",
      counterpartyAvatarUrl: counterpartyRow?.avatarUrl ?? null,
      role,
      youAreSeller,
      youArePayer,
      youAreBuyer,
      createdAt: o.createdAt.toISOString(),
      paymentReference: o.paymentReference ?? null,
      paymentProofNote: o.paymentProofNote ?? null,
      disputeReason: o.disputeReason ?? null,
      disputedAt: o.disputedAt?.toISOString() ?? null,
      disputeResponseDueAt: o.disputeResponseDueAt?.toISOString() ?? null,
      refundedAt: o.refundedAt?.toISOString() ?? null,
      platformFeeCrypto: o.platformFeeCrypto?.toString() ?? null,
      buyerReceivedCrypto: o.buyerReceivedCrypto?.toString() ?? null,
      counterpartyId,
      counterpartyVerifiedName: counterpartyRow
        ? p2pLegalDisplayName({
            legalFirstName: counterpartyRow.legalFirstName,
            legalLastName: counterpartyRow.legalLastName,
            displayName: counterpartyRow.displayName,
            kycStatus: counterpartyRow.kycStatus,
          })
        : null,
      counterpartyKycApproved: (counterpartyRow?.kycStatus ?? "none") === "approved",
      hasRated: !!existingRating,
      canRate: st === ST_RELEASED && !existingRating,
      chatAllowsNewMessages,
      viewerAvatarUrl: viewerRow?.avatarUrl ?? null,
    },
  };
}

export async function listUserOrders(userId: string) {
  await processExpiredP2pOrders();
  const db = getDb();
  const rows = await db
    .select({ o: p2pOrders, ad: p2pAds })
    .from(p2pOrders)
    .innerJoin(p2pAds, eq(p2pOrders.adId, p2pAds.id))
    .where(or(eq(p2pOrders.makerId, userId), eq(p2pOrders.takerId, userId)))
    .orderBy(desc(p2pOrders.createdAt));

  return rows.map(({ o, ad }) => ({
    id: o.id,
    adId: o.adId,
    side: ad.side as P2pSide,
    asset: o.asset,
    fiatCurrency: o.fiatCurrency,
    fiatAmount: o.fiatAmount.toString(),
    cryptoAmount: o.cryptoAmount.toString(),
    status: o.status as P2pOrderStatus,
    expiresAt: o.expiresAt.toISOString(),
    createdAt: o.createdAt.toISOString(),
    role: o.makerId === userId ? ("maker" as const) : ("taker" as const),
  }));
}

export async function markOrderPaid(args: {
  orderId: string;
  userId: string;
  paymentReference?: string | null;
  paymentProofNote?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const db = getDb();
  const now = new Date();
  const reference = args.paymentReference?.trim() || null;
  const proofNote = args.paymentProofNote?.trim() || null;
  const autoReleaseAt = new Date(now.getTime() + p2pReleaseWindowMinutes() * 60 * 1000);

  const res = await db
    .update(p2pOrders)
    .set({
      status: ST_PAID,
      paidMarkedAt: now,
      autoReleaseAt,
      releaseReminderSentAt: null,
      updatedAt: now,
      paymentReference: reference,
      paymentProofNote: proofNote,
    })
    .where(
      and(
        eq(p2pOrders.id, args.orderId),
        eq(p2pOrders.payerUserId, args.userId),
        eq(p2pOrders.status, ST_AWAIT),
      ),
    )
    .returning({ id: p2pOrders.id });

  if (!res.length) return { ok: false, message: "p2p_action_not_allowed" };
  const paidCtx = await fetchOrderNotifyCtx(args.orderId);
  if (paidCtx) void notifyP2pOrderPaid(paidCtx);
  return { ok: true };
}

export async function releaseOrder(args: {
  orderId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const db = getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const [o] = await tx
        .select()
        .from(p2pOrders)
        .where(
          and(
            eq(p2pOrders.id, args.orderId),
            eq(p2pOrders.sellerUserId, args.userId),
            eq(p2pOrders.status, ST_PAID),
          ),
        )
        .limit(1);

      if (!o) {
        throw new Error("p2p_action_not_allowed");
      }

      await finalizeReleaseToBuyer(tx, o, now, ST_PAID);
    });
    const releasedCtx = await fetchOrderNotifyCtx(args.orderId);
    if (releasedCtx) {
      void notifyP2pOrderReleased(releasedCtx);
      void import("@/lib/reward-points-service").then(({ tryGrantP2pTradeCompletedPoints }) =>
        tryGrantP2pTradeCompletedPoints({
          userId: releasedCtx.buyerUserId,
          orderId: args.orderId,
        }).catch((err) => {
          console.warn("[p2p] reward points grant skipped", err);
        }),
      );
    }
    return { ok: true };
  } catch {
    return { ok: false, message: "p2p_action_not_allowed" };
  }
}

export async function cancelOrder(args: {
  orderId: string;
  userId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const db = getDb();
  const now = new Date();

  try {
    await db.transaction(async (tx) => {
      const [o] = await tx
        .select({ o: p2pOrders, ad: p2pAds })
        .from(p2pOrders)
        .innerJoin(p2pAds, eq(p2pOrders.adId, p2pAds.id))
        .where(
          and(
            eq(p2pOrders.id, args.orderId),
            or(eq(p2pOrders.makerId, args.userId), eq(p2pOrders.takerId, args.userId)),
            eq(p2pOrders.status, ST_AWAIT),
          ),
        )
        .limit(1);

      if (!o) {
        throw new Error("p2p_action_not_allowed");
      }

      const cryptoStr = o.o.cryptoAmount.toString();
      const asset = asWalletCrypto(o.o.asset);
      const batchId = randomUUID();

      const usesReserve =
        (o.ad.side as P2pSide) === "sell" &&
        o.ad.reserveRemainingCrypto != null &&
        o.ad.reserveTotalCrypto != null;
      if (usesReserve) {
        const next = numericAdd(String(o.ad.reserveRemainingCrypto), cryptoStr);
        await tx
          .update(p2pAds)
          .set({ reserveRemainingCrypto: next, updatedAt: now })
          .where(eq(p2pAds.id, o.ad.id));
      } else {
        await creditUserAsset(tx, o.o.sellerUserId, asset, cryptoStr);
      }

      await tx
        .update(p2pOrders)
        .set({
          status: ST_CANCELLED,
          cancelledAt: now,
          updatedAt: now,
        })
        .where(and(eq(p2pOrders.id, o.o.id), eq(p2pOrders.status, ST_AWAIT)));

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: o.o.sellerUserId,
          entryType: "p2p_escrow_refund",
          asset: o.o.asset,
          amount: cryptoStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: o.o.buyerUserId,
          meta: { orderId: o.o.id, reason: usesReserve ? "cancelled_replenish_reserve" : "cancelled" },
        },
      ]);
    });
    const cancelCtx = await fetchOrderNotifyCtx(args.orderId);
    if (cancelCtx) void notifyP2pOrderCancelled(cancelCtx, args.userId);
    return { ok: true };
  } catch {
    return { ok: false, message: "p2p_action_not_allowed" };
  }
}

export async function openOrderDispute(args: {
  orderId: string;
  userId: string;
  reason: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const reason = args.reason.trim();
  if (reason.length < 3) return { ok: false, message: "p2p_dispute_reason_short" };
  if (reason.length > 4000) return { ok: false, message: "p2p_dispute_reason_long" };

  const db = getDb();
  const now = new Date();
  const responseDue = new Date(now.getTime() + p2pDisputeResponseHours() * 60 * 60 * 1000);
  const res = await db
    .update(p2pOrders)
    .set({
      status: ST_DISPUTED,
      disputeReason: reason,
      disputedAt: now,
      disputeResponseDueAt: responseDue,
      updatedAt: now,
    })
    .where(
      and(
        eq(p2pOrders.id, args.orderId),
        or(eq(p2pOrders.makerId, args.userId), eq(p2pOrders.takerId, args.userId)),
        eq(p2pOrders.status, ST_PAID),
      ),
    )
    .returning({ id: p2pOrders.id });

  if (!res.length) return { ok: false, message: "p2p_action_not_allowed" };
  const disputeCtx = await fetchOrderNotifyCtx(args.orderId);
  if (disputeCtx) void notifyP2pOrderDisputed(disputeCtx, args.userId);
  return { ok: true };
}

const makerU = alias(users, "p2p_maker");
const takerU = alias(users, "p2p_taker");

export async function listDisputedOrdersForAdmin(): Promise<
  {
    id: string;
    fiatAmount: string;
    fiatCurrency: string;
    cryptoAmount: string;
    asset: string;
    disputedAt: string;
    disputeReason: string | null;
    makerMasked: string;
    takerMasked: string;
  }[]
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const rows = await db
    .select({
      o: p2pOrders,
      me: makerU.email,
      te: takerU.email,
    })
    .from(p2pOrders)
    .innerJoin(makerU, eq(p2pOrders.makerId, makerU.id))
    .innerJoin(takerU, eq(p2pOrders.takerId, takerU.id))
    .where(eq(p2pOrders.status, ST_DISPUTED))
    .orderBy(desc(p2pOrders.disputedAt));

  return rows.map((r) => ({
    id: r.o.id,
    fiatAmount: r.o.fiatAmount.toString(),
    fiatCurrency: r.o.fiatCurrency,
    cryptoAmount: r.o.cryptoAmount.toString(),
    asset: r.o.asset,
    disputedAt: r.o.disputedAt?.toISOString() ?? "",
    disputeReason: r.o.disputeReason ?? null,
    makerMasked: maskTraderEmail(r.me),
    takerMasked: maskTraderEmail(r.te),
  }));
}

export async function adminResolveP2pOrder(args: {
  orderId: string;
  resolution: "release_buyer" | "refund_seller";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const db = getDb();
  const now = new Date();

  if (args.resolution === "release_buyer") {
    try {
      await db.transaction(async (tx) => {
        const [o] = await tx
          .select()
          .from(p2pOrders)
          .where(and(eq(p2pOrders.id, args.orderId), eq(p2pOrders.status, ST_DISPUTED)))
          .limit(1);
        if (!o) throw new Error("p2p_order_not_found");
        await finalizeReleaseToBuyer(tx, o, now, ST_DISPUTED);
      });
      const resolvedCtx = await fetchOrderNotifyCtx(args.orderId);
      if (resolvedCtx) void notifyP2pDisputeReleased(resolvedCtx);
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "p2p_order_not_found") return { ok: false, message: msg };
      return { ok: false, message: "p2p_action_not_allowed" };
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [hit] = await tx
        .select({ o: p2pOrders, ad: p2pAds })
        .from(p2pOrders)
        .innerJoin(p2pAds, eq(p2pOrders.adId, p2pAds.id))
        .where(and(eq(p2pOrders.id, args.orderId), eq(p2pOrders.status, ST_DISPUTED)))
        .limit(1);
      if (!hit) throw new Error("p2p_order_not_found");
      const o = hit.o;

      const cryptoStr = o.cryptoAmount.toString();
      const asset = asWalletCrypto(o.asset);
      const batchId = randomUUID();

      const usesReserve =
        (hit.ad.side as P2pSide) === "sell" &&
        hit.ad.reserveRemainingCrypto != null &&
        hit.ad.reserveTotalCrypto != null;
      if (usesReserve) {
        const next = numericAdd(String(hit.ad.reserveRemainingCrypto), cryptoStr);
        await tx
          .update(p2pAds)
          .set({ reserveRemainingCrypto: next, updatedAt: now })
          .where(eq(p2pAds.id, hit.ad.id));
      } else {
        await creditUserAsset(tx, o.sellerUserId, asset, cryptoStr);
      }

      const [upd] = await tx
        .update(p2pOrders)
        .set({
          status: ST_REFUNDED,
          refundedAt: now,
          updatedAt: now,
        })
        .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, ST_DISPUTED)))
        .returning({ id: p2pOrders.id });

      if (!upd) throw new Error("p2p_action_not_allowed");

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: o.sellerUserId,
          entryType: "p2p_escrow_refund",
          asset: o.asset,
          amount: cryptoStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: o.buyerUserId,
          meta: { orderId: o.id, reason: usesReserve ? "dispute_replenish_reserve" : "dispute_refund_seller" },
        },
      ]);
    });
    const refundCtx = await fetchOrderNotifyCtx(args.orderId);
    if (refundCtx) void notifyP2pDisputeRefunded(refundCtx);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "p2p_order_not_found") return { ok: false, message: msg };
    return { ok: false, message: "p2p_action_not_allowed" };
  }
}

export async function listP2pOrderMessages(args: {
  orderId: string;
  userId: string;
}): Promise<
  | {
      ok: true;
      messages: {
        id: string;
        body: string;
        createdAt: string;
        senderMasked: string;
        senderRole: string;
        /** Public profile image URL when set (same as app header / profile). */
        senderAvatarUrl: string | null;
        own: boolean;
      }[];
    }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [o] = await db
    .select()
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);

  if (!o || (o.makerId !== args.userId && o.takerId !== args.userId)) {
    return { ok: false, message: "p2p_order_not_found" };
  }

  const rows = await db
    .select({
      id: p2pOrderMessages.id,
      body: p2pOrderMessages.body,
      createdAt: p2pOrderMessages.createdAt,
      uid: p2pOrderMessages.userId,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
    })
    .from(p2pOrderMessages)
    .innerJoin(users, eq(p2pOrderMessages.userId, users.id))
    .where(eq(p2pOrderMessages.orderId, args.orderId))
    .orderBy(asc(p2pOrderMessages.createdAt));

  return {
    ok: true,
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      senderMasked:
        r.role === "agent" || r.role === "super_admin"
          ? "Support"
          : maskTraderEmail(r.email),
      senderRole: r.role,
      senderAvatarUrl: r.avatarUrl ?? null,
      own: r.uid === args.userId,
    })),
  };
}

export async function listP2pOrderMessagesForStaff(args: {
  orderId: string;
}): Promise<
  | {
      ok: true;
      order: { id: string; status: string; makerId: string; takerId: string };
      messages: {
        id: string;
        body: string;
        createdAt: string;
        senderMasked: string;
        senderRole: string;
        senderAvatarUrl: string | null;
      }[];
    }
  | { ok: false; message: string }
> {
  const db = getDb();
  const [o] = await db
    .select({
      id: p2pOrders.id,
      status: p2pOrders.status,
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
    })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };

  const rows = await db
    .select({
      id: p2pOrderMessages.id,
      body: p2pOrderMessages.body,
      createdAt: p2pOrderMessages.createdAt,
      email: users.email,
      role: users.role,
      avatarUrl: users.avatarUrl,
    })
    .from(p2pOrderMessages)
    .innerJoin(users, eq(p2pOrderMessages.userId, users.id))
    .where(eq(p2pOrderMessages.orderId, args.orderId))
    .orderBy(asc(p2pOrderMessages.createdAt));

  return {
    ok: true,
    order: o,
    messages: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      senderMasked:
        r.role === "agent" || r.role === "super_admin"
          ? "Support"
          : maskTraderEmail(r.email),
      senderRole: r.role,
      senderAvatarUrl: r.avatarUrl ?? null,
    })),
  };
}

export async function postP2pOrderMessageForStaff(args: {
  orderId: string;
  staffUserId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = args.body.trim();
  if (text.length < 1) return { ok: false, message: "p2p_chat_empty" };
  if (text.length > 2000) return { ok: false, message: "p2p_chat_too_long" };

  const db = getDb();
  const [o] = await db
    .select({ id: p2pOrders.id, status: p2pOrders.status })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);
  if (!o) return { ok: false, message: "p2p_order_not_found" };

  // Allow staff to message even after close, but keep it strict for safety.
  const allowed = [ST_AWAIT, ST_PAID, ST_DISPUTED].includes(o.status);
  if (!allowed) return { ok: false, message: "p2p_chat_closed" };

  await db.insert(p2pOrderMessages).values({
    orderId: args.orderId,
    userId: args.staffUserId,
    body: text,
  });
  const supportCtx = await fetchOrderNotifyCtx(args.orderId);
  if (supportCtx) void notifyP2pSupportMessage(supportCtx, text);
  return { ok: true };
}

export async function postP2pOrderMessage(args: {
  orderId: string;
  userId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = args.body.trim();
  if (text.length < 1) return { ok: false, message: "p2p_chat_empty" };
  if (text.length > 2000) return { ok: false, message: "p2p_chat_too_long" };

  const mod = moderateP2pChatText(text);
  if (!mod.allowed) {
    return { ok: false, message: mod.reason === "scam_keyword" || mod.reason === "p2p_scam_keyword" ? "p2p_chat_scam_blocked" : "p2p_chat_blocked" };
  }

  const db = getDb();
  const [o] = await db
    .select()
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);

  if (!o || (o.makerId !== args.userId && o.takerId !== args.userId)) {
    return { ok: false, message: "p2p_order_not_found" };
  }

  const closed = [ST_RELEASED, ST_CANCELLED, ST_EXPIRED, ST_REFUNDED].includes(o.status);
  if (closed) return { ok: false, message: "p2p_chat_closed" };

  await db.insert(p2pOrderMessages).values({
    orderId: args.orderId,
    userId: args.userId,
    body: mod.sanitizedBody,
  });

  const msgCtx = await fetchOrderNotifyCtx(args.orderId);
  if (msgCtx) void notifyP2pOrderMessage(msgCtx, args.userId, text);

  return { ok: true };
}

export async function submitP2pOrderRating(args: {
  orderId: string;
  userId: string;
  stars: number;
  comment?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const stars = Math.round(Number(args.stars));
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
    return { ok: false, message: "p2p_rating_invalid" };
  }
  const comment = args.comment?.trim() || null;
  if (comment && comment.length > 500) {
    return { ok: false, message: "p2p_rating_comment_long" };
  }

  const db = getDb();
  const [o] = await db
    .select()
    .from(p2pOrders)
    .where(eq(p2pOrders.id, args.orderId))
    .limit(1);

  if (!o || (o.makerId !== args.userId && o.takerId !== args.userId)) {
    return { ok: false, message: "p2p_order_not_found" };
  }
  if (o.status !== ST_RELEASED) {
    return { ok: false, message: "p2p_rating_order_not_done" };
  }

  const toUserId = o.makerId === args.userId ? o.takerId : o.makerId;

  try {
    await db.insert(p2pOrderRatings).values({
      orderId: o.id,
      fromUserId: args.userId,
      toUserId,
      stars,
      comment,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "p2p_rating_duplicate" };
  }
}
