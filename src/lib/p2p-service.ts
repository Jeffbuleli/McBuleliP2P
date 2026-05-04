import { and, asc, desc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { randomUUID } from "node:crypto";
import {
  getDb,
  p2pAds,
  p2pOrderMessages,
  p2pOrderRatings,
  p2pOrders,
  users,
} from "@/db";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { creditUserAsset, debitUserAsset } from "@/lib/wallet-move-assets";
import {
  minCryptoForAsset,
  paymentWindowMinutes,
  p2pFeeBpsConfigured,
  type P2pAdStatus,
  type P2pCryptoAsset,
  type P2pOrderStatus,
  type P2pSide,
} from "@/lib/p2p-config";
import { fmtWalletAmount, numFromNumeric, type WalletAsset } from "@/lib/wallet-types";

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

export function maskTraderEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain || !local) return "***";
  if (local.length <= 2) return `**@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function asWalletCrypto(asset: string): WalletAsset {
  return asset === "PI" ? "PI" : "USDT";
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

export async function processExpiredP2pOrders(): Promise<void> {
  const db = getDb();
  const now = new Date();
  const expired = await db
    .select()
    .from(p2pOrders)
    .where(and(eq(p2pOrders.status, ST_AWAIT), lte(p2pOrders.expiresAt, now)));

  for (const o of expired) {
    await db.transaction(async (tx) => {
      const [cur] = await tx
        .select()
        .from(p2pOrders)
        .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, ST_AWAIT)))
        .limit(1);
      if (!cur) return;

      const sellerId = cur.sellerUserId;
      const cryptoStr = cur.cryptoAmount.toString();
      const asset = asWalletCrypto(cur.asset);
      const batchId = randomUUID();

      await creditUserAsset(tx, sellerId, asset, cryptoStr);

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
          asset: cur.asset,
          amount: cryptoStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: cur.buyerUserId,
          meta: { orderId: o.id, reason: "expired" },
        },
      ]);
    });
  }
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
    terms: string | null;
    countryCode: string | null;
    createdAt: string;
    makerMasked: string;
    makerRating: { avg: number; count: number } | null;
  }[]
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const cond = [eq(p2pAds.status, AD_ACTIVE)];
  if (filters.asset) cond.push(eq(p2pAds.asset, filters.asset));
  if (filters.fiat) cond.push(eq(p2pAds.fiatCurrency, filters.fiat));
  if (filters.side) cond.push(eq(p2pAds.side, filters.side));
  if (filters.country) cond.push(eq(p2pAds.countryCode, filters.country));

  const rows = await db
    .select({
      ad: p2pAds,
      email: users.email,
    })
    .from(p2pAds)
    .innerJoin(users, eq(p2pAds.userId, users.id))
    .where(and(...cond))
    .orderBy(desc(p2pAds.createdAt));

  const rep = await loadReputationMap(rows.map((r) => r.ad.userId));

  return rows.map(({ ad, email }) => ({
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
    createdAt: ad.createdAt.toISOString(),
    makerMasked: maskTraderEmail(email),
    makerRating: rep.get(ad.userId) ?? null,
  }));
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
        terms: string | null;
        countryCode: string | null;
        makerMasked: string;
        makerRating: { avg: number; count: number } | null;
      };
    }
  | { ok: false; message: string }
> {
  await processExpiredP2pOrders();
  const db = getDb();
  const [row] = await db
    .select({ ad: p2pAds, email: users.email })
    .from(p2pAds)
    .innerJoin(users, eq(p2pAds.userId, users.id))
    .where(eq(p2pAds.id, args.adId))
    .limit(1);

  if (!row) return { ok: false, message: "p2p_ad_not_found" };
  if (row.ad.status !== AD_ACTIVE) return { ok: false, message: "p2p_ad_inactive" };
  if (row.ad.userId === args.takerId) {
    return { ok: false, message: "p2p_cannot_trade_own_ad" };
  }

  const rep = await loadReputationMap([row.ad.userId]);

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
      terms: row.ad.terms,
      countryCode: row.ad.countryCode,
      makerMasked: maskTraderEmail(row.email),
      makerRating: rep.get(row.ad.userId) ?? null,
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
  const pm = args.paymentMethods.trim();
  if (pm.length < 3) return { ok: false, message: "p2p_payment_methods_required" };

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
  const now = new Date();
  const [row] = await db
    .insert(p2pAds)
    .values({
      userId: args.userId,
      side: args.side,
      asset: args.asset,
      fiatCurrency: args.fiatCurrency,
      price: fmtWalletAmount(price),
      minFiat: fmtWalletAmount(minF),
      maxFiat: fmtWalletAmount(maxF),
      paymentMethods: pm,
      terms: args.terms?.trim() || null,
      countryCode: args.countryCode?.trim() || null,
      status: AD_ACTIVE,
      updatedAt: now,
    })
    .returning({ id: p2pAds.id });

  if (!row?.id) return { ok: false, message: "p2p_ad_create_failed" };
  return { ok: true, id: row.id };
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
  const res = await db
    .update(p2pAds)
    .set({ status: args.status, updatedAt: now })
    .where(and(eq(p2pAds.id, args.adId), eq(p2pAds.userId, args.userId)))
    .returning({ id: p2pAds.id });
  if (!res.length) return { ok: false, message: "p2p_ad_not_found" };
  return { ok: true };
}

export async function createOrder(args: {
  takerId: string;
  adId: string;
  fiatAmountStr: string;
}): Promise<{ ok: true; orderId: string } | { ok: false; message: string }> {
  await processExpiredP2pOrders();
  const fiatAmount = Number(args.fiatAmountStr);
  if (!Number.isFinite(fiatAmount) || fiatAmount <= 0) {
    return { ok: false, message: "p2p_invalid_amount" };
  }

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
      if (ad.ad.userId === args.takerId) throw new Error("p2p_cannot_trade_own_ad");

      const minF = Number(ad.ad.minFiat);
      const maxF = Number(ad.ad.maxFiat);
      if (fiatAmount + 1e-12 < minF || fiatAmount > maxF + 1e-12) {
        throw new Error("p2p_amount_out_of_range");
      }

      const price = Number(ad.ad.price);
      const cryptoRaw = fiatAmount / price;
      const asset = ad.ad.asset as P2pCryptoAsset;
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
      if (bal + 1e-18 < cryptoNum) throw new Error("wallet_insufficient_balance");

      const windowMin = paymentWindowMinutes();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + windowMin * 60_000);
      const batchId = randomUUID();

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
          status: ST_AWAIT,
          sellerUserId,
          buyerUserId,
          payerUserId,
          paymentSnapshot: ad.ad.paymentMethods,
          expiresAt,
          updatedAt: now,
        })
        .returning({ id: p2pOrders.id });

      const oid = ins?.id;
      if (!oid) throw new Error("p2p_order_create_failed");
      return oid;
    });
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
        releasedAt: string | null;
        cancelledAt: string | null;
        paymentSnapshot: string;
        makerMasked: string;
        takerMasked: string;
        role: "maker" | "taker";
        youAreSeller: boolean;
        youArePayer: boolean;
        youAreBuyer: boolean;
        createdAt: string;
        paymentReference: string | null;
        paymentProofNote: string | null;
        disputeReason: string | null;
        disputedAt: string | null;
        refundedAt: string | null;
        platformFeeCrypto: string | null;
        buyerReceivedCrypto: string | null;
        counterpartyId: string;
        hasRated: boolean;
        canRate: boolean;
        chatAllowsNewMessages: boolean;
      };
    }
  | { ok: false; message: string }
> {
  await processExpiredP2pOrders();
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
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, o.makerId))
    .limit(1);
  const [tk] = await db
    .select({ email: users.email })
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

  const role = o.makerId === uid ? ("maker" as const) : ("taker" as const);
  const youAreSeller = o.sellerUserId === uid;
  const youArePayer = o.payerUserId === uid;
  const youAreBuyer = o.buyerUserId === uid;
  const counterpartyId = o.makerId === uid ? o.takerId : o.makerId;
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
      releasedAt: o.releasedAt?.toISOString() ?? null,
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
      paymentSnapshot: o.paymentSnapshot,
      makerMasked: maskTraderEmail(mk?.email ?? ""),
      takerMasked: maskTraderEmail(tk?.email ?? ""),
      role,
      youAreSeller,
      youArePayer,
      youAreBuyer,
      createdAt: o.createdAt.toISOString(),
      paymentReference: o.paymentReference ?? null,
      paymentProofNote: o.paymentProofNote ?? null,
      disputeReason: o.disputeReason ?? null,
      disputedAt: o.disputedAt?.toISOString() ?? null,
      refundedAt: o.refundedAt?.toISOString() ?? null,
      platformFeeCrypto: o.platformFeeCrypto?.toString() ?? null,
      buyerReceivedCrypto: o.buyerReceivedCrypto?.toString() ?? null,
      counterpartyId,
      hasRated: !!existingRating,
      canRate: st === ST_RELEASED && !existingRating,
      chatAllowsNewMessages,
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

  const res = await db
    .update(p2pOrders)
    .set({
      status: ST_PAID,
      paidMarkedAt: now,
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
        .select()
        .from(p2pOrders)
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

      const cryptoStr = o.cryptoAmount.toString();
      const asset = asWalletCrypto(o.asset);
      const batchId = randomUUID();

      await creditUserAsset(tx, o.sellerUserId, asset, cryptoStr);

      await tx
        .update(p2pOrders)
        .set({
          status: ST_CANCELLED,
          cancelledAt: now,
          updatedAt: now,
        })
        .where(and(eq(p2pOrders.id, o.id), eq(p2pOrders.status, ST_AWAIT)));

      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: o.sellerUserId,
          entryType: "p2p_escrow_refund",
          asset: o.asset,
          amount: cryptoStr,
          feeUsdEquivalent: "0",
          counterpartyUserId: o.buyerUserId,
          meta: { orderId: o.id, reason: "cancelled" },
        },
      ]);
    });
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
  const res = await db
    .update(p2pOrders)
    .set({
      status: ST_DISPUTED,
      disputeReason: reason,
      disputedAt: now,
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
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      if (msg === "p2p_order_not_found") return { ok: false, message: msg };
      return { ok: false, message: "p2p_action_not_allowed" };
    }
  }

  try {
    await db.transaction(async (tx) => {
      const [o] = await tx
        .select()
        .from(p2pOrders)
        .where(and(eq(p2pOrders.id, args.orderId), eq(p2pOrders.status, ST_DISPUTED)))
        .limit(1);
      if (!o) throw new Error("p2p_order_not_found");

      const cryptoStr = o.cryptoAmount.toString();
      const asset = asWalletCrypto(o.asset);
      const batchId = randomUUID();

      await creditUserAsset(tx, o.sellerUserId, asset, cryptoStr);

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
          meta: { orderId: o.id, reason: "dispute_refund_seller" },
        },
      ]);
    });
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
      senderMasked: maskTraderEmail(r.email),
      own: r.uid === args.userId,
    })),
  };
}

export async function postP2pOrderMessage(args: {
  orderId: string;
  userId: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = args.body.trim();
  if (text.length < 1) return { ok: false, message: "p2p_chat_empty" };
  if (text.length > 2000) return { ok: false, message: "p2p_chat_too_long" };

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
    body: text,
  });

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
