/**
 * Partner door badges: 2 seats per org (SanJa = 0).
 * Seat 1 = contact principal; seat 2 = grantable to a colleague.
 */
import { and, asc, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonPartnerOrgs,
  hackathonPartnerPasses,
  users,
} from "@/db";
import {
  generatePartnerTicketCode,
  passPublicUrl,
} from "@/lib/hackathon/access";

export type PartnerBadgeKind =
  | "partner"
  | "speaker"
  | "mentor"
  | "jury"
  | "sponsor"
  | "media";

type OrgBadgeProfile = {
  seats: 0 | 1 | 2;
  roleLabel: string;
  badgeKind: PartnerBadgeKind;
  defaultTasks: Array<{ title: string; kind: string }>;
};

/** Per-org badge + preparation profile (slug → config). */
export const PARTNER_BADGE_PROFILES: Record<string, OrgBadgeProfile> = {
  ilokwe: {
    seats: 2,
    roleLabel: "Sponsor Or - Jury - Talk - Mentorat - Atelier",
    badgeKind: "sponsor",
    defaultTasks: [
      { title: "Confirmer le créneau atelier rentabilité agricole", kind: "atelier" },
      { title: "Préparer notes mentorat équipes AgroTech", kind: "mentorat" },
      { title: "Préparer grille jury AgroTech", kind: "jury" },
      { title: "Vérifier logo Or + naming Prix ILOKWE", kind: "logo" },
      { title: "Attribuer la 2e place badge à un collègue (si besoin)", kind: "logistique" },
    ],
  },
  rdpi: {
    seats: 2,
    roleLabel: "Jury - Talk Policy & Impact",
    badgeKind: "jury",
    defaultTasks: [
      { title: "Finaliser titre & durée de l'atelier policy/impact", kind: "atelier" },
      { title: "Préparer points mentorat réglementaire", kind: "mentorat" },
      { title: "Préparer critères jury impact / durabilité", kind: "jury" },
      { title: "Attribuer la 2e place badge à un collègue (si besoin)", kind: "logistique" },
    ],
  },
  kimia: {
    seats: 2,
    roleLabel: "Services & Talents - Mentorat",
    badgeKind: "mentor",
    defaultTasks: [
      { title: "Confirmer créneau mentorat employabilité", kind: "mentorat" },
      { title: "Désigner le représentant présent à Silikin (Mr Mike Mulopo)", kind: "logistique" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  /** SanJa: partenaire confirmé mais pas d'intervention terrain → pas de badges. */
  "sanja-service": {
    seats: 0,
    roleLabel: "Partenaire (sans intervention porte)",
    badgeKind: "partner",
    defaultTasks: [],
  },
  "montana-pay": {
    seats: 2,
    roleLabel: "Talk FinTech / Escrow - Mentorat",
    badgeKind: "speaker",
    defaultTasks: [
      { title: "Envoyer logo officiel PNG/SVG", kind: "logo" },
      { title: "Finaliser titre & créneau session escrow", kind: "atelier" },
      { title: "Confirmer mentorat marketplace / wallet", kind: "mentorat" },
      { title: "Décider jury FinTech oui/non", kind: "jury" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  "bienv-photography": {
    seats: 1,
    roleLabel: "Médias / Photography",
    badgeKind: "media",
    defaultTasks: [
      { title: "Couverture photo & vidéo (28-29 août)", kind: "other" },
      { title: "Interviews & moments forts", kind: "other" },
      { title: "Livraison : 1 vidéo résumé + série photos", kind: "other" },
    ],
  },
  kilelo: {
    seats: 2,
    roleLabel: "Talk Marketplace - Mentorat",
    badgeKind: "speaker",
    defaultTasks: [
      { title: "Préparer talk matching / confiance / avis", kind: "atelier" },
      { title: "Préparer notes mentorat ciblé", kind: "mentorat" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  tyts: {
    seats: 2,
    roleLabel: "Tech - Cyber / réseaux",
    badgeKind: "mentor",
    defaultTasks: [
      { title: "Confirmer modalités mentorat cyber/réseaux", kind: "mentorat" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  "ia-academie-chk": {
    seats: 2,
    roleLabel: "Talk académique - Vivier - Atelier",
    badgeKind: "speaker",
    defaultTasks: [
      { title: "Confirmer vivier apprenants / alumni", kind: "other" },
      { title: "Finaliser atelier ou mentorat", kind: "atelier" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  /** Lieu hôte — pas de badge partenaire (accueil inclus dans la location). */
  silikin: {
    seats: 0,
    roleLabel: "Lieu / hub d'innovation (sans badge)",
    badgeKind: "partner",
    defaultTasks: [
      { title: "Coordonner logistique accueil Silikin", kind: "logistique" },
    ],
  },
  "e-com-sas": {
    seats: 2,
    roleLabel: "Talk FinTech & e-Paiement",
    badgeKind: "speaker",
    defaultTasks: [
      { title: "Finaliser titre & créneau talk e-paiement", kind: "atelier" },
      { title: "Finaliser le niveau d'accréditation", kind: "other" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  "cesar-group": {
    seats: 2,
    roleLabel: "Talk Formation & Employabilité",
    badgeKind: "speaker",
    defaultTasks: [
      { title: "Finaliser atelier / talk pitch / Office", kind: "atelier" },
      { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
    ],
  },
  pawapay: {
    seats: 0,
    roleLabel: "Paiement mobile (tech)",
    badgeKind: "partner",
    defaultTasks: [],
  },
  binance: {
    seats: 0,
    roleLabel: "Demo crypto",
    badgeKind: "partner",
    defaultTasks: [],
  },
};

function profileForSlug(slug: string): OrgBadgeProfile {
  return (
    PARTNER_BADGE_PROFILES[slug] ?? {
      seats: 2,
      roleLabel: "Partenaire",
      badgeKind: "partner" as const,
      defaultTasks: [
        { title: "Attribuer la 2e place badge (collègue)", kind: "logistique" },
      ],
    }
  );
}

async function mintUniqueCode(): Promise<string> {
  const db = getDb();
  for (let i = 0; i < 8; i += 1) {
    const code = generatePartnerTicketCode();
    const [hit] = await db
      .select({ id: hackathonPartnerPasses.id })
      .from(hackathonPartnerPasses)
      .where(eq(hackathonPartnerPasses.ticketCode, code))
      .limit(1);
    if (!hit) return code;
  }
  return generatePartnerTicketCode();
}

export async function ensureOrgPartnerPasses(orgId: string) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(eq(hackathonPartnerOrgs.id, orgId))
    .limit(1);
  if (!org) return [];

  const profile = profileForSlug(org.slug);
  if (profile.seats === 0) return [];

  const existing = await db
    .select()
    .from(hackathonPartnerPasses)
    .where(eq(hackathonPartnerPasses.orgId, orgId))
    .orderBy(asc(hackathonPartnerPasses.seatIndex));

  const bySeat = new Map(existing.map((p) => [p.seatIndex, p]));
  const out = [];

  for (let seat = 1; seat <= profile.seats; seat += 1) {
    const hit = bySeat.get(seat);
    if (hit) {
      const contact = org.contactEmail.trim().toLowerCase();
      const patch: {
        roleLabel?: string;
        badgeKind?: PartnerBadgeKind;
        holderEmail?: string;
        updatedAt: Date;
      } = { updatedAt: new Date() };
      if (hit.roleLabel !== profile.roleLabel) patch.roleLabel = profile.roleLabel;
      if (hit.badgeKind !== profile.badgeKind) patch.badgeKind = profile.badgeKind;
      if (seat === 1 && (hit.holderEmail ?? "").toLowerCase() !== contact) {
        patch.holderEmail = contact;
      }
      if (Object.keys(patch).length > 1) {
        await db
          .update(hackathonPartnerPasses)
          .set(patch)
          .where(eq(hackathonPartnerPasses.id, hit.id));
        out.push({ ...hit, ...patch });
      } else {
        out.push(hit);
      }
      continue;
    }

    if (seat === 1) {
      const code = await mintUniqueCode();
      const [row] = await db
        .insert(hackathonPartnerPasses)
        .values({
          orgId: org.id,
          editionId: org.editionId,
          seatIndex: 1,
          status: "active",
          holderEmail: org.contactEmail.trim().toLowerCase(),
          holderName: org.shortName,
          roleLabel: profile.roleLabel,
          badgeKind: profile.badgeKind,
          ticketCode: code,
        })
        .returning();
      out.push(row);
    } else {
      const [row] = await db
        .insert(hackathonPartnerPasses)
        .values({
          orgId: org.id,
          editionId: org.editionId,
          seatIndex: 2,
          status: "reserved",
          holderEmail: null,
          holderName: null,
          roleLabel: profile.roleLabel,
          badgeKind: profile.badgeKind,
          ticketCode: null,
        })
        .returning();
      out.push(row);
    }
  }

  return out;
}

export async function ensureAllPartnerPasses(editionId: string) {
  const db = getDb();
  const orgs = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(eq(hackathonPartnerOrgs.editionId, editionId));
  for (const org of orgs) {
    await ensureOrgPartnerPasses(org.id);
  }
}

export async function listOrgPasses(orgId: string) {
  await ensureOrgPartnerPasses(orgId);
  const db = getDb();
  return db
    .select()
    .from(hackathonPartnerPasses)
    .where(eq(hackathonPartnerPasses.orgId, orgId))
    .orderBy(asc(hackathonPartnerPasses.seatIndex));
}

export async function grantPartnerSeat2(opts: {
  orgId: string;
  granterEmail: string;
  holderEmail: string;
  holderName: string;
}) {
  const email = opts.holderEmail.trim().toLowerCase();
  if (!email.includes("@") || email.length < 5) {
    throw new Error("invalid_email");
  }
  const name = opts.holderName.trim().slice(0, 160) || email.split("@")[0];

  const passes = await listOrgPasses(opts.orgId);
  const seat2 = passes.find((p) => p.seatIndex === 2);
  if (!seat2) throw new Error("no_seat_2");
  if (seat2.status === "active" && seat2.holderEmail) {
    throw new Error("seat_taken");
  }

  const db = getDb();
  const code = seat2.ticketCode ?? (await mintUniqueCode());
  const [row] = await db
    .update(hackathonPartnerPasses)
    .set({
      status: "active",
      holderEmail: email,
      holderName: name,
      ticketCode: code,
      grantedByEmail: opts.granterEmail.trim().toLowerCase(),
      updatedAt: new Date(),
    })
    .where(eq(hackathonPartnerPasses.id, seat2.id))
    .returning();
  return row;
}

export async function findPassByTicketCode(code: string) {
  const db = getDb();
  const normalized = code.trim().toUpperCase();
  const [row] = await db
    .select({
      pass: hackathonPartnerPasses,
      org: hackathonPartnerOrgs,
    })
    .from(hackathonPartnerPasses)
    .innerJoin(
      hackathonPartnerOrgs,
      eq(hackathonPartnerPasses.orgId, hackathonPartnerOrgs.id),
    )
    .where(eq(hackathonPartnerPasses.ticketCode, normalized))
    .limit(1);
  return row ?? null;
}

export async function linkPassOwnerUserId(passId: string, userId: string) {
  const db = getDb();
  await db
    .update(hackathonPartnerPasses)
    .set({ ownerUserId: userId, updatedAt: new Date() })
    .where(eq(hackathonPartnerPasses.id, passId));
}

export function passToPublic(row: typeof hackathonPartnerPasses.$inferSelect) {
  return {
    id: row.id,
    seatIndex: row.seatIndex,
    status: row.status,
    holderEmail: row.holderEmail,
    holderName: row.holderName,
    roleLabel: row.roleLabel,
    badgeKind: row.badgeKind,
    ticketCode: row.ticketCode,
    passUrl: row.ticketCode ? passPublicUrl(row.ticketCode) : null,
  };
}

export async function resolveUserIdByEmail(email: string) {
  const db = getDb();
  const [u] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);
  return u?.id ?? null;
}

export { profileForSlug };
