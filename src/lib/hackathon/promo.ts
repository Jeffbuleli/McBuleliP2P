import { randomBytes } from "node:crypto";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonPromoCodes,
  hackathonPromoCashbackClaims,
  hackathonRegistrations,
  users,
} from "@/db";
import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";
import { partnershipPublicBaseUrl } from "@/lib/email/config";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import type {
  PartnerDashboardSignup,
  PartnerDashboardStats,
} from "@/lib/hackathon/promo-types";
import {
  PARTNER_FREE_SEATS_MAX,
  PARTNER_SEAT_1_AT,
  PARTNER_SEAT_2_AT,
  partnerFreeSeatsEarned,
} from "@/lib/hackathon/promo-types";
import { claimableCashbackUsd, listClaimsForPromo } from "@/lib/hackathon/promo-claims";
import { readPromoDashSession } from "@/lib/hackathon/promo-dashboard-auth";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";
import { getSessionUserId } from "@/lib/session";
import type { PromoKind } from "@/lib/hackathon/promo-types";

export type { PartnerDashboardSignup, PartnerDashboardStats } from "@/lib/hackathon/promo-types";
export {
  PARTNER_FREE_SEATS,
  PARTNER_FREE_SEATS_MAX,
  PARTNER_FREE_SEATS_THRESHOLD,
  PARTNER_SEAT_1_AT,
  PARTNER_SEAT_2_AT,
  partnerFreeSeatsEarned,
  AMBASSADOR_CASHBACK_USD,
  AMBASSADOR_DISCOUNT_PERCENT,
  PROMO_CASHBACK_CLAIM_MIN_USD,
} from "@/lib/hackathon/promo-types";
export type { PromoKind } from "@/lib/hackathon/promo-types";
export type ResolvedPromo = {
  id: string;
  editionId: string;
  code: string;
  orgName: string;
  partnerEmail: string;
  partnerName: string | null;
  discountPercent: number;
  cashbackUsd: number;
  priceUsd: string;
  dashboardToken: string;
};

export function normalizePromoCode(raw: string): string {
  return raw.trim().replace(/\s+/g, "").toUpperCase();
}

export function generatePromoDashboardToken(): string {
  return randomBytes(24).toString("base64url");
}

export function discountedPriceUsd(discountPercent: number): string {
  const base = Number(HACKATHON_PRICE_USD);
  const pct = Math.min(100, Math.max(0, discountPercent));
  const price = Math.round((base * (100 - pct)) / 100);
  return String(price);
}

export function partnerShareUrl(code: string): string {
  return `${partnershipPublicBaseUrl()}/hackathon?promo=${encodeURIComponent(normalizePromoCode(code))}#register`;
}

export function partnerDashboardUrl(token: string): string {
  return `${partnershipPublicBaseUrl()}/hackathon/promo/dashboard/${encodeURIComponent(token)}`;
}

/** wa.me link from a COD MSISDN (243…). */
export function whatsappMeUrl(phoneRaw: string | null | undefined): string | null {
  const phone = phoneRaw ? normalizeCodPhoneNumber(phoneRaw) : "";
  const digits = phone.replace(/\D/g, "");
  if (!digits.startsWith("243") || digits.length < 12) return null;
  return `https://wa.me/${digits}`;
}

export async function resolveActivePromo(args: {
  code: string;
  editionId?: string | null;
}): Promise<ResolvedPromo | null> {
  const code = normalizePromoCode(args.code);
  if (!code) return null;

  const db = getDb();
  let editionId = args.editionId?.trim() || null;
  if (!editionId) {
    const [featured] = await db
      .select({ id: hackathonEditions.id })
      .from(hackathonEditions)
      .where(eq(hackathonEditions.featured, true))
      .limit(1);
    editionId = featured?.id ?? null;
  }
  if (!editionId) return null;

  const [row] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, editionId),
        eq(hackathonPromoCodes.active, true),
        sql`lower(${hackathonPromoCodes.code}) = ${code.toLowerCase()}`,
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
  };
}

export async function getPromoByDashboardToken(token: string) {
  const normalized = token.trim();
  if (!normalized) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(eq(hackathonPromoCodes.dashboardToken, normalized))
    .limit(1);
  return row ?? null;
}

