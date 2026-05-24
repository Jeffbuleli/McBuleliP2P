import { diditWebhookEvents, getDb } from "@/db";

/**
 * Claim a Didit webhook delivery by event_id (V3 idempotency key).
 * Returns true if this is the first time we see this event_id.
 */
export async function claimDiditWebhookEvent(
  eventId: string | null | undefined,
): Promise<boolean> {
  const id = eventId?.trim();
  if (!id) return true;

  try {
    const db = getDb();
    const rows = await db
      .insert(diditWebhookEvents)
      .values({ eventId: id })
      .onConflictDoNothing()
      .returning({ eventId: diditWebhookEvents.eventId });
    return rows.length > 0;
  } catch (err) {
    console.warn("[didit] webhook idempotency skipped", err);
    return true;
  }
}
