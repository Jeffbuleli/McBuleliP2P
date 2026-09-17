import { randomUUID } from "node:crypto";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import {
  getDb,
  eavecMarketListings,
  eavecMarketOrders,
  eavecMarketRatings,
  fiatFreshpayTransactions,
  users,
} from "@/db";
import { debitUserAsset, creditUserAsset } from "@/lib/wallet-move-assets";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import type { WalletAsset } from "@/lib/wallet-types";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { hasPawapayKeys } from "@/lib/env";
import { pawapayPayIn } from "@/lib/pawapay/provider";
import { resolvePawapayProvider, toPawapayProviderId } from "@/lib/cod-mobile-providers";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";

export type EavecMarketOrderStatus =
  | "awaiting_payment"
  | "escrowed"
  | "ready"
  | "released"
  | "cancelled"
  | "disputed"
  | "expired";

export type EavecMarketPaymentMethod = "wallet" | "momo";

export type EavecMarketOrderRow = {
  id: string;
  listingId: string;
  buyerUserId: string;
  sellerUserId: string;
  quantity: number;
  currency: string;
  escrowAsset: string;
  unitPrice: string;
  totalAmount: string;
  status: EavecMarketOrderStatus;
  paymentMethod: EavecMarketPaymentMethod;
  fiatDepositRef: string | null;
  momoPhone: string | null;
  listingTitle: string;
  escrowedAt: string | null;
  readyAt: string | null;
  releasedAt: string | null;
  cancelledAt: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  disputeResolution: "refund" | "release" | null;
  expiresAt: string | null;
  role: "buyer" | "seller";
  /** Gross MoMo charge when paying by mobile money (includes platform fee). */
  momoGrossAmount?: string | null;
  myRatingStars: number | null;
  canRate: boolean;
};

const CONFIRM_WINDOW_HOURS = 72;
const MOMO_PAY_WINDOW_MINUTES = 30;

function mapOrder(
  o: typeof eavecMarketOrders.$inferSelect,
  viewerId: string,
  myRatingStars: number | null = null,
): EavecMarketOrderRow {
  const total = Number(o.totalAmount);
  const momoGross =
    o.paymentMethod === "momo" && Number.isFinite(total)
      ? fmtWalletAmount(total / (1 - FIAT_FEE_RATE))
      : null;
  const resolution =
    o.disputeResolution === "refund" || o.disputeResolution === "release"
      ? o.disputeResolution
      : null;
  return {
    id: o.id,
    listingId: o.listingId,
    buyerUserId: o.buyerUserId,
    sellerUserId: o.sellerUserId,
    quantity: o.quantity,
    currency: o.currency,
    escrowAsset: o.escrowAsset,
    unitPrice: String(o.unitPrice),
    totalAmount: String(o.totalAmount),
    status: o.status as EavecMarketOrderStatus,
    paymentMethod: (o.paymentMethod === "momo" ? "momo" : "wallet") as EavecMarketPaymentMethod,
    fiatDepositRef: o.fiatDepositRef ?? null,
    momoPhone: o.momoPhone ?? null,
    listingTitle: o.listingTitle,
    escrowedAt: o.escrowedAt?.toISOString() ?? null,
    readyAt: o.readyAt?.toISOString() ?? null,
    releasedAt: o.releasedAt?.toISOString() ?? null,
    cancelledAt: o.cancelledAt?.toISOString() ?? null,
    disputedAt: o.disputedAt?.toISOString() ?? null,
    disputeReason: o.disputeReason ?? null,
    disputeResolution: resolution,
    expiresAt: o.expiresAt?.toISOString() ?? null,
    role: o.buyerUserId === viewerId ? "buyer" : "seller",
    momoGrossAmount: momoGross,
    myRatingStars,
    canRate:
      o.status === "released" &&
      o.buyerUserId === viewerId &&
      myRatingStars == null,
  };
}

