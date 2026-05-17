import { eq } from "drizzle-orm";
import { getDb, platformSettings } from "@/db";

export const PlatformSettingKey = {
  PI_RECEIVE_ADDRESS_REAL: "pi_receive_address_real",
  PI_RECEIVE_ADDRESS_TEST: "pi_receive_address_test",
  BOTS_CRON_LAST_RUN: "bots_cron_last_run",
} as const;

export type PlatformSettingKeyType =
  (typeof PlatformSettingKey)[keyof typeof PlatformSettingKey];

export async function getPlatformSetting(
  key: PlatformSettingKeyType | typeof PlatformSettingKey.BOTS_CRON_LAST_RUN,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, key))
    .limit(1);
  return row?.value ?? null;
}

export async function setPlatformSetting(
  key: PlatformSettingKeyType | typeof PlatformSettingKey.BOTS_CRON_LAST_RUN,
  value: string,
): Promise<void> {
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({ key, value })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

