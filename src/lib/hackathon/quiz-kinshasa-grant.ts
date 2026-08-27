import { and, eq, or, sql } from "drizzle-orm";
import { getDb, hackathonRegistrations } from "@/db";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";
import { ensureHackathonUser, markHackathonUserEmailVerified } from "@/lib/hackathon/ensure-user";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { generateTicketCode } from "@/lib/hackathon/service";
import {
  KINSHASA_PROMO_CODE,
  KINSHASA_QUIZ_CAP,
  KINSHASA_UTM_CAMPAIGN,
} from "@/lib/hackathon/quiz-kinshasa";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";

export type KinshasaSeatStats = {
  claimed: number;
  remaining: number;
  cap: number;
  closed: boolean;
};

export async function countKinshasaClaimedSeats(
  editionId: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, editionId),
        or(
          eq(hackathonRegistrations.promoCode, KINSHASA_PROMO_CODE),
          eq(hackathonRegistrations.utmCampaign, KINSHASA_UTM_CAMPAIGN),
        ),
        eq(hackathonRegistrations.paymentStatus, "paid"),
      ),
    );
  return row?.count ?? 0;
}

export async function getKinshasaSeatStats(
  editionId?: string,
): Promise<KinshasaSeatStats | null> {
  const edition = editionId
    ? { id: editionId }
    : await getFeaturedEditionRow();
  if (!edition) return null;
  const claimed = await countKinshasaClaimedSeats(edition.id);
  const remaining = Math.max(0, KINSHASA_QUIZ_CAP - claimed);
  return {
    claimed,
    remaining,
    cap: KINSHASA_QUIZ_CAP,
    closed: remaining <= 0,
  };
}

/** Email or phone already used for a Kinshasa quiz attempt (pass or fail). */
export async function isKinshasaBlacklisted(args: {
  email: string;
  phone: string;
  editionId?: string;
}): Promise<{ blocked: boolean; reason?: "email" | "phone" | "paid" }> {
  const edition = args.editionId
    ? { id: args.editionId }
    : await getFeaturedEditionRow();
  if (!edition) return { blocked: false };

  const email = normalizeAuthEmail(args.email);
  const phone = normalizeCodPhoneNumber(args.phone);
  const db = getDb();

  const [byEmail] = await db
    .select({
      id: hackathonRegistrations.id,
      paymentStatus: hackathonRegistrations.paymentStatus,
      ticketCode: hackathonRegistrations.ticketCode,
      promoCode: hackathonRegistrations.promoCode,
      utmCampaign: hackathonRegistrations.utmCampaign,
      utmContent: hackathonRegistrations.utmContent,
    })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        eq(hackathonRegistrations.email, email),
      ),
    )
    .limit(1);

  if (byEmail) {
    if (byEmail.paymentStatus === "paid") {
      return { blocked: true, reason: "paid" };
    }
    if (
      byEmail.utmContent?.startsWith("kinshasa_fail_") ||
      (byEmail.paymentStatus === "failed" &&
        (byEmail.promoCode === KINSHASA_PROMO_CODE ||
          byEmail.utmCampaign === KINSHASA_UTM_CAMPAIGN))
    ) {
      return { blocked: true, reason: "email" };
    }
  }

  if (isValidCodMsisdn(phone)) {
    const [byPhone] = await db
      .select({
        id: hackathonRegistrations.id,
        paymentStatus: hackathonRegistrations.paymentStatus,
        promoCode: hackathonRegistrations.promoCode,
        utmCampaign: hackathonRegistrations.utmCampaign,
        utmContent: hackathonRegistrations.utmContent,
      })
      .from(hackathonRegistrations)
      .where(
        and(
          eq(hackathonRegistrations.editionId, edition.id),
          eq(hackathonRegistrations.phone, phone),
        ),
      )
      .limit(1);
    if (byPhone) {
      if (byPhone.paymentStatus === "paid") {
        return { blocked: true, reason: "paid" };
      }
      if (
        byPhone.utmContent?.startsWith("kinshasa_fail_") ||
        (byPhone.paymentStatus === "failed" &&
          (byPhone.promoCode === KINSHASA_PROMO_CODE ||
            byPhone.utmCampaign === KINSHASA_UTM_CAMPAIGN))
      ) {
        return { blocked: true, reason: "phone" };
      }
    }
  }

  return { blocked: false };
}

export type GrantKinshasaArgs = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city?: string;
  level?: "beginner" | "intermediate" | "advanced";
  locale?: "fr" | "en";
  utmSource?: string | null;
  scorePercent: number;
  correct: number;
  seriesId: number;
};