async function pickEscrowAsset(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  userId: string,
  currency: string,
  total: number,
): Promise<WalletAsset> {
  const [u] = await tx
    .select({
      cdfBalance: users.cdfBalance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) throw new Error("wallet_not_found");

  const cdf = numFromNumeric(u.cdfBalance);

  if (currency === "CDF") {
    if (cdf + 1e-9 < total) throw new Error("wallet_insufficient_balance");
    return "CDF";
  }
  throw new Error("eavec_market_cdf_only");
}

function reserveListingQty(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tx: any,
  listing: typeof eavecMarketListings.$inferSelect,
  qty: number,
  now: Date,
) {
  const nextQty = listing.quantity - qty;
  return tx
    .update(eavecMarketListings)
    .set({
      quantity: nextQty,
      status: nextQty <= 0 ? "sold" : "available",
      updatedAt: now,
    })
    .where(eq(eavecMarketListings.id, listing.id));
}

export async function createEavecMarketOrder(args: {
  buyerUserId: string;
  listingId: string;
  quantity?: number;
  paymentMethod?: EavecMarketPaymentMethod;
  phoneNumber?: string;
  provider?: string;
  providerLabel?: string;
}): Promise<
  | { ok: true; id: string; depositId?: string; status: string }
  | { ok: false; error: string }
> {
  const method: EavecMarketPaymentMethod =
    args.paymentMethod === "momo" ? "momo" : "wallet";
  if (method === "momo") {
    return { ok: false, error: "eavec_market_wallet_only" };
  }
  const qty = Math.min(Math.max(Math.floor(args.quantity ?? 1), 1), 999);

  const db = getDb();
  try {
    const id = await db.transaction(async (tx) => {
      const [listing] = await tx
        .select()
        .from(eavecMarketListings)
        .where(eq(eavecMarketListings.id, args.listingId))
        .limit(1);
      if (!listing || listing.status !== "available") {
        throw new Error("eavec_market_listing_unavailable");
      }
      if (listing.sellerUserId === args.buyerUserId) {
        throw new Error("eavec_market_own_listing");
      }
      if (listing.quantity < qty) {
        throw new Error("eavec_market_qty");
      }
      if (listing.currency !== "CDF") {
        throw new Error("eavec_market_cdf_only");
      }

      const unit = Number(listing.price);
      if (!Number.isFinite(unit) || unit <= 0) throw new Error("eavec_market_bad_price");
      const total = Number((unit * qty).toFixed(2));
      const totalStr = fmtWalletAmount(total);
      const asset = await pickEscrowAsset(tx, args.buyerUserId, "CDF", total);

      await debitUserAsset(tx, args.buyerUserId, asset, totalStr);
      const batchId = randomUUID();
      await insertWalletLedgerLines(tx, [
        {
          batchId,
          userId: args.buyerUserId,
          entryType: "eavec_market_escrow_lock",
          asset,
          amount: `-${totalStr}`,
          feeUsdEquivalent: "0",
          counterpartyUserId: listing.sellerUserId,
          meta: {
            listingId: listing.id,
            quantity: qty,
            currency: listing.currency,
          },
        },
      ]);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + CONFIRM_WINDOW_HOURS * 3600_000);
      await reserveListingQty(tx, listing, qty, now);

      const [order] = await tx
        .insert(eavecMarketOrders)
        .values({
          listingId: listing.id,
          buyerUserId: args.buyerUserId,
          sellerUserId: listing.sellerUserId,
          quantity: qty,
          currency: listing.currency,
          escrowAsset: asset,
          unitPrice: unit.toFixed(2),
          totalAmount: total.toFixed(2),
          status: "escrowed",
          paymentMethod: "wallet",
          listingTitle: listing.title,
          listingSnapshot: {
            category: listing.category,
            kind: listing.kind,
            locationLabel: listing.locationLabel,
            imageUrl: listing.imageUrl,
          },
          escrowedAt: now,
          expiresAt,
        })
        .returning({ id: eavecMarketOrders.id });

      if (!order) throw new Error("eavec_market_order_failed");
      return order.id;
    });
    return { ok: true, id, status: "escrowed" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "eavec_market_order_failed";
    return { ok: false, error: msg };
  }
}

async function createMomoMarketOrder(args: {
  buyerUserId: string;
  listingId: string;
  quantity: number;
  phoneNumber: string;
  provider: string;
  providerLabel?: string;
}): Promise<
  | { ok: true; id: string; depositId: string; status: string }
  | { ok: false; error: string }
> {
  if (isFiatDepositWithdrawPaused()) {
    return { ok: false, error: "wallet_fiat_paused" };
  }
  if (!hasPawapayKeys()) {
    return { ok: false, error: "wallet_fiat_unconfigured" };
  }

  const phone = normalizeCodPhoneNumber(args.phoneNumber);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false, error: "wallet_fiat_invalid_phone" };
  }
  if (!args.provider.trim()) {
    return { ok: false, error: "wallet_fiat_invalid_provider" };
  }

  const db = getDb();
  try {
    const prepared = await db.transaction(async (tx) => {
      const [listing] = await tx
        .select()
        .from(eavecMarketListings)
        .where(eq(eavecMarketListings.id, args.listingId))
        .limit(1);
      if (!listing || listing.status !== "available") {
        throw new Error("eavec_market_listing_unavailable");
      }
      if (listing.sellerUserId === args.buyerUserId) {
        throw new Error("eavec_market_own_listing");
      }
      if (listing.quantity < args.quantity) {
        throw new Error("eavec_market_qty");
      }
      const currency: "USD" | "CDF" =
        listing.currency === "CDF" ? "CDF" : "USD";

      const unit = Number(listing.price);
      if (!Number.isFinite(unit) || unit <= 0) throw new Error("eavec_market_bad_price");
      const total = Number((unit * args.quantity).toFixed(2));
      const gross = Number((total / (1 - FIAT_FEE_RATE)).toFixed(currency === "CDF" ? 0 : 2));
      if (!Number.isFinite(gross) || gross <= 0) throw new Error("eavec_market_bad_price");

      const now = new Date();
      await reserveListingQty(tx, listing, args.quantity, now);
      const expiresAt = new Date(now.getTime() + MOMO_PAY_WINDOW_MINUTES * 60_000);
      const depositRef = randomUUID();

      const [order] = await tx
        .insert(eavecMarketOrders)
        .values({
          listingId: listing.id,
          buyerUserId: args.buyerUserId,
          sellerUserId: listing.sellerUserId,
          quantity: args.quantity,
          currency,
          escrowAsset: currency,
          unitPrice: unit.toFixed(2),
          totalAmount: total.toFixed(2),
          status: "awaiting_payment",
          paymentMethod: "momo",
          fiatDepositRef: depositRef,
          momoPhone: phone,
          listingTitle: listing.title,
          listingSnapshot: {
            category: listing.category,
            kind: listing.kind,
            locationLabel: listing.locationLabel,
            imageUrl: listing.imageUrl,
            momoGross: fmtWalletAmount(gross),
          },
          escrowedAt: null,
          expiresAt,
        })
        .returning({ id: eavecMarketOrders.id });

      if (!order) throw new Error("eavec_market_order_failed");
      return {
        orderId: order.id,
        depositRef,
        currency,
        gross: fmtWalletAmount(gross),
        total: fmtWalletAmount(total),
      };
    });

    const network = resolvePawapayProvider(phone, args.provider);
    const providerId = toPawapayProviderId(network.method);
    const r = await pawapayPayIn({
      depositId: prepared.depositRef,
      amount: prepared.gross,
      currency: prepared.currency,
      phoneNumber: phone,
      provider: providerId,
    });

    if (!r.accepted) {
      await cancelAwaitingOrderInternal(prepared.orderId, "momo_rejected");
      return { ok: false, error: "wallet_fiat_deposit_rejected" };
    }

    await db.insert(fiatFreshpayTransactions).values({
      userId: args.buyerUserId,
      kind: "deposit",
      status: "PROCESSING",
      reference: prepared.depositRef,
      currency: prepared.currency,
      amount: prepared.gross,
      phoneNumber: phone,
      provider: providerId,
      meta: {
        rail: "pawapay",
        providerLabel: args.providerLabel ?? null,
        selectedProvider: args.provider.trim(),
        networkDetected: network.detected,
        networkMatched: network.matched,
        eavecMarketOrderId: prepared.orderId,
        eavecMarketEscrowNet: prepared.total,
      },
    });

    return {
      ok: true,
      id: prepared.orderId,
      depositId: prepared.depositRef,
      status: "awaiting_payment",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "eavec_market_order_failed";
    return { ok: false, error: msg };
  }
}

