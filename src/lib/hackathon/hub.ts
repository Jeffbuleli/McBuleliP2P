import { and, desc, eq } from "drizzle-orm";
import {
  getDb,
  hackathonAnnouncements,
  hackathonEditions,
  hackathonMentorRequests,
  hackathonRegistrations,
  hackathonSubmissions,
} from "@/db";
import { passPublicUrl } from "@/lib/hackathon/access";
import { buildAwardsLeaderboard } from "@/lib/hackathon/awards";
import { listCertificatesForRegistration } from "@/lib/hackathon/certificates";
import { listPublishedChallenges } from "@/lib/hackathon/challenges";
import { hackathonProgramDays } from "@/lib/hackathon/event-content";
import type { HubPayloadOk } from "@/lib/hackathon/hub-types";
import {
  INCUBATION_CONTACT_EMAIL,
  INCUBATION_INTRO_EN,
  INCUBATION_INTRO_FR,
  INCUBATION_STEPS,
  INCUBATION_WHATSAPP_PATH,
  INCUBATION_WINDOW_EN,
  INCUBATION_WINDOW_FR,
  incubationEligible,
} from "@/lib/hackathon/incubation";
import { payLaterPublicUrl } from "@/lib/hackathon/service";
import {
  getFormationMeta,
  getMemberForRegistration,
  getRegistrationForUser,
  getTeamBundle,
} from "@/lib/hackathon/teams";
import { TEAM_MAX_MEMBERS } from "@/lib/hackathon/team-formation";

export type { HubPayloadOk };

export async function getFeaturedEditionRow() {
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  return row ?? null;
}

export async function buildHubPayload(userId: string): Promise<
  HubPayloadOk | { error: "no_edition" }
