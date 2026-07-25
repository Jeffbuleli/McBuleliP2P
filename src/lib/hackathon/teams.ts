import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import {
  getDb,
  hackathonChallenges,
  hackathonEditions,
  hackathonRegistrations,
  hackathonTeamMembers,
  hackathonTeamMessages,
  hackathonTeams,
} from "@/db";
import {
  TEAM_MAX_MEMBERS,
  TEAM_ROLE_IDS,
  TEAM_SOFT_MAX_DEFAULT,
  TEAM_TARGET_SIZE_DEFAULT,
  expandTeamCapacity,
  type TeamRoleId,
} from "@/lib/hackathon/team-formation";
import { type TeamStatus } from "@/lib/hackathon/team-status";

export type MemberRole = TeamRoleId;

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

function isTeamRole(role: string): role is TeamRoleId {
  return (TEAM_ROLE_IDS as readonly string[]).includes(role);
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

export async function countEditionTeams(editionId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(hackathonTeams)
    .where(eq(hackathonTeams.editionId, editionId));
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

export async function getVacantRoles(teamId: string): Promise<TeamRoleId[]> {
  const members = await listTeamMembers(teamId);
  const taken = new Set(members.map((m) => m.role));
  return TEAM_ROLE_IDS.filter((r) => !taken.has(r));
}

export async function listOpenTeamsForEdition(editionId: string) {
  const db = getDb();
  const teams = await db
    .select({
      id: hackathonTeams.id,
      name: hackathonTeams.name,
      inviteCode: hackathonTeams.inviteCode,
      isSolo: hackathonTeams.isSolo,
      challengeId: hackathonTeams.challengeId,
      labelFr: hackathonChallenges.labelFr,
      labelEn: hackathonChallenges.labelEn,
    })
    .from(hackathonTeams)
    .leftJoin(
      hackathonChallenges,
      eq(hackathonTeams.challengeId, hackathonChallenges.id),
    )
    .where(
      and(
        eq(hackathonTeams.editionId, editionId),
        eq(hackathonTeams.isSolo, false),
      ),
    )
    .orderBy(asc(hackathonTeams.createdAt));

  const open = [];
  for (const t of teams) {
    const members = await listTeamMembers(t.id);
    if (members.length >= TEAM_MAX_MEMBERS) continue;
    const taken = new Set(members.map((m) => m.role));
    const vacantRoles = TEAM_ROLE_IDS.filter((r) => !taken.has(r));
    if (!vacantRoles.length) continue;
    open.push({
      id: t.id,
      name: t.name,
      inviteCode: t.inviteCode,
      memberCount: members.length,
      vacantRoles,
      challenge: t.challengeId
        ? {
            id: t.challengeId,
            labelFr: t.labelFr ?? "",
            labelEn: t.labelEn ?? "",
          }
        : null,
    });
  }
  return open;
}

export async function getFormationMeta(editionId: string) {
  const db = getDb();
  const [edition] = await db
    .select({
      softMaxTeams: hackathonEditions.softMaxTeams,
      targetTeamSize: hackathonEditions.targetTeamSize,
    })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, editionId))
    .limit(1);
  const teamCount = await countEditionTeams(editionId);
  const openTeams = await listOpenTeamsForEdition(editionId);
  return {
    softMaxTeams: edition?.softMaxTeams ?? TEAM_SOFT_MAX_DEFAULT,
    targetTeamSize: edition?.targetTeamSize ?? TEAM_TARGET_SIZE_DEFAULT,
    teamCount,
    openTeams,
  };
}

async function maybeExpandTeamCapacity(editionId: string) {
  const db = getDb();
  const [edition] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, editionId))
    .limit(1);
  if (!edition) return;
  const teamCount = await countEditionTeams(editionId);
  const softMax = edition.softMaxTeams ?? TEAM_SOFT_MAX_DEFAULT;
  if (teamCount < softMax) return;
  const next = expandTeamCapacity({
    softMaxTeams: softMax,
    targetTeamSize: edition.targetTeamSize ?? TEAM_TARGET_SIZE_DEFAULT,
  });
  await db
    .update(hackathonEditions)
    .set({
      softMaxTeams: next.softMaxTeams,
      targetTeamSize: next.targetTeamSize,
      updatedAt: new Date(),
    })
    .where(eq(hackathonEditions.id, editionId));
}

