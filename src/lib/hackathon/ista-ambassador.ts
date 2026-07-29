/**
 * Coordination Estudiantine DEISTA (ISTA Kinshasa) — ambassadeur campus ISTA-KIN.
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb, hackathonPromoCodes } from "@/db";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
} from "@/lib/hackathon/promo-types";
import {
  discountedPriceUsd,
  generatePromoDashboardToken,
  normalizePromoCode,
  partnerDashboardUrl,
  partnerShareUrl,
} from "@/lib/hackathon/promo";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";

export const ISTA_AMB_EMAIL = "coordinationestudiantinedeista@gmail.com";
export const ISTA_AMB_NAME = "Coordination Estudiantine DEISTA";
export const ISTA_AMB_ORG = "Coordination Estudiantine DEISTA (ISTA Kinshasa)";
export const ISTA_AMB_PROMO_CODE = "ISTA-KIN";

export type IstaAmbassadorAssets = {
  editionId: string;
  promoCode: string;
  priceUsd: string;
  shareUrl: string;
  dashboardUrl: string;
};

/** Idempotent: promo ambassadeur ISTA-KIN pour la coordination estudiantine. */
export async function ensureIstaAmbassadorAssets(): Promise<IstaAmbassadorAssets> {
  const editionId = await ensurePartnerOrgsSeeded();
  if (!editionId) throw new Error("no_edition");

  const db = getDb();
  const code = normalizePromoCode(ISTA_AMB_PROMO_CODE);
  const [existingPromo] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, editionId),
        sql`lower(${hackathonPromoCodes.code}) = ${code.toLowerCase()}`,
      ),
    )
    .limit(1);

  let dashboardToken: string;
  if (existingPromo) {
    dashboardToken = existingPromo.dashboardToken;
    if (
      existingPromo.partnerEmail.toLowerCase() !== ISTA_AMB_EMAIL ||
      existingPromo.kind !== "ambassador"
    ) {
      await db
        .update(hackathonPromoCodes)
        .set({
          partnerEmail: ISTA_AMB_EMAIL.toLowerCase(),
          partnerName: ISTA_AMB_NAME,
          orgName: ISTA_AMB_ORG,
          kind: "ambassador",
          active: true,
          updatedAt: new Date(),
        })
        .where(eq(hackathonPromoCodes.id, existingPromo.id));
    }
  } else {
    dashboardToken = generatePromoDashboardToken();
    await db.insert(hackathonPromoCodes).values({
      editionId,
      code,
      orgName: ISTA_AMB_ORG,
      partnerEmail: ISTA_AMB_EMAIL.toLowerCase(),
      partnerName: ISTA_AMB_NAME,
      kind: "ambassador",
      discountPercent: String(AMBASSADOR_DISCOUNT_PERCENT),
      cashbackUsd: String(AMBASSADOR_CASHBACK_USD),
      active: true,
      dashboardToken,
    });
  }

  return {
    editionId,
    promoCode: code,
    priceUsd: discountedPriceUsd(AMBASSADOR_DISCOUNT_PERCENT),
    shareUrl: partnerShareUrl(code),
    dashboardUrl: partnerDashboardUrl(dashboardToken),
  };
}
