import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonPromoCodes,
  hackathonRegistrations,
} from "@/db";
import { HACKATHON_PRICE_USD } from "@/lib/hackathon/constants";
import { partnershipPublicBaseUrl } from "@/lib/email/config";
import { normalizeCodPhoneNumber } from "@/lib/freshpay/normalize-phone";
import type {
  PartnerDashboardSignup,
  PartnerDashboardStats,
} from "@/lib/hackathon/promo-types";

export type { PartnerDashboardSignup, PartnerDashboardStats } from "@/lib/hackathon/promo-types";
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
    return sum + (s.cashbackUsd ?? Number(promo.cashbackUsd));
  }, 0);

  return {
    promo: {
      code: promo.code,
      orgName: promo.orgName,
      partnerName: promo.partnerName,
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
    signups,
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

/** Award cashback once when a promo registration becomes paid. */
export async function awardPromoCashbackIfNeeded(registrationId: string): Promise<void> {
  const db = getDb();
  const [reg] = await db
    .select({
      id: hackathonRegistrations.id,
      promoCodeId: hackathonRegistrations.promoCodeId,
      cashbackAwardedAt: hackathonRegistrations.cashbackAwardedAt,
      cashbackUsd: hackathonRegistrations.cashbackUsd,
      paymentStatus: hackathonRegistrations.paymentStatus,
    })
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, registrationId))
    .limit(1);

  if (!reg?.promoCodeId || reg.paymentStatus !== "paid" || reg.cashbackAwardedAt) {
    return;
  }

  let amount = reg.cashbackUsd != null ? Number(reg.cashbackUsd) : null;
  if (amount == null || !Number.isFinite(amount)) {
    const [promo] = await db
      .select({ cashbackUsd: hackathonPromoCodes.cashbackUsd })
      .from(hackathonPromoCodes)
      .where(eq(hackathonPromoCodes.id, reg.promoCodeId))
      .limit(1);
    amount = promo ? Number(promo.cashbackUsd) : 0;
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