> {
  const edition = await getFeaturedEditionRow();
  if (!edition) {
    return { error: "no_edition" as const };
  }

  const reg = await getRegistrationForUser(userId, edition.id);
  const challenges = await listPublishedChallenges(edition.id);
  const db = getDb();

  const announcements = await db
    .select()
    .from(hackathonAnnouncements)
    .where(eq(hackathonAnnouncements.editionId, edition.id))
    .orderBy(
      desc(hackathonAnnouncements.pinned),
      desc(hackathonAnnouncements.publishedAt),
    )
    .limit(30);

  let teamBundle: Awaited<ReturnType<typeof getTeamBundle>> = null;
  let submission: typeof hackathonSubmissions.$inferSelect | null = null;
  let mentorRequests: Array<typeof hackathonMentorRequests.$inferSelect> = [];

  if (reg) {
    const membership = await getMemberForRegistration(reg.id);
    if (membership) {
      teamBundle = await getTeamBundle(membership.team.id);
      const [sub] = await db
        .select()
        .from(hackathonSubmissions)
        .where(eq(hackathonSubmissions.teamId, membership.team.id))
        .limit(1);
      submission = sub ?? null;
      mentorRequests = await db
        .select()
        .from(hackathonMentorRequests)
        .where(eq(hackathonMentorRequests.teamId, membership.team.id))
        .orderBy(desc(hackathonMentorRequests.createdAt))
        .limit(20);
    }
  }

  const isPaid = reg?.paymentStatus === "paid";
  const memberRole =
    teamBundle && reg
      ? teamBundle.members.find((m) => m.registrationId === reg.id)?.role ??
        null
      : null;

  const formationMeta = await getFormationMeta(edition.id);
  const awards = await buildAwardsLeaderboard(edition.id);
  const certificates = reg
    ? await listCertificatesForRegistration(reg.id)
    : [];
  const teamStatus = teamBundle?.team.status ?? null;

  return {
    edition: {
      id: edition.id,
      slug: edition.slug,
      nameFr: edition.nameFr,
      nameEn: edition.nameEn,
      status: edition.status,
      challengeLockAt: edition.challengeLockAt?.toISOString() ?? null,
      submissionDeadlineAt: edition.submissionDeadlineAt?.toISOString() ?? null,
    },
    registration: reg
      ? {
          id: reg.id,
          firstName: reg.firstName,
          lastName: reg.lastName,
          email: reg.email,
          paymentStatus: reg.paymentStatus,
          ticketCode: reg.ticketCode,
          presenceStatus: reg.presenceStatus,
          passUrl: reg.ticketCode ? passPublicUrl(reg.ticketCode) : null,
          payUrl: reg.paymentToken
            ? payLaterPublicUrl(reg.paymentToken)
            : null,
        }
      : null,
    isPaid,
    memberRole,
    formation: {
      softMaxTeams: formationMeta.softMaxTeams,
      targetTeamSize: formationMeta.targetTeamSize,
      teamCount: formationMeta.teamCount,
      maxMembers: TEAM_MAX_MEMBERS,
      openTeams: formationMeta.openTeams,
    },
    team: teamBundle
      ? {
          id: teamBundle.team.id,
          name: teamBundle.team.name,
          slug: teamBundle.team.slug,
          inviteCode: teamBundle.team.inviteCode,
          status: teamBundle.team.status,
          isSolo: teamBundle.team.isSolo,
          challengeId: teamBundle.team.challengeId,
          challenge: teamBundle.challenge
            ? {
                id: teamBundle.challenge.id,
                labelFr: teamBundle.challenge.labelFr,
                labelEn: teamBundle.challenge.labelEn,
              }
            : null,
          commsUrl: teamBundle.team.commsUrl ?? null,
          governanceNotes: teamBundle.team.governanceNotes ?? null,
          members: teamBundle.members.map((m) => ({
            ...m,
            joinedAt:
              m.joinedAt instanceof Date
                ? m.joinedAt.toISOString()
                : String(m.joinedAt),
          })),
          messages: teamBundle.messages.map((m) => ({
            id: m.id,
            body: m.body,
            createdAt:
              m.createdAt instanceof Date
                ? m.createdAt.toISOString()
                : String(m.createdAt),
            authorRegistrationId: m.authorRegistrationId,
            firstName: m.firstName,
            lastName: m.lastName,
          })),
          rulesAcceptedAt:
            teamBundle.team.rulesAcceptedAt?.toISOString() ?? null,
          presentedAt: teamBundle.team.presentedAt?.toISOString() ?? null,
          judgedAt: teamBundle.team.judgedAt?.toISOString() ?? null,
        }
      : null,
    challenges: challenges.map((c) => ({
      id: c.id,
      slug: c.slug,
      labelFr: c.labelFr,
      labelEn: c.labelEn,
      blurbFr: c.blurbFr,
      blurbEn: c.blurbEn,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      body: a.body,
      pinned: a.pinned,
      publishedAt: a.publishedAt.toISOString(),
    })),
    submission: submission
      ? {
          id: submission.id,
          status: submission.status,
          demoUrl: submission.demoUrl,
          githubUrl: submission.githubUrl,
          figmaUrl: submission.figmaUrl,
          pitchPdfUrl: submission.pitchPdfUrl,
          readmeUrl: submission.readmeUrl,
          notes: submission.notes,
          submittedAt: submission.submittedAt?.toISOString() ?? null,
        }
      : null,
    mentorRequests: mentorRequests.map((m) => ({
      id: m.id,
      topic: m.topic,
      notes: m.notes,
      status: m.status,
      createdAt: m.createdAt.toISOString(),
    })),
    program: hackathonProgramDays(),
    awards,
    certificates: certificates.map((c) => ({
      id: c.id,
      kind: c.kind,
      rank: c.rank,
      titleFr: c.titleFr,
      titleEn: c.titleEn,
      verifyCode: c.verifyCode,
      verifyUrl: c.verifyUrl,
      printUrl: c.printUrl,
      issuedAt: c.issuedAt,
    })),
    incubation: {
      eligible: incubationEligible(teamStatus),
      windowFr: INCUBATION_WINDOW_FR,
      windowEn: INCUBATION_WINDOW_EN,
      introFr: INCUBATION_INTRO_FR,
      introEn: INCUBATION_INTRO_EN,
      contactEmail: INCUBATION_CONTACT_EMAIL,
      whatsappPath: INCUBATION_WHATSAPP_PATH,
      steps: INCUBATION_STEPS.map((s) => ({
        id: s.id,
        titleFr: s.titleFr,
        titleEn: s.titleEn,
        bodyFr: s.bodyFr,
        bodyEn: s.bodyEn,
      })),
    },
  };
}

export async function resolveHubRegistration(
  userId: string,
  email?: string | null,
) {
  const edition = await getFeaturedEditionRow();
  if (!edition) return { edition: null, reg: null };
  let reg = await getRegistrationForUser(userId, edition.id);
  if (!reg && email) {
    const db = getDb();
    const [byEmail] = await db
      .select()
      .from(hackathonRegistrations)
      .where(
        and(
          eq(hackathonRegistrations.editionId, edition.id),
          eq(hackathonRegistrations.email, email.toLowerCase()),
        ),
      )
      .limit(1);
    reg = byEmail ?? null;
  }
  return { edition, reg };
}
