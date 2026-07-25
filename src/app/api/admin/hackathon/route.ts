import { NextResponse } from "next/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import {
  getDb,
  hackathonAnnouncements,
  hackathonEditions,
  hackathonJuryScores,
  hackathonMentorRequests,
  hackathonPeople,
  hackathonPartners,
  hackathonPartnerOrgs,
  hackathonPromoCodes,
  hackathonRegistrations,
  hackathonSponsors,
  hackathonSubmissions,
  hackathonTeamMembers,
  hackathonTeams,
  users,
} from "@/db";
import { StaffAuthError, requireStaffScope, requireSuperAdmin } from "@/lib/session-user";
import {
  defaultPrizes,
  defaultProgram,
  emptyStats,
} from "@/lib/hackathon/constants";
import { ensurePartnerOrgsSeeded } from "@/lib/hackathon/partner-chat";
import type { PartnerOrgStatus } from "@/lib/hackathon/partner-chat";
import { ensureChallengesSeeded } from "@/lib/hackathon/challenges";
import { averageTeamScore } from "@/lib/hackathon/submissions";
import { markTeamJudged, markTeamPresented } from "@/lib/hackathon/teams";

export const dynamic = "force-dynamic";

function authError(e: unknown) {
  const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
  return NextResponse.json({ error: msg }, { status: 403 });
}

