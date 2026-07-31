import { and, asc, desc, eq, gt, isNull, ne, or, sql } from "drizzle-orm";
import {
  getDb,
  hackathonEditions,
  hackathonPartnerChatMessages,
  hackathonPartnerChatReads,
  hackathonPartnerOrgs,
  hackathonRegistrations,
} from "@/db";
import {
  BINANCE_PARTNER,
  IA_ACADEMIE_PARTNER,
  ILOKWE_PARTNER,
  KILELO_PARTNER,
  KIMIA_PARTNER,
  MONTANA_PAY_PARTNER,
  PAWAPAY_PARTNER,
  RDPI_PARTNER,
  SANJA_PARTNER,
  SILIKIN_PARTNER,
} from "@/lib/hackathon/event-content";
import { whatsappMeUrl } from "@/lib/hackathon/promo";
import { SUPPORT_EMAIL } from "@/lib/support-contact";

export type PartnerOrgStatus =
  | "confirmed"
  | "in_progress"
  | "undetermined"
  | "rejected";

export const PARTNER_ORG_STATUSES: PartnerOrgStatus[] = [
  "confirmed",
  "in_progress",
  "undetermined",
  "rejected",
];

export type PartnerOrgPublic = {
  id: string;
  slug: string;
  orgName: string;
  shortName: string;
  logoUrl: string | null;
  website: string | null;
  status: PartnerOrgStatus;
  sortOrder: number;
};

export type PartnerOrgRosterRow = PartnerOrgPublic & {
  contactEmail: string | null;
};

type SeedOrg = {
  slug: string;
  orgName: string;
  shortName: string;
  logoUrl: string | null;
  contactEmail: string;
  website: string | null;
  status: PartnerOrgStatus;
  sortOrder: number;
};

/** Canonical roster + statuses (synced on each ensurePartnerOrgsSeeded). */
const SEED_ORGS: SeedOrg[] = [
  {
    slug: "ilokwe",
    orgName: ILOKWE_PARTNER.name,
    shortName: "ILOKWE",
    logoUrl: ILOKWE_PARTNER.logoUrl,
    contactEmail: ILOKWE_PARTNER.email,
    website: ILOKWE_PARTNER.facebook,
    status: "confirmed",
    sortOrder: 10,
  },
  {
    slug: "silikin",
    orgName: SILIKIN_PARTNER.name,
    shortName: "Silikin",
    logoUrl: SILIKIN_PARTNER.logoUrl,
    contactEmail: "reception_skv@texaf-rdc.com",
    website: SILIKIN_PARTNER.website,
    status: "in_progress",
    sortOrder: 20,
  },
  {
    slug: "pawapay",
    orgName: PAWAPAY_PARTNER.name,
    shortName: "pawaPay",
    logoUrl: PAWAPAY_PARTNER.logoUrl,
    contactEmail: SUPPORT_EMAIL,
    website: PAWAPAY_PARTNER.website,
    status: "confirmed",
    sortOrder: 30,
  },
  {
    slug: "binance",
    orgName: BINANCE_PARTNER.name,
    shortName: "Binance",
    logoUrl: BINANCE_PARTNER.logoUrl,
    contactEmail: SUPPORT_EMAIL,
    website: BINANCE_PARTNER.demo,
    status: "confirmed",
    sortOrder: 35,
  },
  {
    slug: "kimia",
    orgName: "KIMIA Service",
    shortName: "KIMIA",
    logoUrl: KIMIA_PARTNER.logoUrl,
    contactEmail: "kimiaservice896@gmail.com",
    website: KIMIA_PARTNER.website,
    status: "confirmed",
    sortOrder: 40,
  },
  {
    slug: "sanja-service",
    orgName: SANJA_PARTNER.name,
    shortName: "SanJa",
    logoUrl: SANJA_PARTNER.logoUrl,
    contactEmail: SANJA_PARTNER.email,
    website: SANJA_PARTNER.website,
    status: "confirmed",
    sortOrder: 42,
  },
  {
    slug: "montana-pay",
    orgName: MONTANA_PAY_PARTNER.name,
    shortName: "MontanaPay",
    logoUrl: MONTANA_PAY_PARTNER.logoUrl,
    contactEmail: MONTANA_PAY_PARTNER.email,
    website: MONTANA_PAY_PARTNER.website,
    status: "confirmed",
    sortOrder: 44,
  },
  {
    slug: "bienv-photography",
    orgName: "Bienv Photography 243",
    shortName: "Bienv Photo",
    logoUrl: null,
    contactEmail: "bienvngonda862@gmail.com",
    website: null,
    status: "confirmed",
    sortOrder: 46,
  },
  {
    slug: "rdpi",
    orgName: "RDPI Think Tank",
    shortName: "RDPI",
    logoUrl: RDPI_PARTNER.logoUrl,
    contactEmail: "info@rdpithinktank.org",
    website: RDPI_PARTNER.website,
    status: "confirmed",
    sortOrder: 50,
  },
  {
    slug: "kilelo",
    orgName: KILELO_PARTNER.name,
    shortName: "Kilelo",
    logoUrl: KILELO_PARTNER.logoUrl,
    contactEmail: KILELO_PARTNER.email,
    website: KILELO_PARTNER.website,
    status: "confirmed",
    sortOrder: 55,
  },
  {
    slug: "tyts",
    orgName: "THE YOUNG TECHNOLOGY SERVICE",
    shortName: "TYTS",
    logoUrl: null,
    contactEmail: "nsomoneaaron2@gmail.com",
    website: null,
    status: "confirmed",
    sortOrder: 58,
  },
  {
    slug: "e-com-sas",
    orgName: "e-COM SAS",
    shortName: "E-Com",
    logoUrl: null,
    contactEmail: "contact@e-comsas.com",
    website: "https://e-comsas.com",
    status: "in_progress",
    sortOrder: 60,
  },
  {
    slug: "cesar-group",
    orgName: "César Group",
    shortName: "César",
    logoUrl: null,
    contactEmail: "cesargrouprdc@gmail.com",
    website: "https://cesargroup-rdc.com",
    status: "in_progress",
    sortOrder: 65,
  },
  {
    slug: "ia-academie-chk",
    orgName: "IA Académie / CHK",
    shortName: "IA Académie",
    logoUrl: IA_ACADEMIE_PARTNER.logoUrl,
    contactEmail: "contact@ia-academie.cd",
    website: IA_ACADEMIE_PARTNER.website,
    status: "confirmed",
    sortOrder: 70,
  },
];