export async function grantKinshasaPaidSeat(args: GrantKinshasaArgs) {
  const edition = await getFeaturedEditionRow();
  if (!edition) {
    return { ok: false as const, error: "no_edition" as const, status: 404 };
  }
  if (edition.status === "closed") {
    return {
      ok: false as const,
      error: "registration_closed" as const,
      status: 403,
    };
  }

  const phone = normalizeCodPhoneNumber(args.phone);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false as const, error: "invalid_phone" as const, status: 400 };
  }

  const email = normalizeAuthEmail(args.email);
  const blocked = await isKinshasaBlacklisted({
    email,
    phone,
    editionId: edition.id,
  });
  if (blocked.blocked) {
    return {
      ok: false as const,
      error: "blacklisted" as const,
      status: 409,
      reason: blocked.reason,
    };
  }

  const stats = await getKinshasaSeatStats(edition.id);
  if (!stats || stats.closed) {
    return { ok: false as const, error: "quota_full" as const, status: 409 };
  }

  const db = getDb();
  const [existing] = await db
    .select()
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        eq(hackathonRegistrations.email, email),
      ),
    )
    .limit(1);

  if (existing?.paymentStatus === "paid") {
    return {
      ok: false as const,
      error: "already_registered" as const,
      status: 409,
      ticketCode: existing.ticketCode,
    };
  }

  const claimed = await countKinshasaClaimedSeats(edition.id);
  if (claimed >= KINSHASA_QUIZ_CAP) {
    return { ok: false as const, error: "quota_full" as const, status: 409 };
  }

  const account = await ensureHackathonUser({
    email,
    firstName: args.firstName,
    lastName: args.lastName,
  });
  await markHackathonUserEmailVerified(account.id);

  const ticketCode = existing?.ticketCode ?? generateTicketCode();
  const now = new Date();
  const profile = {
    firstName: args.firstName.trim(),
    lastName: args.lastName.trim(),
    phone,
    whatsapp: phone,
    city: args.city?.trim() || null,
    profession: null as string | null,
    company: null as string | null,
    level: args.level ?? "beginner",
    projectName: null as string | null,
    projectDescription: null as string | null,
    projectCategory: null as string | null,
    workMode: "solo" as const,
    ticketPack: "full" as const,
    priceUsd: "0.00",
    locale: args.locale === "en" ? "en" : "fr",
    userId: account.id,
    promoCodeId: null as string | null,
    promoCode: KINSHASA_PROMO_CODE,
    cashbackUsd: null as string | null,
    utmSource: args.utmSource?.trim().slice(0, 64) || "quiz",
    utmMedium: "organic",
    utmCampaign: KINSHASA_UTM_CAMPAIGN,
    utmContent: `s${args.seriesId}_score_${args.scorePercent}`,
    paymentMethod: null as string | null,
    paymentStatus: "paid" as const,
    paymentToken: null as string | null,
    holdExpiresAt: null as Date | null,
    ticketCode,
    updatedAt: now,
  };

  let registrationId: string;
  if (existing) {
    await db
      .update(hackathonRegistrations)
      .set(profile)
      .where(eq(hackathonRegistrations.id, existing.id));
    registrationId = existing.id;
  } else {
    const [inserted] = await db
      .insert(hackathonRegistrations)
      .values({
        editionId: edition.id,
        email,
        ...profile,
      })
      .returning({ id: hackathonRegistrations.id });
    if (!inserted) {
      return { ok: false as const, error: "insert_failed" as const, status: 500 };
    }
    registrationId = inserted.id;
  }

  return {
    ok: true as const,
    mode: "ticketed" as const,
    registrationId,
    ticketCode,
    email,
    firstName: args.firstName.trim(),
  };
}

