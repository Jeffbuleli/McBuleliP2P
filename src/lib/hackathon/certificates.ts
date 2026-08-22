import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import {
  getDb,
  hackathonCertificates,
  hackathonRegistrations,
  hackathonTeamMembers,
  hackathonTeams,
} from "@/db";
import { buildAwardsLeaderboard } from "@/lib/hackathon/awards";
import type {
  CertificateKind,
  CertificatePublic,
} from "@/lib/hackathon/certificate-types";
import {
  HACKATHON_DATES_LABEL_EN,
  HACKATHON_DATES_LABEL_FR,
  HACKATHON_VENUE_SHORT,
} from "@/lib/hackathon/event-content";

export type { CertificateKind, CertificatePublic };

function makeVerifyCode(): string {
  return `MH26-${randomBytes(4).toString("hex").toUpperCase()}`;
}

function publicBase(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.APP_URL?.replace(/\/$/, "") ||
    "https://mcbuleli.org"
  );
}

function toPublic(
  row: typeof hackathonCertificates.$inferSelect,
): CertificatePublic {
  const base = publicBase();
  return {
    id: row.id,
    kind: row.kind as CertificateKind,
    rank: row.rank,
    holderName: row.holderName,
    teamName: row.teamName,
    titleFr: row.titleFr,
    titleEn: row.titleEn,
    verifyCode: row.verifyCode,
    issuedAt: row.issuedAt.toISOString(),
    verifyUrl: `${base}/hackathon/certificat/${row.verifyCode}`,
    printUrl: `${base}/hackathon/certificat/${row.verifyCode}?print=1`,
    eventLabelFr: `McBuleli Hackathon · ${HACKATHON_DATES_LABEL_FR}`,
    eventLabelEn: `McBuleli Hackathon · ${HACKATHON_DATES_LABEL_EN}`,
    venue: HACKATHON_VENUE_SHORT,
    revoked: Boolean(row.revokedAt),
  };
}

export async function getCertificateByCode(
  code: string,
): Promise<CertificatePublic | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonCertificates)
    .where(eq(hackathonCertificates.verifyCode, code.trim().toUpperCase()))
    .limit(1);
  if (!row) {
    const [loose] = await db
      .select()
      .from(hackathonCertificates)
      .where(eq(hackathonCertificates.verifyCode, code.trim()))
      .limit(1);
    return loose ? toPublic(loose) : null;
  }
  return toPublic(row);
}

export async function listCertificatesForRegistration(
  registrationId: string,
): Promise<CertificatePublic[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(hackathonCertificates)
    .where(
      and(
        eq(hackathonCertificates.registrationId, registrationId),
        isNull(hackathonCertificates.revokedAt),
      ),
    )
    .orderBy(desc(hackathonCertificates.issuedAt));
  return rows.map(toPublic);
}

async function upsertCert(args: {
  editionId: string;
  registrationId: string;
  teamId: string | null;
  teamName: string | null;
  kind: CertificateKind;
  rank: number | null;
  holderName: string;
  titleFr: string;
  titleEn: string;
}): Promise<"created" | "exists"> {
  const db = getDb();
  const [existing] = await db
    .select({ id: hackathonCertificates.id })
    .from(hackathonCertificates)
    .where(
      and(
        eq(hackathonCertificates.registrationId, args.registrationId),
        eq(hackathonCertificates.kind, args.kind),
      ),
    )
    .limit(1);
  if (existing) return "exists";

  await db.insert(hackathonCertificates).values({
    editionId: args.editionId,
    registrationId: args.registrationId,
    teamId: args.teamId,
    teamName: args.teamName,
    kind: args.kind,
    rank: args.rank,
    holderName: args.holderName,
    titleFr: args.titleFr,
    titleEn: args.titleEn,
    verifyCode: makeVerifyCode(),
  });
  return "created";
}

/**
 * Issue participation certificates for paid registrations that checked in
 * (or are on a submitted/presented/judged team). Distinction for podium top 3.
 */
