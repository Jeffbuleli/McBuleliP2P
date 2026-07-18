import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  hackathonEditions,
  hackathonPeople,
  hackathonPartners,
  hackathonRegistrations,
  hackathonSponsors,
} from "@/db";
import { StaffAuthError, requireStaff } from "@/lib/session-user";
import {
  defaultPrizes,
  defaultProgram,
  emptyStats,
} from "@/lib/hackathon/constants";

export const dynamic = "force-dynamic";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

export async function GET(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    return authError(e);
  }
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "editions";
  const editionId = url.searchParams.get("editionId");
  const db = getDb();

  if (tab === "editions") {
    const rows = await db
      .select()
      .from(hackathonEditions)
      .orderBy(desc(hackathonEditions.createdAt));
    return NextResponse.json({ editions: rows });
  }

  if (!editionId) {
    return NextResponse.json({ error: "editionId_required" }, { status: 400 });
  }

  if (tab === "registrations") {
    const rows = await db
      .select()
      .from(hackathonRegistrations)
      .where(eq(hackathonRegistrations.editionId, editionId))
      .orderBy(desc(hackathonRegistrations.createdAt))
      .limit(500);
    return NextResponse.json({ registrations: rows });
  }
  if (tab === "partners") {
    const rows = await db
      .select()
      .from(hackathonPartners)
      .where(eq(hackathonPartners.editionId, editionId))
      .orderBy(desc(hackathonPartners.createdAt));
    return NextResponse.json({ partners: rows });
  }
  if (tab === "sponsors") {
    const rows = await db
      .select()
      .from(hackathonSponsors)
      .where(eq(hackathonSponsors.editionId, editionId))
      .orderBy(desc(hackathonSponsors.createdAt));
    return NextResponse.json({ sponsors: rows });
  }
  if (tab === "people") {
    const rows = await db
      .select()
      .from(hackathonPeople)
      .where(eq(hackathonPeople.editionId, editionId))
      .orderBy(hackathonPeople.role, hackathonPeople.sortOrder);
    return NextResponse.json({ people: rows });
  }

  return NextResponse.json({ error: "bad_tab" }, { status: 400 });
}

const createEditionZ = z.object({
  slug: z.string().trim().min(2).max(128),
  nameFr: z.string().trim().min(2).max(200),
  nameEn: z.string().trim().min(2).max(200),
  city: z.string().trim().max(120).default("Kinshasa"),
  venue: z.string().trim().max(200).optional(),
  status: z.enum(["open", "closed", "soon"]).default("soon"),
  featured: z.boolean().optional(),
  maxSeats: z.number().int().min(1).max(10000).default(100),
  priceDay1Usd: z.string().default("50"),
  priceFullUsd: z.string().default("80"),
});

const patchEditionZ = z.object({
  id: z.string().uuid(),
  nameFr: z.string().trim().min(2).max(200).optional(),
  nameEn: z.string().trim().min(2).max(200).optional(),
  city: z.string().trim().max(120).optional(),
  venue: z.string().trim().max(200).nullable().optional(),
  status: z.enum(["open", "closed", "soon"]).optional(),
  featured: z.boolean().optional(),
  maxSeats: z.number().int().min(1).max(10000).optional(),
  priceDay1Usd: z.string().optional(),
  priceFullUsd: z.string().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

const patchLeadZ = z.object({
  kind: z.enum(["partner", "sponsor", "person"]),
  id: z.string().uuid(),
  status: z.enum(["lead", "confirmed", "rejected"]).optional(),
  published: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    return authError(e);
  }
  const json = await req.json().catch(() => null);
  const parsed = createEditionZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();

  if (data.featured) {
    await db
      .update(hackathonEditions)
      .set({ featured: false, updatedAt: new Date() });
  }

  const [row] = await db
    .insert(hackathonEditions)
    .values({
      slug: data.slug,
      nameFr: data.nameFr,
      nameEn: data.nameEn,
      city: data.city,
      venue: data.venue ?? null,
      status: data.status,
      featured: data.featured ?? false,
      maxSeats: data.maxSeats,
      priceDay1Usd: data.priceDay1Usd,
      priceFullUsd: data.priceFullUsd,
      program: defaultProgram(),
      prizes: defaultPrizes(),
      displayStats: emptyStats(),
    })
    .returning();

  return NextResponse.json({ edition: row });
}

export async function PATCH(req: Request) {
  try {
    await requireStaff();
  } catch (e) {
    return authError(e);
  }
  const json = await req.json().catch(() => null);

  if (json && typeof json === "object" && "kind" in json) {
    const lead = patchLeadZ.safeParse(json);
    if (!lead.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const db = getDb();
    if (lead.data.kind === "partner" && lead.data.status) {
      await db
        .update(hackathonPartners)
        .set({ status: lead.data.status })
        .where(eq(hackathonPartners.id, lead.data.id));
    } else if (lead.data.kind === "sponsor" && lead.data.status) {
      await db
        .update(hackathonSponsors)
        .set({ status: lead.data.status })
        .where(eq(hackathonSponsors.id, lead.data.id));
    } else if (lead.data.kind === "person" && lead.data.published !== undefined) {
      await db
        .update(hackathonPeople)
        .set({ published: lead.data.published })
        .where(eq(hackathonPeople.id, lead.data.id));
    }
    return NextResponse.json({ ok: true });
  }

  const parsed = patchEditionZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = parsed.data;
  const db = getDb();

  if (data.featured) {
    await db
      .update(hackathonEditions)
      .set({ featured: false, updatedAt: new Date() });
  }

  const [row] = await db
    .update(hackathonEditions)
    .set({
      ...(data.nameFr !== undefined ? { nameFr: data.nameFr } : {}),
      ...(data.nameEn !== undefined ? { nameEn: data.nameEn } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.venue !== undefined ? { venue: data.venue } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.featured !== undefined ? { featured: data.featured } : {}),
      ...(data.maxSeats !== undefined ? { maxSeats: data.maxSeats } : {}),
      ...(data.priceDay1Usd !== undefined ? { priceDay1Usd: data.priceDay1Usd } : {}),
      ...(data.priceFullUsd !== undefined ? { priceFullUsd: data.priceFullUsd } : {}),
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null }
        : {}),
      updatedAt: new Date(),
    })
    .where(eq(hackathonEditions.id, data.id))
    .returning();

  return NextResponse.json({ edition: row });
}