export async function getFeaturedEditionId(): Promise<string | null> {
  const db = getDb();
  const [featured] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  if (featured) return featured.id;
  const [any] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .orderBy(desc(hackathonEditions.createdAt))
    .limit(1);
  return any?.id ?? null;
}

/** Idempotent seed + status sync for known partner orgs. */
export async function ensurePartnerOrgsSeeded(
  editionId?: string,
): Promise<string | null> {
  const db = getDb();
  const eid = editionId ?? (await getFeaturedEditionId());
  if (!eid) return null;

  for (const org of SEED_ORGS) {
    const [existing] = await db
      .select({ id: hackathonPartnerOrgs.id })
      .from(hackathonPartnerOrgs)
      .where(
        and(
          eq(hackathonPartnerOrgs.editionId, eid),
          eq(hackathonPartnerOrgs.slug, org.slug),
        ),
      )
      .limit(1);
    if (existing) {
      await db
        .update(hackathonPartnerOrgs)
        .set({
          orgName: org.orgName,
          shortName: org.shortName,
          logoUrl: org.logoUrl,
          contactEmail: org.contactEmail.toLowerCase(),
          website: org.website,
          status: org.status,
          sortOrder: org.sortOrder,
          updatedAt: new Date(),
        })
        .where(eq(hackathonPartnerOrgs.id, existing.id));
      continue;
    }
    await db.insert(hackathonPartnerOrgs).values({
      editionId: eid,
      slug: org.slug,
      orgName: org.orgName,
      shortName: org.shortName,
      logoUrl: org.logoUrl,
      contactEmail: org.contactEmail.toLowerCase(),
      website: org.website,
      status: org.status,
      sortOrder: org.sortOrder,
    });
  }

  try {
    const { ensureAllPartnerPasses } = await import(
      "@/lib/hackathon/partner-passes"
    );
    await ensureAllPartnerPasses(eid);
  } catch (e) {
    console.warn("[hackathon] ensureAllPartnerPasses skipped", e);
  }

  return eid;
}

function asStatus(raw: string): PartnerOrgStatus {
  if (
    raw === "confirmed" ||
    raw === "in_progress" ||
    raw === "undetermined" ||
    raw === "rejected"
  ) {
    return raw;
  }
  return "undetermined";
}

