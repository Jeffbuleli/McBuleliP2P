import { and, eq, sql } from "drizzle-orm";
import { getDb, hackathonEditions, hackathonPromoCodes } from "@/db";
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
  type ResolvedPromo,
} from "@/lib/hackathon/promo";

const CODE_RE = /^[A-Z0-9]{4,16}$/;

export function isValidAmbassadorCode(code: string): boolean {
  return CODE_RE.test(normalizePromoCode(code));
}

export async function getFeaturedEditionId(): Promise<string | null> {
  const db = getDb();
  const [featured] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  return featured?.id ?? null;
}

export async function getAmbassadorPromoForUser(args: {
  userId: string;
  editionId?: string | null;
}): Promise<
  | (ResolvedPromo & { kind: "ambassador"; shareUrl: string; dashboardUrl: string })
  | null
> {
  const db = getDb();
  const editionId = args.editionId?.trim() || (await getFeaturedEditionId());
  if (!editionId) return null;

  const [row] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, editionId),
        eq(hackathonPromoCodes.ownerUserId, args.userId),
        eq(hackathonPromoCodes.kind, "ambassador"),
        eq(hackathonPromoCodes.active, true),
      ),
    )
    .limit(1);

  if (!row) return null;
  const discountPercent = Number(row.discountPercent);
  const cashbackUsd = Number(row.cashbackUsd);
  return {
    id: row.id,
    editionId: row.editionId,
    code: row.code,
    orgName: row.orgName,
    partnerEmail: row.partnerEmail,
    partnerName: row.partnerName,
    discountPercent,
    cashbackUsd,
    priceUsd: discountedPriceUsd(discountPercent),
    dashboardToken: row.dashboardToken,
    kind: "ambassador",
    shareUrl: partnerShareUrl(row.code),
    dashboardUrl: partnerDashboardUrl(row.dashboardToken),
  };
}

export async function createAmbassadorPromo(args: {
  userId: string;
  email: string;
  code: string;
  displayName: string;
  editionId?: string | null;
}): Promise<
  | {
      ok: true;
      created: boolean;
      promo: ResolvedPromo & {
        kind: "ambassador";
        shareUrl: string;
        dashboardUrl: string;
      };
    }
  | { ok: false; error: string; status: number }
> {
  const code = normalizePromoCode(args.code);
  if (!isValidAmbassadorCode(code)) {
    return { ok: false, error: "invalid_code", status: 400 };
  }

  const displayName = args.displayName.trim().slice(0, 80);
  if (displayName.length < 2) {
    return { ok: false, error: "invalid_display_name", status: 400 };
  }

  const email = args.email.trim().toLowerCase();
  if (!email.includes("@")) {
    return { ok: false, error: "invalid_email", status: 400 };
  }

  const editionId = args.editionId?.trim() || (await getFeaturedEditionId());
  if (!editionId) {
    return { ok: false, error: "no_edition", status: 404 };
  }

  const existing = await getAmbassadorPromoForUser({
    userId: args.userId,
    editionId,
  });
  if (existing) {
    return { ok: true, created: false, promo: existing };
  }

  const db = getDb();
  const [taken] = await db
    .select({ id: hackathonPromoCodes.id })
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, editionId),
        sql`lower(${hackathonPromoCodes.code}) = ${code.toLowerCase()}`,
      ),
    )
    .limit(1);
  if (taken) {
    return { ok: false, error: "code_taken", status: 409 };
  }

  try {
    const [created] = await db
      .insert(hackathonPromoCodes)
      .values({
        editionId,
        code,
        orgName: displayName,
        partnerEmail: email,
        partnerName: displayName,
        kind: "ambassador",
        ownerUserId: args.userId,
        discountPercent: String(AMBASSADOR_DISCOUNT_PERCENT),
        cashbackUsd: String(AMBASSADOR_CASHBACK_USD),
        active: true,
        dashboardToken: generatePromoDashboardToken(),
      })
      .returning();

    return {
      ok: true,
      created: true,
      promo: {
        id: created.id,
        editionId: created.editionId,
        code: created.code,
        orgName: created.orgName,
        partnerEmail: created.partnerEmail,
        partnerName: created.partnerName,
        discountPercent: Number(created.discountPercent),
        cashbackUsd: Number(created.cashbackUsd),
        priceUsd: discountedPriceUsd(Number(created.discountPercent)),
        dashboardToken: created.dashboardToken,
        kind: "ambassador",
        shareUrl: partnerShareUrl(created.code),
        dashboardUrl: partnerDashboardUrl(created.dashboardToken),
      },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("hackathon_promo_codes_ambassador_owner_uidx")) {
      const again = await getAmbassadorPromoForUser({
        userId: args.userId,
        editionId,
      });
      if (again) return { ok: true, created: false, promo: again };
    }
    if (msg.includes("hackathon_promo_codes_edition_code_uidx")) {
      return { ok: false, error: "code_taken", status: 409 };
    }
    throw e;
  }
}
