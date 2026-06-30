/**
 * In-app notifications for P2P order lifecycle (counterparty actions, chat, disputes).
 */

import { eq } from "drizzle-orm";
import { getDb, p2pOrders } from "@/db";
import { createUserNotification, type NotificationKind } from "@/lib/notifications-service";

export type P2pNotificationKind =
  | "p2p_order_created"
  | "p2p_order_paid"
  | "p2p_order_proof"
  | "p2p_order_released"
  | "p2p_order_cancelled"
  | "p2p_order_expired"
  | "p2p_order_expiring"
  | "p2p_release_reminder"
  | "p2p_order_auto_released"
  | "p2p_order_disputed"
  | "p2p_order_dispute_released"
  | "p2p_order_dispute_refunded"
  | "p2p_order_message"
  | "p2p_order_support_message";

export type P2pOrderNotifyCtx = {
  id: string;
  makerId: string;
  takerId: string;
  sellerUserId: string;
  buyerUserId: string;
  payerUserId: string;
  asset: string;
  fiatAmount: string;
  fiatCurrency: string;
  cryptoAmount: string;
  status: string;
};

export async function fetchOrderNotifyCtx(
  orderId: string,
): Promise<P2pOrderNotifyCtx | null> {
  const db = getDb();
  const [o] = await db
    .select({
      id: p2pOrders.id,
      makerId: p2pOrders.makerId,
      takerId: p2pOrders.takerId,
      sellerUserId: p2pOrders.sellerUserId,
      buyerUserId: p2pOrders.buyerUserId,
      payerUserId: p2pOrders.payerUserId,
      asset: p2pOrders.asset,
      fiatAmount: p2pOrders.fiatAmount,
      fiatCurrency: p2pOrders.fiatCurrency,
      cryptoAmount: p2pOrders.cryptoAmount,
      status: p2pOrders.status,
    })
    .from(p2pOrders)
    .where(eq(p2pOrders.id, orderId))
    .limit(1);
  if (!o) return null;
  return {
    id: o.id,
    makerId: o.makerId,
    takerId: o.takerId,
    sellerUserId: o.sellerUserId,
    buyerUserId: o.buyerUserId,
    payerUserId: o.payerUserId,
    asset: String(o.asset),
    fiatAmount: o.fiatAmount.toString(),
    fiatCurrency: String(o.fiatCurrency),
    cryptoAmount: o.cryptoAmount.toString(),
    status: String(o.status),
  };
}

function orderPayload(
  o: P2pOrderNotifyCtx,
  extra?: Record<string, unknown>,
): Record<string, unknown> {
  return {
    orderId: o.id,
    asset: o.asset,
    amount: o.cryptoAmount,
    fiatAmount: o.fiatAmount,
    fiatCurrency: o.fiatCurrency,
    ...extra,
  };
}

function counterpartyId(o: P2pOrderNotifyCtx, actorUserId: string): string {
  return o.makerId === actorUserId ? o.takerId : o.makerId;
}

async function notify(
  userId: string,
  kind: P2pNotificationKind,
  payload: Record<string, unknown>,
): Promise<void> {
  await createUserNotification({
    userId,
    kind: kind as NotificationKind,
    payload,
  });
}

/** New order started — notify ad owner (maker). */
export async function notifyP2pOrderCreated(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.makerId, "p2p_order_created", orderPayload(o));
}

/** Payer marked fiat paid — notify seller (must release). */
export async function notifyP2pOrderPaid(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.sellerUserId, "p2p_order_paid", orderPayload(o));
}

/** Payment proof uploaded — notify seller. */
export async function notifyP2pOrderProof(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.sellerUserId, "p2p_order_proof", orderPayload(o));
}

/** Crypto released to buyer. */
export async function notifyP2pOrderReleased(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.buyerUserId, "p2p_order_released", orderPayload(o));
}

/** Order cancelled — notify the other party. */
export async function notifyP2pOrderCancelled(
  o: P2pOrderNotifyCtx,
  actorUserId: string,
): Promise<void> {
  const other = counterpartyId(o, actorUserId);
  await notify(other, "p2p_order_cancelled", orderPayload(o));
}

/** Payment window expired — notify both traders. */
export async function notifyP2pOrderExpired(o: P2pOrderNotifyCtx): Promise<void> {
  const payload = orderPayload(o);
  await notify(o.makerId, "p2p_order_expired", payload);
  if (o.takerId !== o.makerId) {
    await notify(o.takerId, "p2p_order_expired", payload);
  }
}

/** Payment window closing soon — notify payer only. */
export async function notifyP2pOrderExpiring(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.payerUserId, "p2p_order_expiring", orderPayload(o));
}

/** Auto-release approaching — notify seller. */
export async function notifyP2pReleaseReminder(o: P2pOrderNotifyCtx): Promise<void> {
  await notify(o.sellerUserId, "p2p_release_reminder", orderPayload(o));
}

/** Cron auto-released crypto to buyer — notify both parties. */
export async function notifyP2pOrderAutoReleased(o: P2pOrderNotifyCtx): Promise<void> {
  const payload = orderPayload(o, { autoReleased: true });
  await notify(o.buyerUserId, "p2p_order_auto_released", payload);
  if (o.sellerUserId !== o.buyerUserId) {
    await notify(o.sellerUserId, "p2p_order_auto_released", payload);
  }
}

/** Dispute opened — notify counterparty. */
export async function notifyP2pOrderDisputed(
  o: P2pOrderNotifyCtx,
  actorUserId: string,
): Promise<void> {
  const other = counterpartyId(o, actorUserId);
  await notify(other, "p2p_order_disputed", orderPayload(o));
}

/** Admin resolved dispute — release to buyer. */
export async function notifyP2pDisputeReleased(o: P2pOrderNotifyCtx): Promise<void> {
  const payload = orderPayload(o);
  await notify(o.buyerUserId, "p2p_order_dispute_released", payload);
  if (o.sellerUserId !== o.buyerUserId) {
    await notify(o.sellerUserId, "p2p_order_dispute_released", payload);
  }
}

/** Admin resolved dispute — refund seller. */
export async function notifyP2pDisputeRefunded(o: P2pOrderNotifyCtx): Promise<void> {
  const payload = orderPayload(o);
  await notify(o.sellerUserId, "p2p_order_dispute_refunded", payload);
  if (o.buyerUserId !== o.sellerUserId) {
    await notify(o.buyerUserId, "p2p_order_dispute_refunded", payload);
  }
}

/** Trade chat message — notify counterparty. */
export async function notifyP2pOrderMessage(
  o: P2pOrderNotifyCtx,
  senderUserId: string,
  preview: string,
): Promise<void> {
  const other = counterpartyId(o, senderUserId);
  await notify(other, "p2p_order_message", orderPayload(o, { preview: preview.slice(0, 120) }));
}

/** Support message on dispute — notify both traders. */
export async function notifyP2pSupportMessage(
  o: P2pOrderNotifyCtx,
  preview: string,
): Promise<void> {
  const payload = orderPayload(o, { preview: preview.slice(0, 120) });
  await notify(o.makerId, "p2p_order_support_message", payload);
  if (o.takerId !== o.makerId) {
    await notify(o.takerId, "p2p_order_support_message", payload);
  }
}
