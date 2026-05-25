import { eq } from "drizzle-orm";
import { getDb, platformSettings } from "@/db";
import {
  defaultLandingPromosConfig,
  LANDING_PROMOS_SETTING_KEY,
  landingPromosConfigZ,
  mergeLandingPromosWithDefaults,
  type LandingPromosConfig,
} from "@/lib/landing-promos-config";

export {
  LANDING_PROMOS_SETTING_KEY,
  LANDING_PROMO_SLOT_IDS,
  landingPromosConfigZ,
  defaultLandingPromosConfig,
  resolveLandingPromos,
  mergeLandingPromosWithDefaults,
} from "@/lib/landing-promos-config";
export type {
  LandingPromoSlotId,
  LandingPromosConfig,
  ResolvedLandingPromo,
} from "@/lib/landing-promos-config";

export async function getLandingPromosConfig(): Promise<LandingPromosConfig> {
  const db = getDb();
  const [row] = await db
    .select({ value: platformSettings.value })
    .from(platformSettings)
    .where(eq(platformSettings.key, LANDING_PROMOS_SETTING_KEY))
    .limit(1);
  if (!row?.value) return defaultLandingPromosConfig();
  try {
    const parsed = landingPromosConfigZ.safeParse(JSON.parse(row.value));
    if (!parsed.success) return defaultLandingPromosConfig();
    return mergeLandingPromosWithDefaults(parsed.data);
  } catch {
    return defaultLandingPromosConfig();
  }
}

export async function setLandingPromosConfig(config: LandingPromosConfig): Promise<void> {
  const merged = mergeLandingPromosWithDefaults(config);
  const parsed = landingPromosConfigZ.safeParse(merged);
  if (!parsed.success) {
    throw new Error("landing_promos_invalid");
  }
  const db = getDb();
  await db
    .insert(platformSettings)
    .values({
      key: LANDING_PROMOS_SETTING_KEY,
      value: JSON.stringify(parsed.data),
    })
    .onConflictDoUpdate({
      target: platformSettings.key,
      set: { value: JSON.stringify(parsed.data), updatedAt: new Date() },
    });
}
