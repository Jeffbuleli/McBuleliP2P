import { eq } from "drizzle-orm";
import { getDb, platformSettings } from "@/db";

const PREFIX = "bots_tech_smooth:";

export async function getSmoothedScoreState(
  instanceId: string,
): Promise<number | null> {
  const db = getDb();
  const key = `${PREFIX}${instanceId}`;
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);
  if (!row?.value) return null;
  try {
    const parsed = JSON.parse(row.value) as { score?: number };
    return typeof parsed.score === "number" ? parsed.score : null;
  } catch {
    return null;
  }
}

export async function setSmoothedScoreState(
  instanceId: string,
  score: number,
): Promise<void> {
  const db = getDb();
  const key = `${PREFIX}${instanceId}`;
  const value = JSON.stringify({ score, ts: new Date().toISOString() });
  await db
    .insert(platformSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedAt: new Date() },
    });
}
