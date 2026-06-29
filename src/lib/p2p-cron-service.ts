import {
  processAutoReleaseP2pOrders,
  processExpiredP2pOrders,
  processExpiringP2pOrderReminders,
  processP2pReleaseReminders,
} from "@/lib/p2p-service";

export type P2pCronTickResult = {
  expiredProcessed: number;
  paymentRemindersSent: number;
  releaseRemindersSent: number;
  autoReleased: number;
};

/** Server cron entry - expire, remind, auto-release P2P orders. */
export async function runP2pCronTick(): Promise<P2pCronTickResult> {
  const paymentRemindersSent = await processExpiringP2pOrderReminders();
  const releaseRemindersSent = await processP2pReleaseReminders();
  const expiredProcessed = await processExpiredP2pOrders();
  const autoReleased = await processAutoReleaseP2pOrders();
  return { expiredProcessed, paymentRemindersSent, releaseRemindersSent, autoReleased };
}