export async function listPartnerOrgsPublic(
  editionId: string,
): Promise<PartnerOrgPublic[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: hackathonPartnerOrgs.id,
      slug: hackathonPartnerOrgs.slug,
      orgName: hackathonPartnerOrgs.orgName,
      shortName: hackathonPartnerOrgs.shortName,
      logoUrl: hackathonPartnerOrgs.logoUrl,
      website: hackathonPartnerOrgs.website,
      status: hackathonPartnerOrgs.status,
      sortOrder: hackathonPartnerOrgs.sortOrder,
    })
    .from(hackathonPartnerOrgs)
    .where(
      and(
        eq(hackathonPartnerOrgs.editionId, editionId),
        ne(hackathonPartnerOrgs.status, "rejected"),
      ),
    )
    .orderBy(asc(hackathonPartnerOrgs.sortOrder), asc(hackathonPartnerOrgs.orgName));

  return rows.map((r) => ({
    ...r,
    status: asStatus(r.status),
  }));
}

export async function listPartnerOrgsRoster(
  editionId: string,
  includeEmail: boolean,
): Promise<PartnerOrgRosterRow[]> {
  const publicRows = await listPartnerOrgsPublic(editionId);
  if (!includeEmail) {
    return publicRows.map((r) => ({ ...r, contactEmail: null }));
  }
  const db = getDb();
  const emails = await db
    .select({
      id: hackathonPartnerOrgs.id,
      contactEmail: hackathonPartnerOrgs.contactEmail,
    })
    .from(hackathonPartnerOrgs)
    .where(eq(hackathonPartnerOrgs.editionId, editionId));
  const map = new Map(emails.map((e) => [e.id, e.contactEmail]));
  return publicRows.map((r) => ({
    ...r,
    contactEmail: map.get(r.id) ?? null,
  }));
}

export function partnerOrgStats(orgs: PartnerOrgPublic[]) {
  const confirmed = orgs.filter((o) => o.status === "confirmed").length;
  const inProgress = orgs.filter((o) => o.status === "in_progress").length;
  const undetermined = orgs.filter((o) => o.status === "undetermined").length;
  const total = confirmed + inProgress + undetermined;
  return { total, confirmed, inProgress, undetermined };
}

export async function getPartnerOrgById(orgId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(eq(hackathonPartnerOrgs.id, orgId))
    .limit(1);
  return row ?? null;
}

export type PartnerChatMessageView = {
  id: string;
  orgId: string | null;
  senderUserId: string | null;
  senderLabel: string;
  displayName: string;
  orgStatus: PartnerOrgStatus | null;
  orgLogoUrl: string | null;
  body: string;
  imageUrl: string | null;
  messageType: string;
  createdAt: string;
  own: boolean;
  seen: boolean;
  unread: boolean;
};

export async function listChatMessages(
  editionId: string,
  opts?: { viewerUserId?: string | null; limit?: number },
): Promise<PartnerChatMessageView[]> {
  const limit = opts?.limit ?? 80;
  const viewerUserId = opts?.viewerUserId ?? null;
  const db = getDb();
  const rows = await db
    .select({
      id: hackathonPartnerChatMessages.id,
      orgId: hackathonPartnerChatMessages.orgId,
      senderUserId: hackathonPartnerChatMessages.senderUserId,
      senderLabel: hackathonPartnerChatMessages.senderLabel,
      body: hackathonPartnerChatMessages.body,
      imageUrl: hackathonPartnerChatMessages.imageUrl,
      messageType: hackathonPartnerChatMessages.messageType,
      createdAt: hackathonPartnerChatMessages.createdAt,
      orgShortName: hackathonPartnerOrgs.shortName,
      orgStatus: hackathonPartnerOrgs.status,
      orgLogoUrl: hackathonPartnerOrgs.logoUrl,
    })
    .from(hackathonPartnerChatMessages)
    .leftJoin(
      hackathonPartnerOrgs,
      eq(hackathonPartnerChatMessages.orgId, hackathonPartnerOrgs.id),
    )
    .where(eq(hackathonPartnerChatMessages.editionId, editionId))
    .orderBy(desc(hackathonPartnerChatMessages.createdAt))
    .limit(limit);

  const readRows = await db
    .select({
      userId: hackathonPartnerChatReads.userId,
      lastReadAt: hackathonPartnerChatReads.lastReadAt,
    })
    .from(hackathonPartnerChatReads)
    .where(eq(hackathonPartnerChatReads.editionId, editionId));

  const viewerRead = viewerUserId
    ? readRows.find((r) => r.userId === viewerUserId)?.lastReadAt ?? null
    : null;

  return rows
    .map((r) => {
      const own = Boolean(
        viewerUserId && r.senderUserId && r.senderUserId === viewerUserId,
      );
      // Seen by at least one other member (not the sender).
      const seenByOther = readRows.some(
        (rr) =>
          rr.userId !== (r.senderUserId ?? "") && rr.lastReadAt >= r.createdAt,
      );
      const unread =
        Boolean(viewerUserId) &&
        !own &&
        (!viewerRead || r.createdAt > viewerRead);
      return {
        id: r.id,
        orgId: r.orgId,
        senderUserId: r.senderUserId,
        senderLabel: r.senderLabel,
        displayName: r.orgShortName
          ? `${r.senderLabel}/${r.orgShortName}`
          : r.senderLabel,
        orgStatus: r.orgStatus ? asStatus(r.orgStatus) : null,
        orgLogoUrl: r.orgLogoUrl,
        body: r.body,
        imageUrl: r.imageUrl,
        messageType: r.messageType,
        createdAt: r.createdAt.toISOString(),
        own,
        seen: own ? seenByOther : false,
        unread,
      };
    })
    .reverse();
}