/** Record a failed Kinshasa attempt so email + phone cannot retry. */
export async function recordKinshasaFailure(args: GrantKinshasaArgs) {
  const edition = await getFeaturedEditionRow();
  if (!edition) {
    return { ok: false as const, error: "no_edition" as const };
  }

  const phone = normalizeCodPhoneNumber(args.phone);
  if (!isValidCodMsisdn(phone)) {
    return { ok: false as const, error: "invalid_phone" as const };
  }
  const email = normalizeAuthEmail(args.email);
  const db = getDb();

  const [existing] = await db
    .select()
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, edition.id),
        eq(hackathonRegistrations.email, email),
      ),
    )
    .limit(1);

  if (existing?.paymentStatus === "paid") {
    return { ok: true as const, alreadyPaid: true as const };
  }

  const now = new Date();
  const failMarker = `kinshasa_fail_s${args.seriesId}_${args.scorePercent}`;

  /**
   * Reserved / pending holds must not be wiped on quiz fail — otherwise a
   * pay-later registrant loses their payment link when trying for a free seat.
   * Mark the fail on utmContent only; blacklist reads that marker.
   */
  const preserveHold =
    existing &&
    (existing.paymentStatus === "reserved" ||
      existing.paymentStatus === "pending" ||
      existing.paymentStatus === "pending_verify");

  if (preserveHold && existing) {
    await db
      .update(hackathonRegistrations)
      .set({
        utmContent: failMarker,
        updatedAt: now,
      })
      .where(eq(hackathonRegistrations.id, existing.id));
    return { ok: true as const, alreadyPaid: false as const };
  }

  const profile = {
    firstName: args.firstName.trim(),
    lastName: args.lastName.trim(),
    phone,
    whatsapp: phone,
    city: args.city?.trim() || null,
    profession: null as string | null,
    company: null as string | null,
    level: args.level ?? "beginner",
    projectName: null as string | null,
    projectDescription: null as string | null,
    projectCategory: null as string | null,
    workMode: "solo" as const,
    ticketPack: "full" as const,
    priceUsd: "0.00",
    locale: args.locale === "en" ? "en" : "fr",
    promoCodeId: null as string | null,
    promoCode: KINSHASA_PROMO_CODE,
    cashbackUsd: null as string | null,
    utmSource: args.utmSource?.trim().slice(0, 64) || "quiz",
    utmMedium: "organic",
    utmCampaign: KINSHASA_UTM_CAMPAIGN,
    utmContent: failMarker,
    paymentMethod: null as string | null,
    paymentStatus: "failed" as const,
    paymentToken: null as string | null,
    holdExpiresAt: null as Date | null,
    ticketCode: null as string | null,
    updatedAt: now,
  };

  if (existing) {
    await db
      .update(hackathonRegistrations)
      .set(profile)
      .where(eq(hackathonRegistrations.id, existing.id));
  } else {
    await db.insert(hackathonRegistrations).values({
      editionId: edition.id,
      email,
      ...profile,
    });
  }

  return { ok: true as const, alreadyPaid: false as const };
}

/** @deprecated Kept for old confirmation links; prefer grantKinshasaPaidSeat. */
export async function confirmKinshasaSeat(token: string) {
  const normalized = token.trim();
  if (!normalized) {
    return { ok: false as const, error: "invalid_token" as const, status: 400 };
  }

  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.paymentToken, normalized))
    .limit(1);

  if (!reg) {
    return { ok: false as const, error: "not_found" as const, status: 404 };
  }

  const isKinshasa =
    reg.promoCode === KINSHASA_PROMO_CODE ||
    reg.utmCampaign === KINSHASA_UTM_CAMPAIGN;
  if (!isKinshasa) {
    return { ok: false as const, error: "not_kinshasa" as const, status: 400 };
  }

  if (reg.paymentStatus === "paid" && reg.ticketCode) {
    return {
      ok: true as const,
      mode: "already_confirmed" as const,
      registrationId: reg.id,
      ticketCode: reg.ticketCode,
      email: reg.email,
      firstName: reg.firstName,
    };
  }

  if (
    reg.holdExpiresAt &&
    reg.holdExpiresAt.getTime() < Date.now() &&
    reg.paymentStatus !== "paid"
  ) {
    return { ok: false as const, error: "expired" as const, status: 410 };
  }

  const ticketCode = reg.ticketCode ?? generateTicketCode();
  let userId = reg.userId;
  if (!userId) {
    const account = await ensureHackathonUser({
      email: reg.email,
      firstName: reg.firstName,
      lastName: reg.lastName,
    });
    userId = account.id;
  }
  await markHackathonUserEmailVerified(userId);

  await db
    .update(hackathonRegistrations)
    .set({
      paymentStatus: "paid",
      ticketCode,
      paymentToken: null,
      holdExpiresAt: null,
      priceUsd: "0.00",
      promoCode: KINSHASA_PROMO_CODE,
      utmCampaign: KINSHASA_UTM_CAMPAIGN,
      userId,
      updatedAt: new Date(),
    })
    .where(eq(hackathonRegistrations.id, reg.id));

  return {
    ok: true as const,
    mode: "confirmed" as const,
    registrationId: reg.id,
    ticketCode,
    email: reg.email,
    firstName: reg.firstName,
    locale: reg.locale === "en" ? ("en" as const) : ("fr" as const),
  };
}