/** Read: stats agents, scan agents (editions list only), or super_admin. */
async function requireHackathonRead(tab: string): Promise<{
  isSuperAdmin: boolean;
}> {
  try {
    await requireSuperAdmin();
    return { isSuperAdmin: true };
  } catch {
    if (tab === "editions") {
      try {
        await requireStaffScope("hackathon_stats");
        return { isSuperAdmin: false };
      } catch {
        await requireStaffScope("hackathon_scan");
        return { isSuperAdmin: false };
      }
    }
    await requireStaffScope("hackathon_stats");
    return { isSuperAdmin: false };
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tab = url.searchParams.get("tab") ?? "editions";
  let readAuth: { isSuperAdmin: boolean };
  try {
    readAuth = await requireHackathonRead(tab);
  } catch (e) {
    return authError(e);
  }
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

  if (tab === "promo") {
    const { listAdminPromoOverview } = await import(
      "@/lib/hackathon/promo-claims"
    );
    const promos = await listAdminPromoOverview(editionId);
    return NextResponse.json({
      promos: readAuth.isSuperAdmin
        ? promos
        : promos.map(({ dashboardToken: _t, ...rest }) => rest),
    });
  }

  if (tab === "chat_orgs") {
    await ensurePartnerOrgsSeeded(editionId);
    const rows = await db
      .select()
      .from(hackathonPartnerOrgs)
      .where(eq(hackathonPartnerOrgs.editionId, editionId))
      .orderBy(asc(hackathonPartnerOrgs.sortOrder), asc(hackathonPartnerOrgs.orgName));
    return NextResponse.json({
      chatOrgs: readAuth.isSuperAdmin
        ? rows
        : rows.map(({ contactEmail: _e, otpHash: _h, otpExpiresAt: _x, ...rest }) => rest),
    });
  }

  if (tab === "teams") {
    await ensureChallengesSeeded(editionId);
    const teams = await db
      .select()
      .from(hackathonTeams)
      .where(eq(hackathonTeams.editionId, editionId))
      .orderBy(desc(hackathonTeams.updatedAt));
    const enriched = [];
    for (const team of teams) {
      const members = await db
        .select({
          registrationId: hackathonTeamMembers.registrationId,
          role: hackathonTeamMembers.role,
          firstName: hackathonRegistrations.firstName,
          lastName: hackathonRegistrations.lastName,
        })
        .from(hackathonTeamMembers)
        .innerJoin(
          hackathonRegistrations,
          eq(hackathonTeamMembers.registrationId, hackathonRegistrations.id),
        )
        .where(eq(hackathonTeamMembers.teamId, team.id));
      const [sub] = await db
        .select()
        .from(hackathonSubmissions)
        .where(eq(hackathonSubmissions.teamId, team.id))
        .limit(1);
      let average: number | null = null;
      if (sub) {
        const scores = await db
          .select()
          .from(hackathonJuryScores)
          .where(eq(hackathonJuryScores.submissionId, sub.id));
        average = averageTeamScore(scores);
      }
      enriched.push({
        ...team,
        members,
        submissionStatus: sub?.status ?? null,
        averageScore: average,
      });
    }
    return NextResponse.json({ teams: enriched });
  }

  if (tab === "announcements") {
    const rows = await db
      .select()
      .from(hackathonAnnouncements)
      .where(eq(hackathonAnnouncements.editionId, editionId))
      .orderBy(
        desc(hackathonAnnouncements.pinned),
        desc(hackathonAnnouncements.publishedAt),
      );
    return NextResponse.json({ announcements: rows });
  }

  if (tab === "mentors") {
    const rows = await db
      .select({
        id: hackathonMentorRequests.id,
        topic: hackathonMentorRequests.topic,
        notes: hackathonMentorRequests.notes,
        status: hackathonMentorRequests.status,
        teamId: hackathonMentorRequests.teamId,
        teamName: hackathonTeams.name,
        createdAt: hackathonMentorRequests.createdAt,
      })
      .from(hackathonMentorRequests)
      .innerJoin(
        hackathonTeams,
        eq(hackathonMentorRequests.teamId, hackathonTeams.id),
      )
      .where(eq(hackathonMentorRequests.editionId, editionId))
      .orderBy(desc(hackathonMentorRequests.createdAt));
    return NextResponse.json({ mentors: rows });
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

const createPromoZ = z.object({
  kind: z.literal("promo"),
  editionId: z.string().uuid(),
  code: z.string().trim().min(3).max(32),
  orgName: z.string().trim().min(2).max(200),
  partnerEmail: z.string().trim().email().max(255),
  partnerName: z.string().trim().max(160).optional().nullable(),
  discountPercent: z.number().min(0).max(100).optional(),
  cashbackUsd: z.number().min(0).max(10_000).optional(),
});

const patchPromoZ = z.object({
  kind: z.literal("promo"),
  id: z.string().uuid(),
  active: z.boolean().optional(),
  orgName: z.string().trim().min(2).max(200).optional(),
  partnerEmail: z.string().trim().email().max(255).optional(),
  partnerName: z.string().trim().max(160).nullable().optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  cashbackUsd: z.number().min(0).max(10_000).optional(),
});

const patchClaimZ = z.object({
  kind: z.literal("promo_claim"),
  id: z.string().uuid(),
  status: z.enum(["approved", "paid", "rejected"]),
  note: z.string().trim().max(2000).optional().nullable(),
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

const patchChatOrgZ = z.object({
  kind: z.literal("chat_org"),
  id: z.string().uuid(),
  status: z.enum(["confirmed", "in_progress", "undetermined", "rejected"]),
});

const patchRegistrationZ = z.object({
  kind: z.literal("registration"),
  id: z.string().uuid(),
  action: z.enum(["relink_user", "resend_verify"]),
});

const patchTeamZ = z.object({
  kind: z.literal("team"),
  id: z.string().uuid(),
  action: z.enum(["presented", "judged"]),
});

const patchMentorZ = z.object({
  kind: z.literal("mentor_request"),
  id: z.string().uuid(),
  status: z.enum(["accepted", "closed", "open"]),
});

const patchPersonLinkZ = z.object({
  kind: z.literal("person"),
  id: z.string().uuid(),
  published: z.boolean().optional(),
  userId: z.string().uuid().nullable().optional(),
});

const createAnnouncementZ = z.object({
  kind: z.literal("announcement"),
  editionId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(5000),
  pinned: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }
  const json = await req.json().catch(() => null);

  if (json && typeof json === "object" && (json as { kind?: string }).kind === "announcement") {
    const parsed = createAnnouncementZ.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const db = getDb();
    const [row] = await db
      .insert(hackathonAnnouncements)
      .values({
        editionId: parsed.data.editionId,
        title: parsed.data.title,
        body: parsed.data.body,
        pinned: parsed.data.pinned ?? false,
      })
      .returning();
    return NextResponse.json({ announcement: row });
  }

  if (json && typeof json === "object" && (json as { kind?: string }).kind === "promo") {
    const parsed = createPromoZ.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const { upsertPartnerPromo } = await import("@/lib/hackathon/promo");
    const promo = await upsertPartnerPromo(parsed.data);
    return NextResponse.json({ promo });
  }

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

  await ensureChallengesSeeded(row.id);

  return NextResponse.json({ edition: row });
}

export async function PATCH(req: Request) {
  let admin;
  try {
    admin = await requireSuperAdmin();
  } catch (e) {
    return authError(e);
  }
  const json = await req.json().catch(() => null);

  if (json && typeof json === "object" && "kind" in json) {
    if ((json as { kind?: string }).kind === "chat_org") {
      const parsed = patchChatOrgZ.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const { updatePartnerOrgStatus } = await import(
        "@/lib/hackathon/partner-chat"
      );
      const row = await updatePartnerOrgStatus(
        parsed.data.id,
        parsed.data.status as PartnerOrgStatus,
      );
      if (!row) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }
      return NextResponse.json({ org: row });
    }

    if ((json as { kind?: string }).kind === "team") {
      const parsed = patchTeamZ.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      if (parsed.data.action === "presented") {
        await markTeamPresented(parsed.data.id);
      } else {
        await markTeamJudged(parsed.data.id);
      }
      return NextResponse.json({ ok: true });
    }

    if ((json as { kind?: string }).kind === "mentor_request") {
      const parsed = patchMentorZ.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const db = getDb();
      const now = new Date();
      await db
        .update(hackathonMentorRequests)
        .set({
          status: parsed.data.status,
          acceptedAt: parsed.data.status === "accepted" ? now : undefined,
          closedAt: parsed.data.status === "closed" ? now : undefined,
          updatedAt: now,
        })
        .where(eq(hackathonMentorRequests.id, parsed.data.id));
      return NextResponse.json({ ok: true });
    }

    if (
      (json as { kind?: string }).kind === "person" &&
      "userId" in (json as object)
    ) {
      const parsed = patchPersonLinkZ.safeParse(json);
      if (!parsed.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const db = getDb();
      await db
        .update(hackathonPeople)
        .set({
          ...(parsed.data.published !== undefined
            ? { published: parsed.data.published }
            : {}),
          ...(parsed.data.userId !== undefined
            ? { userId: parsed.data.userId }
            : {}),
        })
        .where(eq(hackathonPeople.id, parsed.data.id));
      return NextResponse.json({ ok: true });
    }

    if ((json as { kind?: string }).kind === "promo_claim") {
      const claimPatch = patchClaimZ.safeParse(json);
      if (!claimPatch.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const { resolveCashbackClaim } = await import(
        "@/lib/hackathon/promo-claims"
      );
      const result = await resolveCashbackClaim({
        claimId: claimPatch.data.id,
        status: claimPatch.data.status,
        adminUserId: admin.id,
        note: claimPatch.data.note,
      });
      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }
      return NextResponse.json({ ok: true });
    }

    if ((json as { kind?: string }).kind === "promo") {
      const promoPatch = patchPromoZ.safeParse(json);
      if (!promoPatch.success) {
        return NextResponse.json({ error: "invalid_body" }, { status: 400 });
      }
      const db = getDb();
      const data = promoPatch.data;
      const [existing] = await db
        .select()
        .from(hackathonPromoCodes)
        .where(eq(hackathonPromoCodes.id, data.id))
        .limit(1);
      if (!existing) {
        return NextResponse.json({ error: "not_found" }, { status: 404 });
      }

      if (
        data.orgName !== undefined ||
        data.partnerEmail !== undefined ||
        data.partnerName !== undefined ||
        data.discountPercent !== undefined ||
        data.cashbackUsd !== undefined
      ) {
        const { upsertPartnerPromo } = await import("@/lib/hackathon/promo");
        await upsertPartnerPromo({
          editionId: existing.editionId,
          code: existing.code,
          orgName: data.orgName ?? existing.orgName,
          partnerEmail: data.partnerEmail ?? existing.partnerEmail,
          partnerName:
            data.partnerName !== undefined
              ? data.partnerName
              : existing.partnerName,
          discountPercent:
            data.discountPercent ?? Number(existing.discountPercent),
          cashbackUsd: data.cashbackUsd ?? Number(existing.cashbackUsd),
        });
      }

      if (data.active !== undefined) {
        const { setPromoActive } = await import("@/lib/hackathon/promo");
        await setPromoActive(data.id, data.active);
      }
      return NextResponse.json({ ok: true });
    }

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
