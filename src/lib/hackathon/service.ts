import { randomBytes } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonPartners,
  hackathonPayments,
  hackathonPeople,
  hackathonRegistrations,
  hackathonSponsors,
} from "@/db";
import type {
  HackathonDisplayStats,
  HackathonPrizeCategory,
  HackathonProgramDay,
} from "@/db/schema";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  defaultPrizes,
  defaultProgram,
  emptyStats,
} from "@/lib/hackathon/constants";
import { passPublicUrl } from "@/lib/hackathon/access";

export function generateTicketCode(): string {
  return `MBH-${randomBytes(5).toString("hex").toUpperCase()}`;
}

export function generatePaymentToken(): string {
  return randomBytes(24).toString("base64url");
}

/** @deprecated Prefer passPublicUrl — kept for older callers; now points to /pass/. */
export function ticketPublicUrl(code: string): string {
  return passPublicUrl(code);
}

export function payLaterPublicUrl(token: string): string {
  return getAppAbsoluteUrl(`/hackathon/pay/${encodeURIComponent(token)}`);
}

export type FeaturedHackathonPayload = {
  edition: {
    id: string;
    slug: string;
    nameFr: string;
    nameEn: string;
    taglineFr: string | null;
    taglineEn: string | null;
    startDate: string | null;
    endDate: string | null;
    venue: string | null;
    city: string;
    maxSeats: number;
    seatsTaken: number;
    priceDay1Usd: string;
    priceFullUsd: string;
    status: string;
    program: HackathonProgramDay[];
    prizes: HackathonPrizeCategory[];
    gallery: { kind: string; url: string; captionFr?: string; captionEn?: string }[];
    displayStats: HackathonDisplayStats;
    coverImage: string | null;
  };
  jury: Array<{
    id: string;
    name: string;
    company: string | null;
    title: string | null;
    expertise: string | null;
    photoUrl: string | null;
  }>;
  mentors: Array<{
    id: string;
    name: string;
    company: string | null;
    title: string | null;
    expertise: string | null;
    photoUrl: string | null;
  }>;
  partnerLogos: Array<{ id: string; name: string; logoUrl: string | null; website: string | null }>;
  sponsorLogos: Array<{
    id: string;
    name: string;
    pack: string;
    logoUrl: string | null;
    website: string | null;
  }>;
};

/**
 * Static payload for local preview when DATABASE_URL / editions are unavailable.
 * Registration/partner forms still need a real edition id to submit.
 */
export function demoFeaturedHackathon(): FeaturedHackathonPayload {
  return {
    edition: {
      id: "00000000-0000-4000-8000-000000000001",
      slug: "kinshasa-vibe-coding-2026",
      nameFr: "McBuleli AI Hackathon",
      nameEn: "McBuleli AI Hackathon",
      taglineFr: "Bootcamp Vibe Coding + Hackathon : apprenez, construisez, pitchtez.",
      taglineEn: "Vibe Coding Bootcamp + Hackathon: learn, build, pitch.",
      startDate: null,
      endDate: null,
      venue: "Silikin Village, 63, Ave Colonel Mondjiba",
      city: "Kinshasa",
      maxSeats: 30,
      seatsTaken: 0,
      priceDay1Usd: "100",
      priceFullUsd: "100",
      status: "open",
      program: defaultProgram(),
      prizes: defaultPrizes(),
      gallery: [],
      displayStats: emptyStats(),
      coverImage: null,
    },
    jury: [
      {
        id: "demo-jury-1",
        name: "Jury McBuleli",
        company: "McBuleli",
        title: "Jury",
        expertise: null,
        photoUrl: null,
      },
    ],
    mentors: [
      {
        id: "demo-mentor-1",
        name: "Jeff Buleli - CEO",
        company: "McBuleli",
        title: "Full Stack Dev. & Entrepreneur",
        expertise: "Cursor · Claude · Codex",
        photoUrl: null,
      },
    ],
    partnerLogos: [],
    sponsorLogos: [],
  };
}