export async function postChatMessage(args: {
  editionId: string;
  orgId: string | null;
  senderUserId: string;
  senderLabel: string;
  body: string;
  imageUrl?: string | null;
}) {
  const body = args.body.trim().slice(0, 4000);
  const imageUrl = args.imageUrl?.trim() || null;
  if (!body && !imageUrl) throw new Error("empty_body");
  const label = args.senderLabel.trim().slice(0, 80) || "Membre";
  const db = getDb();
  const [row] = await db
    .insert(hackathonPartnerChatMessages)
    .values({
      editionId: args.editionId,
      orgId: args.orgId,
      senderUserId: args.senderUserId,
      senderLabel: label,
      body: body || (imageUrl ? " " : ""),
      imageUrl,
      messageType: "chat",
    })
    .returning({ id: hackathonPartnerChatMessages.id });
  return row;
}

export async function markPartnerChatRead(editionId: string, userId: string) {
  const db = getDb();
  const now = new Date();
  await db
    .insert(hackathonPartnerChatReads)
    .values({
      editionId,
      userId,
      lastReadAt: now,
    })
    .onConflictDoUpdate({
      target: [
        hackathonPartnerChatReads.editionId,
        hackathonPartnerChatReads.userId,
      ],
      set: { lastReadAt: now },
    });
  return now;
}

export async function countPartnerChatUnread(
  editionId: string,
  userId: string,
): Promise<number> {
  const db = getDb();
  const [read] = await db
    .select({ lastReadAt: hackathonPartnerChatReads.lastReadAt })
    .from(hackathonPartnerChatReads)
    .where(
      and(
        eq(hackathonPartnerChatReads.editionId, editionId),
        eq(hackathonPartnerChatReads.userId, userId),
      ),
    )
    .limit(1);

  const unreadCond = read?.lastReadAt
    ? gt(hackathonPartnerChatMessages.createdAt, read.lastReadAt)
    : sql`true`;

  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hackathonPartnerChatMessages)
    .where(
      and(
        eq(hackathonPartnerChatMessages.editionId, editionId),
        unreadCond,
        or(
          isNull(hackathonPartnerChatMessages.senderUserId),
          ne(hackathonPartnerChatMessages.senderUserId, userId),
        ),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function updatePartnerOrgStatus(
  orgId: string,
  status: PartnerOrgStatus,
) {
  const db = getDb();
  const [row] = await db
    .update(hackathonPartnerOrgs)
    .set({ status, updatedAt: new Date() })
    .where(eq(hackathonPartnerOrgs.id, orgId))
    .returning();
  return row ?? null;
}

export async function countPartnerOrgMessages(editionId: string) {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hackathonPartnerChatMessages)
    .where(eq(hackathonPartnerChatMessages.editionId, editionId));
  return row?.n ?? 0;
}

export type PartnerChatParticipant = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsapp: string | null;
  whatsappUrl: string | null;
  paymentStatus: string;
  ticketCode: string | null;
  confirmed: boolean;
  createdAt: string;
};

export async function listEditionParticipants(
  editionId: string,
): Promise<PartnerChatParticipant[]> {
  const db = getDb();
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
      createdAt: hackathonRegistrations.createdAt,
    })
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.editionId, editionId))
    .orderBy(desc(hackathonRegistrations.createdAt))
    .limit(500);

  return rows.map((r) => {
    const status = (r.paymentStatus || "").toLowerCase();
    const confirmed =
      status === "paid" ||
      status === "confirmed" ||
      status === "succeeded" ||
      status === "success";
    return {
      ...r,
      whatsappUrl: whatsappMeUrl(r.whatsapp || r.phone),
      confirmed,
      createdAt: r.createdAt.toISOString(),
    };
  });
}