export async function getPartnerDashboardStats(
  token: string,
): Promise<PartnerDashboardStats | null> {
  const promo = await getPromoByDashboardToken(token);
  if (!promo) return null;

  const db = getDb();
  const [edition] = await db
    .select({
      id: hackathonEditions.id,
      nameFr: hackathonEditions.nameFr,
      nameEn: hackathonEditions.nameEn,
    })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, promo.editionId))
    .limit(1);

  const rows = await db
    .select({
      id: hackathonRegistrations.id,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
      email: hackathonRegistrations.email,
      phone: hackathonRegistrations.phone,
      whatsapp: hackathonRegistrations.whatsapp,
      paymentStatus: hackathonRegistrations.paymentStatus,
      ticketCode: hackathonRegistrations.ticketCode,
      cashbackUsd: hackathonRegistrations.cashbackUsd,
      cashbackAwardedAt: hackathonRegistrations.cashbackAwardedAt,
      createdAt: hackathonRegistrations.createdAt,
    })
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.promoCodeId, promo.id))
    .orderBy(desc(hackathonRegistrations.createdAt));

  const signups: PartnerDashboardSignup[] = rows.map((r) => {
    const confirmed = r.paymentStatus === "paid";
    return {
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      whatsappUrl: whatsappMeUrl(r.whatsapp || r.phone),
      paymentStatus: r.paymentStatus,
      confirmed,
      ticketCode: confirmed ? r.ticketCode : null,
      cashbackUsd: r.cashbackUsd != null ? Number(r.cashbackUsd) : null,
      createdAt: r.createdAt.toISOString(),
    };
  });

  const confirmed = signups.filter((s) => s.confirmed).length;
  const cashbackUsd = signups.reduce((sum, s) => {
    if (!s.confirmed) return sum;
    return sum + (s.cashbackUsd ?? 0);
  }, 0);

  const isAmbassador = (promo.kind ?? "partner") === "ambassador";
  const seatsEarned = isAmbassador ? 0 : partnerFreeSeatsEarned(confirmed);
  const nextSeatAt = isAmbassador
    ? null
    : seatsEarned < 1
      ? PARTNER_SEAT_1_AT
      : seatsEarned < PARTNER_FREE_SEATS_MAX
        ? PARTNER_SEAT_2_AT
        : null;
  const nextSeatRemaining =
    nextSeatAt == null ? 0 : Math.max(0, nextSeatAt - confirmed);

  const claimableUsd = await claimableCashbackUsd(promo.id);
  const claims = await listClaimsForPromo(promo.id);
  const session = await readPromoDashSession();
  const sessionUserId = await getSessionUserId();
  const ownerMatch =
    Boolean(promo.ownerUserId) &&
    sessionUserId === promo.ownerUserId &&
    Boolean(sessionUserId);
  const verified =
    ownerMatch ||
    (Boolean(session) &&
      session!.promoId === promo.id &&
      session!.email === promo.partnerEmail.toLowerCase());
  const email = promo.partnerEmail;
  const [userPart, domain] = email.split("@");
  const masked =
    userPart && domain
      ? `${userPart.slice(0, 1)}***@${domain}`
      : null;

  return {
    promo: {
      code: promo.code,
      orgName: promo.orgName,
      partnerName: promo.partnerName,
      kind: (isAmbassador ? "ambassador" : "partner") as PromoKind,
      discountPercent: Number(promo.discountPercent),
      cashbackPerPaidUsd: Number(promo.cashbackUsd),
      shareUrl: partnerShareUrl(promo.code),
      active: promo.active,
    },
    edition: edition ?? null,
    totals: {
      signups: signups.length,
      confirmed,
      pending: signups.length - confirmed,
      cashbackUsd,
    },
    rewards: {
      seatsMax: isAmbassador ? 0 : PARTNER_FREE_SEATS_MAX,
      seatsEarned,
      seat1At: PARTNER_SEAT_1_AT,
      seat2At: PARTNER_SEAT_2_AT,
      nextSeatAt,
      nextSeatRemaining,
      freeSeats: isAmbassador ? 0 : PARTNER_FREE_SEATS_MAX,
      freeSeatsThreshold: PARTNER_SEAT_2_AT,
      freeSeatsUnlocked: !isAmbassador && seatsEarned >= PARTNER_FREE_SEATS_MAX,
      freeSeatsRemaining: nextSeatRemaining,
    },
    cashback: {
      claimableUsd: verified ? claimableUsd : 0,
      claims: verified
        ? claims.map((c) => ({
            id: c.id,
            amountUsd: Number(c.amountUsd),
            status: c.status,
            phoneNumber: c.phoneNumber,
            providerLabel: c.providerLabel,
            payoutStatus: c.payoutStatus,
            requestedAt: c.requestedAt.toISOString(),
            resolvedAt: c.resolvedAt?.toISOString() ?? null,
            note: c.note,
          }))
        : [],
    },
    auth: {
      required: !ownerMatch,
      verified,
      partnerEmailMasked: masked,
    },
    signups: verified ? signups : [],
    updatedAt: new Date().toISOString(),
  };
}