async function cancelAwaitingOrderInternal(orderId: string, reason: string) {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(eavecMarketOrders)
      .where(eq(eavecMarketOrders.id, orderId))
      .limit(1);
    if (!o || o.status !== "awaiting_payment") return;
    const now = new Date();
    await tx
      .update(eavecMarketOrders)
      .set({
        status: "cancelled",
        cancelledAt: now,
        cancelReason: reason.slice(0, 64),
        updatedAt: now,
      })
      .where(
        and(
          eq(eavecMarketOrders.id, orderId),
          eq(eavecMarketOrders.status, "awaiting_payment"),
        ),
      );
    await tx
      .update(eavecMarketListings)
      .set({
        quantity: sql`${eavecMarketListings.quantity} + ${o.quantity}`,
        status: "available",
        updatedAt: now,
      })
      .where(eq(eavecMarketListings.id, o.listingId));
  });
}

/**
 * After MoMo deposit credited the buyer wallet, lock escrow for the linked order.
 * Called from PawaPay/FreshPay deposit success handlers (same DB).
 */
export async function finalizeEavecMarketOrderAfterMomoDeposit(args: {
  orderId: string;
  buyerUserId: string;
  fiatDepositRef: string;
}): Promise<void> {
  const db = getDb();
  await db.transaction(async (tx) => {
    const [o] = await tx
      .select()
      .from(eavecMarketOrders)
      .where(eq(eavecMarketOrders.id, args.orderId))
      .limit(1);
    if (!o) return;
    if (o.buyerUserId !== args.buyerUserId) return;
    if (o.status !== "awaiting_payment") return;

    const asset = (o.currency === "CDF" ? "CDF" : "USD") as WalletAsset;
    const totalStr = fmtWalletAmount(Number(o.totalAmount));
    const now = new Date();

    await debitUserAsset(tx, o.buyerUserId, asset, totalStr);
    await insertWalletLedgerLines(tx, [
      {
        batchId: randomUUID(),
        userId: o.buyerUserId,
        entryType: "eavec_market_escrow_lock",
        asset,
        amount: `-${totalStr}`,
        feeUsdEquivalent: "0",
        counterpartyUserId: o.sellerUserId,
        meta: {
          orderId: o.id,
          listingId: o.listingId,
          fiatDepositRef: args.fiatDepositRef,
          paymentMethod: "momo",
        },
      },
    ]);

    const expiresAt = new Date(now.getTime() + CONFIRM_WINDOW_HOURS * 3600_000);
    await tx
      .update(eavecMarketOrders)
      .set({
        status: "escrowed",
        escrowAsset: asset,
        escrowedAt: now,
        expiresAt,
        fiatDepositRef: args.fiatDepositRef,
        updatedAt: now,
      })
      .where(
        and(
          eq(eavecMarketOrders.id, o.id),
          eq(eavecMarketOrders.status, "awaiting_payment"),
        ),
      );
  });
}

