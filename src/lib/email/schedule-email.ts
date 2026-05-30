import { after } from "next/server";

/**
 * Run email work after the HTTP response on serverless (Next.js lifecycle extension).
 * Falls back to fire-and-forget when `after` is unavailable (cron scripts).
 */
export function scheduleEmailTask(task: () => Promise<void>): void {
  try {
    after(async () => {
      try {
        await task();
      } catch (e) {
        console.error("[email] scheduled task failed", e);
      }
    });
  } catch {
    void task().catch((e) => {
      console.error("[email] background task failed", e);
    });
  }
}

/** Prefer awaiting in cron/worker paths; use schedule in user-facing API routes. */
export async function runEmailTask(task: () => Promise<void>): Promise<void> {
  try {
    await task();
  } catch (e) {
    console.error("[email] task failed", e);
  }
}

/** Run non-email background work after the HTTP response (worker, webhooks, etc.). */
export function scheduleBackgroundTask(task: () => Promise<void>): void {
  try {
    after(async () => {
      try {
        await task();
      } catch (e) {
        console.error("[background] scheduled task failed", e);
      }
    });
  } catch {
    void task().catch((e) => {
      console.error("[background] task failed", e);
    });
  }
}