export async function upsertPartnerPromo(args: {
  editionId: string;
  code: string;
  orgName: string;
  partnerEmail: string;
  partnerName?: string | null;
  discountPercent?: number;
  cashbackUsd?: number;
}): Promise<ResolvedPromo> {
  const db = getDb();
  const code = normalizePromoCode(args.code);
  const email = args.partnerEmail.trim().toLowerCase();
  const discountPercent = args.discountPercent ?? 10;
  const cashbackUsd = args.cashbackUsd ?? 10;

  const [existing] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(
      and(
        eq(hackathonPromoCodes.editionId, args.editionId),
        sql`lower(${hackathonPromoCodes.code}) = ${code.toLowerCase()}`,
      ),
    )
    .limit(1);

  if (existing) {
    const [updated] = await db
      .update(hackathonPromoCodes)
      .set({
        orgName: args.orgName.trim(),
        partnerEmail: email,
        partnerName: args.partnerName?.trim() || null,
        discountPercent: String(discountPercent),
        cashbackUsd: String(cashbackUsd),
        active: true,
        code,
        updatedAt: new Date(),
      })
      .where(eq(hackathonPromoCodes.id, existing.id))
      .returning();

    return {
      id: updated.id,
      editionId: updated.editionId,
      code: updated.code,
      orgName: updated.orgName,
      partnerEmail: updated.partnerEmail,
      partnerName: updated.partnerName,
      discountPercent: Number(updated.discountPercent),
      cashbackUsd: Number(updated.cashbackUsd),
      priceUsd: discountedPriceUsd(Number(updated.discountPercent)),
      dashboardToken: updated.dashboardToken,
    };
  }

  const [created] = await db
    .insert(hackathonPromoCodes)
    .values({
      editionId: args.editionId,
      code,
      orgName: args.orgName.trim(),
      partnerEmail: email,
      partnerName: args.partnerName?.trim() || null,
      kind: "partner",
      discountPercent: String(discountPercent),
      cashbackUsd: String(cashbackUsd),
      active: true,
      dashboardToken: generatePromoDashboardToken(),
    })
    .returning();

  return {
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
  };
}

export async function setPromoActive(
  promoId: string,
  active: boolean,
): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .update(hackathonPromoCodes)
    .set({ active, updatedAt: new Date() })
    .where(eq(hackathonPromoCodes.id, promoId))
    .returning({ id: hackathonPromoCodes.id });
  return Boolean(row);
}

/** Award cashback once when a promo registration becomes paid (anti-collusion → $0). */
export async function awardPromoCashbackIfNeeded(registrationId: string): Promise<void> {
  const db = getDb();
  const [reg] = await db
    .select({
      id: hackathonRegistrations.id,
      editionId: hackathonRegistrations.editionId,
      userId: hackathonRegistrations.userId,
      email: hackathonRegistrations.email,
      phone: hackathonRegistrations.phone,
      promoCodeId: hackathonRegistrations.promoCodeId,
      cashbackAwardedAt: hackathonRegistrations.cashbackAwardedAt,
      cashbackUsd: hackathonRegistrations.cashbackUsd,
      paymentStatus: hackathonRegistrations.paymentStatus,
      createdAt: hackathonRegistrations.createdAt,
    })
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, registrationId))
    .limit(1);

  if (!reg?.promoCodeId || reg.paymentStatus !== "paid" || reg.cashbackAwardedAt) {
    return;
  }

  const [promo] = await db
    .select()
    .from(hackathonPromoCodes)
    .where(eq(hackathonPromoCodes.id, reg.promoCodeId))
    .limit(1);

  let amount =
    reg.cashbackUsd != null && Number.isFinite(Number(reg.cashbackUsd))
      ? Number(reg.cashbackUsd)
      : promo
        ? Number(promo.cashbackUsd)
        : 0;

  if (promo && amount > 0) {
    const blocked = await isPromoCashbackBlocked({
      reg,
      promo,
    });
    if (blocked) amount = 0;
  }

  await db
    .update(hackathonRegistrations)
    .set({
      cashbackUsd: String(amount),
      cashbackAwardedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(hackathonRegistrations.id, registrationId),
        sql`${hackathonRegistrations.cashbackAwardedAt} is null`,
      ),
    );
}

