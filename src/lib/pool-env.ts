export function getCronSecret(): string {
  const s = process.env.CRON_SECRET?.trim();
  if (!s || s.length < 12) {
    throw new Error("CRON_SECRET must be set (min 12 chars)");
  }
  return s;
}