export async function getFeaturedHackathon(): Promise<FeaturedHackathonPayload | null> {
  const db = getDb();

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .orderBy(desc(hackathonEditions.createdAt))
    .limit(1);

  const row =
    edition ??
    (
      await db
        .select()
        .from(hackathonEditions)
        .orderBy(desc(hackathonEditions.createdAt))
        .limit(1)
    )[0];

  if (!row) return null;

  const [seatRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.editionId, row.id),
        sql`(
          ${hackathonRegistrations.paymentStatus} = 'paid'
          OR ${hackathonRegistrations.paymentStatus} = 'reserved'
        )`,
      ),
    );

  const people = await db
    .select()
    .from(hackathonPeople)
    .where(
      and(
        eq(hackathonPeople.editionId, row.id),
        eq(hackathonPeople.published, true),
      ),
    )
    .orderBy(hackathonPeople.sortOrder);

  const partners = await db
    .select()
    .from(hackathonPartners)
    .where(
      and(
        eq(hackathonPartners.editionId, row.id),
        eq(hackathonPartners.status, "confirmed"),
      ),
    );

  const sponsors = await db
    .select()
    .from(hackathonSponsors)
    .where(
      and(
        eq(hackathonSponsors.editionId, row.id),
        eq(hackathonSponsors.status, "confirmed"),
      ),
    );

  const mapPerson = (p: (typeof people)[number]) => ({
    id: p.id,
    name: p.name,
    company: p.company,
    title: p.title,
    expertise: p.expertise,
    photoUrl: p.photoUrl,
  });

  return {
    edition: {
      id: row.id,
      slug: row.slug,
      nameFr: row.nameFr,
      nameEn: row.nameEn,
      taglineFr: row.taglineFr,
      taglineEn: row.taglineEn,
      startDate: row.startDate?.toISOString() ?? null,
      endDate: row.endDate?.toISOString() ?? null,
      venue: row.venue,
      city: row.city,
      maxSeats: row.maxSeats,
      seatsTaken: seatRow?.count ?? 0,
      priceDay1Usd: String(row.priceDay1Usd),
      priceFullUsd: String(row.priceFullUsd),
      status: row.status,
      program: row.program?.length ? row.program : defaultProgram(),
      prizes: row.prizes?.length ? row.prizes : defaultPrizes(),
      gallery: row.gallery ?? [],
      displayStats: row.displayStats ?? emptyStats(),
      coverImage: row.coverImage,
    },
    jury: people.filter((p) => p.role === "jury").map(mapPerson),
    mentors: people.filter((p) => p.role === "mentor").map(mapPerson),
    partnerLogos: partners.map((p) => ({
      id: p.id,
      name: p.orgName,
      logoUrl: p.logoUrl,
      website: p.website,
    })),
    sponsorLogos: sponsors.map((s) => ({
      id: s.id,
      name: s.companyName,
      pack: s.pack,
      logoUrl: s.logoUrl,
      website: s.website,
    })),
  };
}

export async function getTicketByCode(code: string) {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.ticketCode, normalized))
    .limit(1);
  if (!reg) return null;

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, reg.editionId))
    .limit(1);

  return { registration: reg, edition: edition ?? null };
}

export async function completeHackathonPaymentByReference(args: {
  reference: string;
  status: "COMPLETED" | "FAILED" | "PROCESSING";
  providerTxId?: string | null;
  failureMessage?: string | null;
}): Promise<{ handled: boolean; ticketCode?: string; registrationId?: string }> {
  const db = getDb();
  const [pay] = await db
    .select()
    .from(hackathonPayments)
    .where(eq(hackathonPayments.reference, args.reference))
    .limit(1);

  if (!pay) return { handled: false };

  if (args.status === "PROCESSING") {
    await db
      .update(hackathonPayments)
      .set({
        status: "PROCESSING",
        providerTxId: args.providerTxId ?? pay.providerTxId,
        updatedAt: new Date(),
      })
      .where(eq(hackathonPayments.id, pay.id));
    return { handled: true };
  }

  if (args.status === "FAILED") {
    await db
      .update(hackathonPayments)
      .set({
        status: "FAILED",
        failureMessage: args.failureMessage ?? null,
        providerTxId: args.providerTxId ?? pay.providerTxId,
        updatedAt: new Date(),
        completedAt: new Date(),
      })
      .where(eq(hackathonPayments.id, pay.id));
    await db
      .update(hackathonRegistrations)
      .set({ paymentStatus: "failed", updatedAt: new Date() })
      .where(eq(hackathonRegistrations.id, pay.registrationId));
    return { handled: true, registrationId: pay.registrationId };
  }

  // COMPLETED - idempotent
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.id, pay.registrationId))
    .limit(1);

  if (!reg) return { handled: true };

  let ticketCode = reg.ticketCode;
  if (reg.paymentStatus === "paid" && ticketCode) {
    await db
      .update(hackathonPayments)
      .set({
        status: "COMPLETED",
        providerTxId: args.providerTxId ?? pay.providerTxId,
        updatedAt: new Date(),
        completedAt: pay.completedAt ?? new Date(),
      })
      .where(eq(hackathonPayments.id, pay.id));
    return { handled: true, ticketCode, registrationId: reg.id };
  }

  ticketCode = ticketCode ?? generateTicketCode();

  await db
    .update(hackathonPayments)
    .set({
      status: "COMPLETED",
      providerTxId: args.providerTxId ?? pay.providerTxId,
      updatedAt: new Date(),
      completedAt: new Date(),
    })
    .where(eq(hackathonPayments.id, pay.id));

  await db
    .update(hackathonRegistrations)
    .set({
      paymentStatus: "paid",
      ticketCode,
      paymentToken: null,
      holdExpiresAt: null,
      updatedAt: new Date(),
    })
    .where(eq(hackathonRegistrations.id, reg.id));

  return { handled: true, ticketCode, registrationId: reg.id };
}

export async function getRegistrationByPaymentToken(token: string) {
  const db = getDb();
  const normalized = token.trim();
  if (!normalized) return null;

  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.paymentToken, normalized))
    .limit(1);
  if (!reg) return null;

  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, reg.editionId))
    .limit(1);

  return { registration: reg, edition: edition ?? null };
}