async function recomputeTeamStatus(teamId: string): Promise<TeamStatus> {
  const db = getDb();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) return "forming";

  if (team.status === "judged") return "judged";
  if (team.status === "presented") return "presented";
  if (team.status === "submitted") return "submitted";
  if (team.status === "building") return "building";

  const ready = Boolean(team.challengeId) && Boolean(team.rulesAcceptedAt);
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
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) return;
  if (!team.challengeId || !team.rulesAcceptedAt) {
    throw new TeamError("team_not_ready", 403);
  }
  if (team.status === "forming" || team.status === "ready") {
    await db
      .update(hackathonTeams)
      .set({ status: "building", updatedAt: new Date() })
      .where(eq(hackathonTeams.id, teamId));
  }
}

export async function markTeamSubmitted(teamId: string) {
  const db = getDb();
  const [team] = await db
    .select()
    .from(hackathonTeams)
    .where(eq(hackathonTeams.id, teamId))
    .limit(1);
  if (!team) throw new TeamError("not_found", 404);
  if (!team.challengeId || !team.rulesAcceptedAt) {
    throw new TeamError("team_not_ready", 403);
  }
  if (team.status === "forming" || team.status === "ready") {
    throw new TeamError("start_build_first", 403);
  }
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
  challengeId?: string | null;
}) {
  if (opts.paymentStatus !== "paid") {
    throw new TeamError("payment_required", 403);
  }
  const existing = await getMemberForRegistration(opts.registrationId);
  if (existing) throw new TeamError("already_in_team", 409);

  await maybeExpandTeamCapacity(opts.editionId);

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

  let challengeId = opts.challengeId ?? null;
  if (challengeId) {
    const [challenge] = await db
      .select({ id: hackathonChallenges.id })
      .from(hackathonChallenges)
      .where(
        and(
          eq(hackathonChallenges.id, challengeId),
          eq(hackathonChallenges.editionId, opts.editionId),
          eq(hackathonChallenges.published, true),
        ),
      )
      .limit(1);
    if (!challenge) throw new TeamError("invalid_challenge", 400);
  }

  const [team] = await db
    .insert(hackathonTeams)
    .values({
      editionId: opts.editionId,
      name: opts.name.trim().slice(0, 120),
      slug,
      inviteCode,
      isSolo: opts.isSolo,
      challengeId,
      status: "forming",
      createdByRegistrationId: opts.registrationId,
    })
    .returning();

  await db.insert(hackathonTeamMembers).values({
    teamId: team.id,
    registrationId: opts.registrationId,
    role: "lead",
  });

  return team;
}

async function assertRoleVacant(teamId: string, role: TeamRoleId) {
  const vacant = await getVacantRoles(teamId);
  if (!vacant.includes(role)) {
    throw new TeamError("role_taken", 409);
  }
}

