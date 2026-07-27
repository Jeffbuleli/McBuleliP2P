/**
 * Bienv Photography 243 — médias Hackathon : 1 badge + code ambassadeur BIENV_PHOTO_243.
 */
import { and, eq, sql } from "drizzle-orm";
import { getDb, hackathonPartnerOrgs, hackathonPartnerPasses, hackathonPromoCodes } from "@/db";
import {
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
} from "@/lib/hackathon/promo-types";
import {
  generatePromoDashboardToken,
  normalizePromoCode,
  partnerDashboardUrl,
  partnerShareUrl,
} from "@/lib/hackathon/promo";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import { ensureOrgPartnerPasses, passToPublic } from "@/lib/hackathon/partner-passes";

export const BIENV_PHOTO_SLUG = "bienv-photography";
export const BIENV_PHOTO_EMAIL = "bienvngonda862@gmail.com";
export const BIENV_PHOTO_NAME = "Bienvenue Ngonda";
export const BIENV_PHOTO_ORG = "Bienv Photography 243";
export const BIENV_PHOTO_PROMO_CODE = "BIENV_PHOTO_243";

export type BienvPhotographyAssets = {
  editionId: string;
  orgId: string;
  badgePassUrl: string;
  badgeCode: string;
  promoCode: string;
  shareUrl: string;
  dashboardUrl: string;
};

/** Idempotent: org, 1 badge médias, promo ambassadeur. */
export async function ensureBienvPhotographyAssets(): Promise<BienvPhotographyAssets> {
  const editionId = await ensurePartnerOrgsSeeded();
  if (!editionId) throw new Error("no_edition");

  const db = getDb();
  const [org] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        eq(hackathonPartnerOrgs.slug, BIENV_PHOTO_SLUG),
      ),
    )
    .limit(1);
  if (!org) throw new Error("bienv_org_missing");

  const passes = await ensureOrgPartnerPasses(org.id);
  const seat1 = passes.find((p) => p.seatIndex === 1);
  if (!seat1?.ticketCode) throw new Error("bienv_badge_missing");

  if (seat1.holderName !== BIENV_PHOTO_NAME || seat1.holderEmail !== BIENV_PHOTO_EMAIL) {
    await db
      .update(hackathonPartnerPasses)
      .set({
        holderName: BIENV_PHOTO_NAME,
        holderEmail: BIENV_PHOTO_EMAIL.toLowerCase(),
        roleLabel: "Médias / Photography",
        badgeKind: "media",
        updatedAt: new Date(),
      })
      .where(eq(hackathonPartnerPasses.id, seat1.id));
  }

  const code = normalizePromoCode(BIENV_PHOTO_PROMO_CODE);
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
      existingPromo.partnerEmail.toLowerCase() !== BIENV_PHOTO_EMAIL ||
      existingPromo.kind !== "ambassador"
    ) {
      await db
        .update(hackathonPromoCodes)
        .set({
          partnerEmail: BIENV_PHOTO_EMAIL.toLowerCase(),
          partnerName: BIENV_PHOTO_NAME,
          orgName: BIENV_PHOTO_ORG,
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
      orgName: BIENV_PHOTO_ORG,
      partnerEmail: BIENV_PHOTO_EMAIL.toLowerCase(),
      partnerName: BIENV_PHOTO_NAME,
      kind: "ambassador",
      discountPercent: String(AMBASSADOR_DISCOUNT_PERCENT),
      cashbackUsd: String(AMBASSADOR_CASHBACK_USD),
      active: true,
      dashboardToken,
    });
  }

  const refreshed = await ensureOrgPartnerPasses(org.id);
  const s1 = refreshed.find((p) => p.seatIndex === 1 && p.ticketCode);
  if (!s1?.ticketCode) throw new Error("bienv_badge_missing");

  const pub = passToPublic(s1);
  if (!pub.passUrl || !pub.ticketCode) throw new Error("bienv_pass_url_missing");

  return {
    editionId,
    orgId: org.id,
    badgePassUrl: pub.passUrl,
    badgeCode: pub.ticketCode,
    promoCode: code,
    shareUrl: partnerShareUrl(code),
    dashboardUrl: partnerDashboardUrl(dashboardToken),
  };
}