export async function listEavecMarketOrdersForUser(
  userId: string,
): Promise<EavecMarketOrderRow[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(eavecMarketOrders)
    .where(
      or(
        eq(eavecMarketOrders.buyerUserId, userId),
        eq(eavecMarketOrders.sellerUserId, userId),
      ),
    )
    .orderBy(desc(eavecMarketOrders.createdAt))
    .limit(50);

  const orderIds = rows.map((r) => r.id);
  const ratingByOrder = new Map<string, number>();
  if (orderIds.length) {
    const ratings = await db
      .select({
        orderId: eavecMarketRatings.orderId,
        stars: eavecMarketRatings.stars,
      })
      .from(eavecMarketRatings)
      .where(
        and(
          eq(eavecMarketRatings.fromUserId, userId),
          inArray(eavecMarketRatings.orderId, orderIds),
        ),
      );
    for (const r of ratings) ratingByOrder.set(r.orderId, r.stars);
  }

  return rows.map((r) => mapOrder(r, userId, ratingByOrder.get(r.id) ?? null));
}

export async function getEavecMarketOrder(
  id: string,
  viewerId: string,
): Promise<EavecMarketOrderRow | null> {
  const db = getDb();
  const [o] = await db
    .select()
    .from(eavecMarketOrders)
    .where(eq(eavecMarketOrders.id, id))
    .limit(1);
  if (!o) return null;
  if (o.buyerUserId !== viewerId && o.sellerUserId !== viewerId) return null;

  const [rating] = await db
    .select({ stars: eavecMarketRatings.stars })
    .from(eavecMarketRatings)
    .where(
      and(
        eq(eavecMarketRatings.orderId, id),
        eq(eavecMarketRatings.fromUserId, viewerId),
      ),
    )
    .limit(1);

  return mapOrder(o, viewerId, rating?.stars ?? null);
}