async function isPromoCashbackBlocked(args: {
  reg: {
    id: string;
    editionId: string;
    userId: string | null;
    email: string;
    phone: string;
    createdAt: Date;
  };
  promo: typeof hackathonPromoCodes.$inferSelect;
}): Promise<boolean> {
  const { reg, promo } = args;
  const db = getDb();
  const regEmailCanon = canonicalEmailForDedup(reg.email);
  const partnerEmailCanon = canonicalEmailForDedup(promo.partnerEmail);
  if (regEmailCanon && partnerEmailCanon && regEmailCanon === partnerEmailCanon) {
    return true;
  }
  if (reg.email.trim().toLowerCase() === promo.partnerEmail.trim().toLowerCase()) {
    return true;
  }
  if (promo.ownerUserId && reg.userId && reg.userId === promo.ownerUserId) {
    return true;
  }

  // Soft self-referral: registration predates the promo code.
  if (reg.createdAt.getTime() < promo.createdAt.getTime()) {
    return true;
  }

  const regPhone = normalizeCodPhoneNumber(reg.phone);
  if (promo.ownerUserId) {
    const [owner] = await db
      .select({
        email: users.email,
        emailCanonical: users.emailCanonical,
        recoveryWaPhone: users.recoveryWaPhone,
      })
      .from(users)
      .where(eq(users.id, promo.ownerUserId))
      .limit(1);
    if (owner) {
      const ownerCanon =
        owner.emailCanonical || canonicalEmailForDedup(owner.email);
      if (ownerCanon && regEmailCanon && ownerCanon === regEmailCanon) {
        return true;
      }
      if (owner.recoveryWaPhone) {
        const ownerPhone = normalizeCodPhoneNumber(owner.recoveryWaPhone);
        if (ownerPhone && regPhone && ownerPhone === regPhone) {
          return true;
        }
      }
    }
  }

  if (regPhone) {
    const [priorClaimPhone] = await db
      .select({ id: hackathonPromoCashbackClaims.id })
      .from(hackathonPromoCashbackClaims)
      .where(
        and(
          eq(hackathonPromoCashbackClaims.promoCodeId, promo.id),
          eq(hackathonPromoCashbackClaims.phoneNumber, regPhone),
          inArray(hackathonPromoCashbackClaims.status, [
            "requested",
            "approved",
            "paid",
          ]),
        ),
      )
      .limit(1);
    if (priorClaimPhone) return true;
  }

  // One referred cashback > 0 per payer (email) per edition across all promos.
  const [priorAward] = await db
    .select({ id: hackathonRegistrations.id })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, reg.editionId),
        eq(hackathonRegistrations.paymentStatus, "paid"),
        sql`${hackathonRegistrations.cashbackAwardedAt} is not null`,
        sql`coalesce(${hackathonRegistrations.cashbackUsd}, 0) > 0`,
        sql`${hackathonRegistrations.id} <> ${reg.id}`,
        sql`lower(${hackathonRegistrations.email}) = ${reg.email.trim().toLowerCase()}`,
      ),
    )
    .limit(1);
  if (priorAward) return true;

  if (regPhone) {
    const [priorPhoneAward] = await db
      .select({ id: hackathonRegistrations.id })
      .from(hackathonRegistrations)
      .where(
        and(
          eq(hackathonRegistrations.editionId, reg.editionId),
          eq(hackathonRegistrations.paymentStatus, "paid"),
          sql`${hackathonRegistrations.cashbackAwardedAt} is not null`,
          sql`coalesce(${hackathonRegistrations.cashbackUsd}, 0) > 0`,
          sql`${hackathonRegistrations.id} <> ${reg.id}`,
          sql`${hackathonRegistrations.phone} = ${reg.phone}`,
        ),
      )
      .limit(1);
    if (priorPhoneAward) return true;
  }

  return false;
}