export async function issueEditionCertificates(editionId: string): Promise<{
  participationCreated: number;
  distinctionCreated: number;
  skipped: number;
}> {
  const db = getDb();
  const regs = await db
    .select({
      id: hackathonRegistrations.id,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
      paymentStatus: hackathonRegistrations.paymentStatus,
      presenceStatus: hackathonRegistrations.presenceStatus,
      checkedInAt: hackathonRegistrations.checkedInAt,
    })
    .from(hackathonRegistrations)
    .where(eq(hackathonRegistrations.editionId, editionId));

  const memberships = await db
    .select({
      registrationId: hackathonTeamMembers.registrationId,
      teamId: hackathonTeams.id,
      teamName: hackathonTeams.name,
      teamStatus: hackathonTeams.status,
    })
    .from(hackathonTeamMembers)
    .innerJoin(
      hackathonTeams,
      eq(hackathonTeamMembers.teamId, hackathonTeams.id),
    )
    .where(eq(hackathonTeams.editionId, editionId));

  const byReg = new Map(
    memberships.map((m) => [m.registrationId, m] as const),
  );

  let participationCreated = 0;
  let distinctionCreated = 0;
  let skipped = 0;

  for (const reg of regs) {
    if (reg.paymentStatus !== "paid") {
      skipped++;
      continue;
    }
    const member = byReg.get(reg.id);
    const attended =
      Boolean(reg.checkedInAt) ||
      reg.presenceStatus === "inside" ||
      reg.presenceStatus === "outside" ||
      (member &&
        ["submitted", "presented", "judged", "building"].includes(
          member.teamStatus,
        ));
    if (!attended) {
      skipped++;
      continue;
    }

    const holder = `${reg.firstName} ${reg.lastName}`.trim();
    const result = await upsertCert({
      editionId,
      registrationId: reg.id,
      teamId: member?.teamId ?? null,
      teamName: member?.teamName ?? null,
      kind: "participation",
      rank: null,
      holderName: holder,
      titleFr: "Certificat de participation - McBuleli Hackathon 2026",
      titleEn: "Certificate of participation - McBuleli Hackathon 2026",
    });
    if (result === "created") participationCreated++;
    else skipped++;
  }

  const awards = await buildAwardsLeaderboard(editionId, 3);
  const podiumTeamIds = awards.entries.map((e) => e.teamId);
  if (podiumTeamIds.length) {
    const podiumMembers = await db
      .select({
        registrationId: hackathonTeamMembers.registrationId,
        teamId: hackathonTeams.id,
        teamName: hackathonTeams.name,
        firstName: hackathonRegistrations.firstName,
        lastName: hackathonRegistrations.lastName,
      })
      .from(hackathonTeamMembers)
      .innerJoin(
        hackathonTeams,
        eq(hackathonTeamMembers.teamId, hackathonTeams.id),
      )
      .innerJoin(
        hackathonRegistrations,
        eq(hackathonTeamMembers.registrationId, hackathonRegistrations.id),
      )
      .where(inArray(hackathonTeams.id, podiumTeamIds));

    const rankByTeam = new Map(
      awards.entries.map((e) => [e.teamId, e.rank] as const),
    );

    for (const m of podiumMembers) {
      const rank = rankByTeam.get(m.teamId) ?? null;
      if (!rank) continue;
      const medalFr =
        rank === 1 ? "1ère place" : rank === 2 ? "2e place" : "3e place";
      const medalEn =
        rank === 1 ? "1st place" : rank === 2 ? "2nd place" : "3rd place";
      const result = await upsertCert({
        editionId,
        registrationId: m.registrationId,
        teamId: m.teamId,
        teamName: m.teamName,
        kind: "distinction",
        rank,
        holderName: `${m.firstName} ${m.lastName}`.trim(),
        titleFr: `Distinction ${medalFr} - McBuleli Hackathon 2026`,
        titleEn: `${medalEn} distinction - McBuleli Hackathon 2026`,
      });
      if (result === "created") distinctionCreated++;
    }
  }

  return { participationCreated, distinctionCreated, skipped };
}