export async function joinTeam(opts: {
  inviteCode?: string;
  teamId?: string;
  registrationId: string;
  editionId: string;
  paymentStatus: string;
  role: MemberRole;
}) {
  if (opts.paymentStatus !== "paid") {
    throw new TeamError("payment_required", 403);
  }
  if (!isTeamRole(opts.role)) {
    throw new TeamError("invalid_role", 400);
  }
  if (opts.role === "lead") {
    throw new TeamError("lead_reserved", 400);
  }
  const existing = await getMemberForRegistration(opts.registrationId);
  if (existing) throw new TeamError("already_in_team", 409);

  const db = getDb();
  let team:
    | typeof hackathonTeams.$inferSelect
    | undefined;

  if (opts.teamId) {
    const [row] = await db
      .select()
      .from(hackathonTeams)
      .where(eq(hackathonTeams.id, opts.teamId))
      .limit(1);
    team = row;
  } else if (opts.inviteCode) {
    const code = opts.inviteCode.trim().toUpperCase();
    const [row] = await db
      .select()
      .from(hackathonTeams)
      .where(eq(hackathonTeams.inviteCode, code))
      .limit(1);
    team = row;
  } else {
    throw new TeamError("team_required", 400);
  }

  if (!team) throw new TeamError("invalid_invite", 404);
  if (team.editionId !== opts.editionId) {
    throw new TeamError("wrong_edition", 400);
  }
  if (team.isSolo) throw new TeamError("solo_team", 400);

  const n = await countTeamMembers(team.id);
  if (n >= TEAM_MAX_MEMBERS) throw new TeamError("team_full", 400);

  await assertRoleVacant(team.id, opts.role);

  await db.insert(hackathonTeamMembers).values({
    teamId: team.id,
    registrationId: opts.registrationId,
    role: opts.role,
  });

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

export async function updateTeamGovernance(opts: {
  teamId: string;
  isLead: boolean;
  commsUrl?: string | null;
  governanceNotes?: string | null;
}) {
  if (!opts.isLead) throw new TeamError("lead_only", 403);
  const db = getDb();
  const patch: {
    updatedAt: Date;
    commsUrl?: string | null;
    governanceNotes?: string | null;
  } = { updatedAt: new Date() };
  if (opts.commsUrl !== undefined) {
    const url = opts.commsUrl?.trim() || null;
    if (url && url.length > 500) throw new TeamError("comms_url_too_long", 400);
    patch.commsUrl = url;
  }
  if (opts.governanceNotes !== undefined) {
    patch.governanceNotes = opts.governanceNotes?.trim().slice(0, 2000) || null;
  }
  await db
    .update(hackathonTeams)
    .set(patch)
    .where(eq(hackathonTeams.id, opts.teamId));
}

export async function assignMemberRole(opts: {
  teamId: string;
  actorRegistrationId: string;
  actorIsLead: boolean;
  targetRegistrationId: string;
  role: MemberRole;
}) {
  if (!opts.actorIsLead) throw new TeamError("lead_only", 403);
  if (!isTeamRole(opts.role)) throw new TeamError("invalid_role", 400);

  const members = await listTeamMembers(opts.teamId);
  const target = members.find(
    (m) => m.registrationId === opts.targetRegistrationId,
  );
  if (!target) throw new TeamError("member_not_found", 404);
  if (target.role === opts.role) return;

  const holder = members.find((m) => m.role === opts.role);
  const db = getDb();

  if (holder) {
    // Single statement swap avoids unique (team_id, role) conflicts mid-update.
    await db.execute(sql`
      UPDATE hackathon_team_members
      SET role = CASE id
        WHEN ${target.id}::uuid THEN ${opts.role}
        WHEN ${holder.id}::uuid THEN ${target.role}
      END
      WHERE id IN (${target.id}::uuid, ${holder.id}::uuid)
    `);
    return;
  }

  await db
    .update(hackathonTeamMembers)
    .set({ role: opts.role })
    .where(eq(hackathonTeamMembers.id, target.id));
}

export async function postTeamMessage(opts: {
  teamId: string;
  registrationId: string;
  body: string;
}) {
  const text = opts.body.trim();
  if (text.length < 1 || text.length > 1000) {
    throw new TeamError("invalid_message", 400);
  }
  const membership = await getMemberForRegistration(opts.registrationId);
  if (!membership || membership.team.id !== opts.teamId) {
    throw new TeamError("not_member", 403);
  }
  const db = getDb();
  const [row] = await db
    .insert(hackathonTeamMessages)
    .values({
      teamId: opts.teamId,
      authorRegistrationId: opts.registrationId,
      body: text,
    })
    .returning();
  return row;
}

export async function listTeamMessages(teamId: string, limit = 40) {
  const db = getDb();
  return db
    .select({
      id: hackathonTeamMessages.id,
      body: hackathonTeamMessages.body,
      createdAt: hackathonTeamMessages.createdAt,
      authorRegistrationId: hackathonTeamMessages.authorRegistrationId,
      firstName: hackathonRegistrations.firstName,
      lastName: hackathonRegistrations.lastName,
    })
    .from(hackathonTeamMessages)
    .innerJoin(
      hackathonRegistrations,
      eq(
        hackathonTeamMessages.authorRegistrationId,
        hackathonRegistrations.id,
      ),
    )
    .where(eq(hackathonTeamMessages.teamId, teamId))
    .orderBy(desc(hackathonTeamMessages.createdAt))
    .limit(limit);
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
  const messages = await listTeamMessages(teamId);
  return { team, members, challenge, messages };
}
