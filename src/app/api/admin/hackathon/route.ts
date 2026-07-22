import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  hackathonEditions,
  hackathonPeople,
  hackathonPartners,
  hackathonRegistrations,
  hackathonSponsors,
  users,
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

    const userIds = [
      ...new Set(rows.map((r) => r.userId).filter((id): id is string => Boolean(id))),
    ];
    const userMap = new Map<
      string,
      {
        displayName: string | null;
        email: string;
        emailVerifiedAt: Date | null;
      }
    >();
    if (userIds.length) {
      const userRows = await db
        .select({
          id: users.id,
          displayName: users.displayName,
          email: users.email,
          emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(users)
        .where(inArray(users.id, userIds));
      for (const u of userRows) {
        userMap.set(u.id, {
          displayName: u.displayName,
          email: u.email,
          emailVerifiedAt: u.emailVerifiedAt,
        });
      }
    }

    const counts = new Map<string, number>();
    for (const r of rows) {
      if (!r.userId) continue;
      counts.set(r.userId, (counts.get(r.userId) ?? 0) + 1);
    }

    const registrations = rows.map((r) => {
      const u = r.userId ? userMap.get(r.userId) : undefined;
      const emailMismatch =
        Boolean(u && r.email) &&
        u!.email.toLowerCase() !== r.email.toLowerCase();
      return {
        ...r,
        userDisplayName: u?.displayName ?? null,
        userEmail: u?.email ?? null,
        userEmailVerified: Boolean(u?.emailVerifiedAt),
        userDuplicateInEdition: r.userId
          ? (counts.get(r.userId) ?? 0) > 1
          : false,
        userEmailMismatch: emailMismatch,
      };
    });

    return NextResponse.json({ registrations });
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
  priceDay1Usd: z.string().default("100"),
  priceFullUsd: z.string().default("100"),
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

const patchRegistrationZ = z.object({
  kind: z.literal("registration"),
  id: z.string().uuid(),
  action: z.enum(["relink_user", "resend_verify"]),
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
    if ((json as { kind?: string }).kind === "registration") {
      const regPatch = patchRegistrationZ.safeParse(json);
      if (!regPatch.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const db = getDb();
      const [reg] = await db
        .select()
        .from(hackathonRegistrations)
        .where(eq(hackathonRegistrations.id, regPatch.data.id))
        .limit(1);
      if (!reg) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      if (regPatch.data.action === "relink_user") {
        const { ensureHackathonUser } = await import("@/lib/hackathon/ensure-user");
        const account = await ensureHackathonUser({
          email: reg.email,
          firstName: reg.firstName,
          lastName: reg.lastName,
        });
        await db
          .update(hackathonRegistrations)
          .set({ userId: account.id, updatedAt: new Date() })
          .where(eq(hackathonRegistrations.id, reg.id));
        return NextResponse.json({
          ok: true,
          userId: account.id,
          emailVerified: Boolean(account.emailVerifiedAt),
        });
      }

      if (regPatch.data.action === "resend_verify") {
        if (reg.paymentStatus !== "pending_verify" || !reg.userId) {
          return NextResponse.json({ error: "invalid_status" }, { status: 409 });
        }
        const { sendEmailVerification } = await import(
          "@/lib/auth/email-verification"
        );
        await sendEmailVerification(reg.userId, reg.email, (reg.locale as "fr" | "en") || "fr", {
          hackathonRegistrationId: reg.id,
        });
        return NextResponse.json({ ok: true });
      }
    }

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

      if (lead.data.status === "confirmed") {
        const { ensurePartnerTicketCode } = await import(
          "@/lib/hackathon/access"
        );
        const ticketCode = await ensurePartnerTicketCode(lead.data.id);
        const [partner] = await db
          .select()
          .from(hackathonPartners)
          .where(eq(hackathonPartners.id, lead.data.id))
          .limit(1);
        if (partner && ticketCode) {
          const { sendHackathonPartnerConfirmEmail } = await import(
            "@/lib/email/messages/hackathon"
          );
          void sendHackathonPartnerConfirmEmail({
            to: partner.email,
            orgName: partner.orgName,
            contactName: partner.contactName,
            referentEmail: partner.email,
            roleLabel: "Partenaire McBuleli Hackathon",
            contributions: partner.partnershipTypes?.length
              ? partner.partnershipTypes
              : partner.contribution
                ? [partner.contribution]
                : ["Participation confirmée au McBuleli Hackathon"],
            ticketCode,
            locale: "fr",
          }).catch((e) =>
            console.warn("[hackathon] partner confirm email failed", e),
          );
        }
        return NextResponse.json({ ok: true, ticketCode });
      }
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