export async function eavecMarketOrderAction(args: {
  orderId: string;
  userId: string;
  action:
    | "mark_ready"
    | "confirm"
    | "cancel"
    | "dispute"
    | "resolve_refund"
    | "resolve_release";
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  try {
    await db.transaction(async (tx) => {
      const [o] = await tx
        .select()
        .from(eavecMarketOrders)
        .where(eq(eavecMarketOrders.id, args.orderId))
        .limit(1);
      if (!o) throw new Error("eavec_market_order_not_found");

      const now = new Date();
      const asset = o.escrowAsset as WalletAsset;
      const totalStr = fmtWalletAmount(Number(o.totalAmount));
      const batchId = randomUUID();

      if (args.action === "mark_ready") {
        if (o.sellerUserId !== args.userId) throw new Error("forbidden");
        if (o.status !== "escrowed") throw new Error("eavec_market_bad_status");
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({ status: "ready", readyAt: now, updatedAt: now })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              eq(eavecMarketOrders.status, "escrowed"),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");
        return;
      }

      if (args.action === "confirm") {
        if (o.buyerUserId !== args.userId) throw new Error("forbidden");
        if (o.status !== "ready" && o.status !== "escrowed") {
          throw new Error("eavec_market_bad_status");
        }
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({ status: "released", releasedAt: now, updatedAt: now })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              or(
                eq(eavecMarketOrders.status, "ready"),
                eq(eavecMarketOrders.status, "escrowed"),
              ),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");

        await creditUserAsset(tx, o.sellerUserId, asset, totalStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: o.sellerUserId,
            entryType: "eavec_market_release",
            asset,
            amount: totalStr,
            feeUsdEquivalent: "0",
            counterpartyUserId: o.buyerUserId,
            meta: { orderId: o.id, listingId: o.listingId },
          },
        ]);
        return;
      }

      if (args.action === "cancel") {
        const isBuyer = o.buyerUserId === args.userId;
        const isSeller = o.sellerUserId === args.userId;
        if (!isBuyer && !isSeller) throw new Error("forbidden");

        if (o.status === "awaiting_payment") {
          if (!isBuyer && !isSeller) throw new Error("forbidden");
          const [upd] = await tx
            .update(eavecMarketOrders)
            .set({
              status: "cancelled",
              cancelledAt: now,
              cancelReason: args.reason?.slice(0, 64) ?? (isBuyer ? "buyer" : "seller"),
              updatedAt: now,
            })
            .where(
              and(
                eq(eavecMarketOrders.id, o.id),
                eq(eavecMarketOrders.status, "awaiting_payment"),
              ),
            )
            .returning({ id: eavecMarketOrders.id });
          if (!upd) throw new Error("eavec_market_bad_status");
          await tx
            .update(eavecMarketListings)
            .set({
              quantity: sql`${eavecMarketListings.quantity} + ${o.quantity}`,
              status: "available",
              updatedAt: now,
            })
            .where(eq(eavecMarketListings.id, o.listingId));
          return;
        }

        if (o.status !== "escrowed") throw new Error("eavec_market_bad_status");
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({
            status: "cancelled",
            cancelledAt: now,
            cancelReason: args.reason?.slice(0, 64) ?? (isBuyer ? "buyer" : "seller"),
            updatedAt: now,
          })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              eq(eavecMarketOrders.status, "escrowed"),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");

        await creditUserAsset(tx, o.buyerUserId, asset, totalStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: o.buyerUserId,
            entryType: "eavec_market_escrow_refund",
            asset,
            amount: totalStr,
            feeUsdEquivalent: "0",
            counterpartyUserId: o.sellerUserId,
            meta: { orderId: o.id },
          },
        ]);

        await tx
          .update(eavecMarketListings)
          .set({
            quantity: sql`${eavecMarketListings.quantity} + ${o.quantity}`,
            status: "available",
            updatedAt: now,
          })
          .where(eq(eavecMarketListings.id, o.listingId));
        return;
      }

      if (args.action === "dispute") {
        if (o.buyerUserId !== args.userId && o.sellerUserId !== args.userId) {
          throw new Error("forbidden");
        }
        if (o.status !== "escrowed" && o.status !== "ready") {
          throw new Error("eavec_market_bad_status");
        }
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({
            status: "disputed",
            disputedAt: now,
            disputeReason: args.reason?.slice(0, 500) ?? null,
            updatedAt: now,
          })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              or(
                eq(eavecMarketOrders.status, "escrowed"),
                eq(eavecMarketOrders.status, "ready"),
              ),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");
        return;
      }

      if (args.action === "resolve_refund") {
        // Seller (or buyer concession) refunds locked escrow to buyer.
        if (o.buyerUserId !== args.userId && o.sellerUserId !== args.userId) {
          throw new Error("forbidden");
        }
        if (o.status !== "disputed") throw new Error("eavec_market_bad_status");
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({
            status: "cancelled",
            cancelledAt: now,
            cancelReason: "dispute_refund",
            disputeResolution: "refund",
            disputeResolvedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              eq(eavecMarketOrders.status, "disputed"),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");

        await creditUserAsset(tx, o.buyerUserId, asset, totalStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: o.buyerUserId,
            entryType: "eavec_market_escrow_refund",
            asset,
            amount: totalStr,
            feeUsdEquivalent: "0",
            counterpartyUserId: o.sellerUserId,
            meta: {
              orderId: o.id,
              listingId: o.listingId,
              disputeResolution: "refund",
            },
          },
        ]);
        await tx
          .update(eavecMarketListings)
          .set({
            quantity: sql`${eavecMarketListings.quantity} + ${o.quantity}`,
            status: "available",
            updatedAt: now,
          })
          .where(eq(eavecMarketListings.id, o.listingId));
        return;
      }

      if (args.action === "resolve_release") {
        // Buyer (or seller concession) releases escrow to seller.
        if (o.buyerUserId !== args.userId && o.sellerUserId !== args.userId) {
          throw new Error("forbidden");
        }
        if (o.status !== "disputed") throw new Error("eavec_market_bad_status");
        const [upd] = await tx
          .update(eavecMarketOrders)
          .set({
            status: "released",
            releasedAt: now,
            disputeResolution: "release",
            disputeResolvedAt: now,
            updatedAt: now,
          })
          .where(
            and(
              eq(eavecMarketOrders.id, o.id),
              eq(eavecMarketOrders.status, "disputed"),
            ),
          )
          .returning({ id: eavecMarketOrders.id });
        if (!upd) throw new Error("eavec_market_bad_status");

        await creditUserAsset(tx, o.sellerUserId, asset, totalStr);
        await insertWalletLedgerLines(tx, [
          {
            batchId,
            userId: o.sellerUserId,
            entryType: "eavec_market_release",
            asset,
            amount: totalStr,
            feeUsdEquivalent: "0",
            counterpartyUserId: o.buyerUserId,
            meta: {
              orderId: o.id,
              listingId: o.listingId,
              disputeResolution: "release",
            },
          },
        ]);
        return;
      }

      throw new Error("eavec_market_bad_action");
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "eavec_market_action_failed";
    return { ok: false, error: msg };
  }
}
