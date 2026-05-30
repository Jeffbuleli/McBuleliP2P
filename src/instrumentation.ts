/**
 * Optional in-process bot scheduler (Render single web instance).
 * Set BOT_CRON_INLINE=1 and CRON_SECRET on production.
 * Calls the same HTTP route as Render Cron — no heavy imports at boot.
 */
export async function register() {
  if (process.env.NODE_ENV === "production") {
    const cronSecret = process.env.CRON_SECRET?.trim() ?? "";
    if (cronSecret.length < 12) {
      console.warn(
        "[cron] CRON_SECRET missing on Web service — wallet/bots crons will fail until set (see docs/wallet-cron-render.md)",
      );
    }
  }

  if (process.env.BOT_CRON_INLINE !== "1") return;
  if (process.env.NODE_ENV !== "production") return;

  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || secret.length < 12) {
    console.warn("[bots-cron:inline] CRON_SECRET missing — inline scheduler disabled");
    return;
  }

  const { cronIntervalMs, BOT_CRON_MIN_INTERVAL_MS } = await import(
    "@/lib/bot-cron-interval"
  );
  const intervalMs = cronIntervalMs();
  if (!Number.isFinite(intervalMs) || intervalMs < BOT_CRON_MIN_INTERVAL_MS) return;

  const port = process.env.PORT ?? "3000";
  const base =
    process.env.BOT_CRON_BASE_URL?.replace(/\/$/, "") ??
    `http://127.0.0.1:${port}`;
  const url = `${base}/api/internal/bots/tick`;

  const tick = () =>
    fetch(url, {
      method: "POST",
      headers: { "x-cron-secret": secret },
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("[bots-cron:inline] HTTP", res.status, body.slice(0, 200));
        }
      })
      .catch((e) => {
        console.error("[bots-cron:inline]", e);
      });

  setTimeout(() => void tick(), 20_000);
  setInterval(() => void tick(), intervalMs);
}
