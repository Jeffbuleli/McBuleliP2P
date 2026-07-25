import { randomBytes } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonChallenges,
  hackathonEditions,
  hackathonRegistrations,
  hackathonTeamMembers,
  hackathonTeams,
} from "@/db";
import { MAX_TEAM_MEMBERS, type TeamStatus } from "@/lib/hackathon/team-status";

export type MemberRole = "lead" | "dev" | "design" | "business" | "other";

export function generateInviteCode(): string {
  return `MBT-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "team"
  );
}

export async function uniqueTeamSlug(
  editionId: string,
  name: string,
): Promise<string> {
  const db = getDb();
  const base = slugify(name);
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const [hit] = await db
      .select({ id: hackathonTeams.id })
      .from(hackathonTeams)
      .where(
        and(
          eq(hackathonTeams.editionId, editionId),
          eq(hackathonTeams.slug, candidate),
        ),
      )
      .limit(1);
    if (!hit) return candidate;
  }
  return `${base}-${randomBytes(2).toString("hex")}`;
}

export async function getRegistrationForUser(
  userId: string,
  editionId: string,
) {
  const db = getDb();
  const [reg] = await db
    .select()
    .from(hackathonRegistrations)
    .where(
      and(
        eq(hackathonRegistrations.userId, userId),
        eq(hackathonRegistrations.editionId, editionId),
      ),
    )
    .limit(1);
  return reg ?? null;
}

export async function getMemberForRegistration(registrationId: string) {
  const db = getDb();
  const [row] = await db
    .select({
      member: hackathonTeamMembers,
      team: hackathonTeams,
    })
    .from(hackathonTeamMembers)
    .innerJoin(
      hackathonTeams,
      eq(hackathonTeamMembers.teamId, hackathonTeams.id),
    )
    .where(eq(hackathonTeamMembers.registrationId, registrationId))
    .limit(1);
  return row ?? null;
}

export async function countTeamMembers(teamId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hackathonTeamMembers)
    .where(eq(hackathonTeamMembers.teamId, teamId));
  return row?.n ?? 0;
}

export async function listTeamMembers(teamId: string) {
  const db = getDb();
  return db
    .select({
      id: hackathonTeamMembers.id,
      role: hackathonTeamMembers.role,
      joinedAt: hackathonTeamMembers.joinedAt,
      registrationId: hackathonRegistrations.id,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
      email: hackathonRegistrations.email,
      paymentStatus: hackathonRegistrations.paymentStatus,
      presenceStatus: hackathonRegistrations.presenceStatus,
    })
    .from(hackathonTeamMembers)
    .innerJoin(
      hackathonRegistrations,
      eq(hackathonTeamMembers.registrationId, hackathonRegistrations.id),
    )
    .where(eq(hackathonTeamMembers.teamId, teamId));
}

async function recomputeTeamStatus(teamId: string): Promise<TeamStatus> {
  const db = getDb();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) return "forming";

  // Terminal / advanced statuses are sticky unless forced lower (not done here).
  if (team.status === "judged") return "judged";
  if (team.status === "presented") return "presented";
  if (team.status === "submitted") return "submitted";
  if (team.status === "building") return "building";

  const ready =
    Boolean(team.challengeId) && Boolean(team.rulesAcceptedAt);
  const next: TeamStatus = ready ? "ready" : "forming";
  if (next !== team.status) {
    await db
      .update(hackathonTeams)
      .set({ status: next, updatedAt: new Date() })
      .where(eq(hackathonTeams.id, teamId));
  }
  return next;
}

export async function markTeamBuilding(teamId: string) {
  const db = getDb();
  const [team] = await db
    .select({ status: hackathonTeams.status })
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) return;
  if (
    team.status === "forming" ||
    team.status === "ready"
  ) {
    await db
      .update(hackathonTeams)
      .set({ status: "building", updatedAt: new Date() })
      .where(eq(hackathonTeams.id, teamId));
  }
}

export async function markTeamSubmitted(teamId: string) {
  const db = getDb();
  await db
    .update(hackathonTeams)
    .set({ status: "submitted", updatedAt: new Date() })
    .where(eq(hackathonTeams.id, teamId));
}

export async function markTeamPresented(teamId: string) {
  const db = getDb();
  await db
    .update(hackathonTeams)
    .set({
      status: "presented",
      presentedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(hackathonTeams.id, teamId));
}

export async function markTeamJudged(teamId: string) {
  const db = getDb();
  await db
    .update(hackathonTeams)
    .set({
      status: "judged",
      judgedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(hackathonTeams.id, teamId));
}

export class TeamError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "TeamError";
  }
}

export async function createTeam(opts: {
  editionId: string;
  registrationId: string;
  paymentStatus: string;
  name: string;
  isSolo: boolean;
  role?: MemberRole;
}) {
  if (opts.paymentStatus !== "paid") {
    throw new TeamError("payment_required", 403);
  }
  const existing = await getMemberForRegistration(opts.registrationId);
  if (existing) throw new TeamError("already_in_team", 409);

  const db = getDb();
  const slug = await uniqueTeamSlug(opts.editionId, opts.name);
  let inviteCode = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const [hit] = await db
      .select({ id: hackathonTeams.id })
      .from(hackathonTeams)
      .where(eq(hackathonTeams.inviteCode, inviteCode))
      .limit(1);
    if (!hit) break;
    inviteCode = generateInviteCode();
  }

  const [team] = await db
    .insert(hackathonTeams)
    .values({
      editionId: opts.editionId,
      name: opts.name.trim().slice(0, 120),
      slug,
      inviteCode,
      isSolo: opts.isSolo,
      status: "forming",
      createdByRegistrationId: opts.registrationId,
    })
    .returning();

  await db.insert(hackathonTeamMembers).values({
    teamId: team.id,
    registrationId: opts.registrationId,
    role: opts.role ?? "lead",
  });

  return team;
}

export async function joinTeam(opts: {
  inviteCode: string;
  registrationId: string;
  editionId: string;
  paymentStatus: string;
  role?: MemberRole;
}) {
  if (opts.paymentStatus !== "paid") {
    throw new TeamError("payment_required", 403);
  }
  const existing = await getMemberForRegistration(opts.registrationId);
  if (existing) throw new TeamError("already_in_team", 409);

  const db = getDb();
  const code = opts.inviteCode.trim().toUpperCase();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.inviteCode, code))
    .limit(1);
  if (!team) throw new TeamError("invalid_invite", 404);
  if (team.editionId !== opts.editionId) {
    throw new TeamError("wrong_edition", 400);
  }
  if (team.isSolo) throw new TeamError("solo_team", 400);

  const n = await countTeamMembers(team.id);
  if (n >= MAX_TEAM_MEMBERS) throw new TeamError("team_full", 400);

  await db.insert(hackathonTeamMembers).values({
    teamId: team.id,
    registrationId: opts.registrationId,
    role: opts.role ?? "other",
  });

  if (team.isSolo) {
    await db
      .update(hackathonTeams)
      .set({ isSolo: false, updatedAt: new Date() })
      .where(eq(hackathonTeams.id, team.id));
  }

  return team;
}

export async function setTeamChallenge(opts: {
  teamId: string;
  challengeId: string;
  registrationId: string;
  isLead: boolean;
}) {
  if (!opts.isLead) throw new TeamError("lead_only", 403);
  const db = getDb();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, opts.teamId))
    .limit(1);
  if (!team) throw new TeamError("not_found", 404);

  const [edition] = await db
    .select({
      challengeLockAt: hackathonEditions.challengeLockAt,
    })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, team.editionId))
    .limit(1);
  if (
    edition?.challengeLockAt &&
    edition.challengeLockAt.getTime() <= Date.now()
  ) {
    throw new TeamError("challenge_locked", 403);
  }

  const [challenge] = await db
    .select()
    .from(hackathonChallenges)
    .where(
      and(
        eq(hackathonChallenges.id, opts.challengeId),
        eq(hackathonChallenges.editionId, team.editionId),
        eq(hackathonChallenges.published, true),
      ),
    )
    .limit(1);
  if (!challenge) throw new TeamError("invalid_challenge", 400);

  await db
    .update(hackathonTeams)
    .set({ challengeId: challenge.id, updatedAt: new Date() })
    .where(eq(hackathonTeams.id, team.id));

  await recomputeTeamStatus(team.id);
  return challenge;
}

export async function acceptTeamRules(opts: {
  teamId: string;
  registrationId: string;
  isLead: boolean;
}) {
  if (!opts.isLead) throw new TeamError("lead_only", 403);
  const db = getDb();
  await db
    .update(hackathonTeams)
    .set({
      rulesAcceptedAt: new Date(),
      rulesAcceptedByRegistrationId: opts.registrationId,
      updatedAt: new Date(),
    })
    .where(eq(hackathonTeams.id, opts.teamId));
  await recomputeTeamStatus(opts.teamId);
}

export async function leaveTeam(opts: {
  teamId: string;
  registrationId: string;
  memberRole: string;
}) {
  const db = getDb();
  const n = await countTeamMembers(opts.teamId);
  if (opts.memberRole === "lead" && n > 1) {
    throw new TeamError("lead_must_transfer", 400);
  }

  await db
    .delete(hackathonTeamMembers)
    .where(
      and(
        eq(hackathonTeamMembers.teamId, opts.teamId),
        eq(hackathonTeamMembers.registrationId, opts.registrationId),
      ),
    );

  if (n <= 1) {
    await db.delete(hackathonTeams).where(eq(hackathonTeams.id, opts.teamId));
  }
}

export async function getTeamBundle(teamId: string) {
  const db = getDb();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) return null;
  const members = await listTeamMembers(teamId);
  let challenge = null;
  if (team.challengeId) {
    const [c] = await db
      .select()
      .from(hackathonChallenges)
      .where(eq(hackathonChallenges.id, team.challengeId))
      .limit(1);
    challenge = c ?? null;
  }
  return { team, members, challenge };
}
