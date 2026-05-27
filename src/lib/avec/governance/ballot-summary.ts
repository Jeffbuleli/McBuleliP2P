import { and, eq, inArray } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import {
  GRANULAR_ROLE_IDS,
  normalizeGranularAssignments,
  parseGranularRoles,
  type GranularRoleId,
} from "@/lib/avec/governance/granular-roles";
import { p2pDisplayName } from "@/lib/p2p-display";
import type { ProposalType } from "@/lib/avec/governance/types";
import { users } from "@/db";

export type GovernanceBallotDetail = {
  targetUserId?: string;
  targetDisplay?: string;
  oldRole?: string;
  newRole?: string;
  rolesAdded?: string[];
  rolesRemoved?: string[];
  permissionsAdded?: GranularRoleId[];
  permissionsRemoved?: GranularRoleId[];
  impactLines?: string[];
  justification?: string;
};

async function displayForUser(userId: string): Promise<string> {
  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      piUsername: users.piUsername,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return userId.slice(0, 8);
  return p2pDisplayName({
    email: u.email,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    piUsername: u.piUsername,
  });
}

async function membershipRole(groupId: string, userId: string): Promise<string | null> {
  const db = getDb();
  const [m] = await db
    .select({ role: groupSavingsMemberships.role, granularRoles: groupSavingsMemberships.granularRoles })
    .from(groupSavingsMemberships)
    .where(
      and(
        eq(groupSavingsMemberships.groupId, groupId),
        eq(groupSavingsMemberships.userId, userId),
        eq(groupSavingsMemberships.status, "approved"),
      ),
    )
    .limit(1);
  return m?.role ?? null;
}

function diffGranular(before: GranularRoleId[], after: GranularRoleId[]) {
  return {
    added: after.filter((r) => !before.includes(r)),
    removed: before.filter((r) => !after.includes(r)),
  };
}

export async function buildBallotDetail(args: {
  groupId: string;
  type: ProposalType;
  payload: Record<string, unknown>;
  beneficiaryUserId?: string | null;
  financialImpactUsdt?: number | null;
  justification?: string | null;
}): Promise<GovernanceBallotDetail> {
  const payload = args.payload;
  const out: GovernanceBallotDetail = {
    justification: args.justification?.trim() || undefined,
    impactLines: [],
  };

  const targetUserId =
    (typeof payload.targetUserId === "string" && payload.targetUserId) ||
    args.beneficiaryUserId ||
    (typeof payload.borrowerUserId === "string" ? payload.borrowerUserId : undefined) ||
    (typeof payload.toUserId === "string" ? payload.toUserId : undefined);

  if (targetUserId) {
    out.targetUserId = targetUserId;
    out.targetDisplay = await displayForUser(targetUserId);
    out.oldRole = (await membershipRole(args.groupId, targetUserId)) ?? undefined;
  }

  switch (args.type) {
    case "revoke_admin":
      out.newRole = "member";
      break;
    case "appoint_admin":
      out.newRole = "admin";
      break;
    case "revoke_member":
      out.newRole = "revoked";
      break;
    case "set_co_admins": {
      const next = Array.isArray(payload.coAdminUserIds)
        ? (payload.coAdminUserIds as unknown[]).map(String)
        : [];
      const db = getDb();
      const current = await db
        .select({ userId: groupSavingsMemberships.userId })
        .from(groupSavingsMemberships)
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            eq(groupSavingsMemberships.role, "co_admin"),
            eq(groupSavingsMemberships.status, "approved"),
          ),
        );
      const curIds = new Set(current.map((c) => c.userId));
      const nextSet = new Set(next);
      out.rolesAdded = next.filter((id) => !curIds.has(id));
      out.rolesRemoved = [...curIds].filter((id) => !nextSet.has(id));
      out.impactLines?.push(`co_admin: ${next.length}`);
      break;
    }
    case "set_committee": {
      const next = Array.isArray(payload.committeeUserIds)
        ? (payload.committeeUserIds as unknown[]).map(String)
        : [];
      const db = getDb();
      const current = await db
        .select({ userId: groupSavingsMemberships.userId })
        .from(groupSavingsMemberships)
        .where(
          and(
            eq(groupSavingsMemberships.groupId, args.groupId),
            eq(groupSavingsMemberships.role, "committee"),
            eq(groupSavingsMemberships.status, "approved"),
          ),
        );
      const curIds = new Set(current.map((c) => c.userId));
      const nextSet = new Set(next);
      out.rolesAdded = next.filter((id) => !curIds.has(id));
      out.rolesRemoved = [...curIds].filter((id) => !nextSet.has(id));
      out.impactLines?.push(`committee: ${next.length}`);
      break;
    }
    case "set_granular_roles": {
      const nextAssignments = normalizeGranularAssignments(payload.assignments);
      const db = getDb();
      const ids = nextAssignments.map((a) => a.userId);
      const rows =
        ids.length > 0
          ? await db
              .select({
                userId: groupSavingsMemberships.userId,
                granularRoles: groupSavingsMemberships.granularRoles,
              })
              .from(groupSavingsMemberships)
              .where(
                and(
                  eq(groupSavingsMemberships.groupId, args.groupId),
                  inArray(groupSavingsMemberships.userId, ids),
                ),
              )
          : [];
      const added: GranularRoleId[] = [];
      const removed: GranularRoleId[] = [];
      for (const na of nextAssignments) {
        const row = rows.find((r) => r.userId === na.userId);
        const before = parseGranularRoles(row?.granularRoles);
        const d = diffGranular(before, na.granularRoles);
        added.push(...d.added);
        removed.push(...d.removed);
        if (na.userId === targetUserId || (!targetUserId && nextAssignments.length === 1)) {
          out.targetUserId = na.userId;
          out.targetDisplay = await displayForUser(na.userId);
          out.permissionsAdded = d.added;
          out.permissionsRemoved = d.removed;
        }
      }
      if (!out.permissionsAdded?.length && !out.permissionsRemoved?.length) {
        out.permissionsAdded = [...new Set(added)];
        out.permissionsRemoved = [...new Set(removed)];
      }
      break;
    }
    case "transfer_fund_bucket":
      out.impactLines?.push(
        `${String(payload.fromBucket ?? "?")} → ${String(payload.toBucket ?? "?")}: ${Number(payload.amountUsdt ?? 0).toFixed(2)} USDT`,
      );
      break;
    case "change_interest_rate":
      out.impactLines?.push(`interest: ${Number(payload.interestRatePctTotal ?? 0)}%`);
      break;
    case "change_penalty_rate":
      out.impactLines?.push(`penalty: ${Number(payload.penaltyRatePctTotal ?? 0)}%`);
      break;
    case "change_social_fund":
      out.impactLines?.push(`social: ${Number(payload.socialFundUsdt ?? 0).toFixed(2)} USDT/meeting`);
      break;
    case "change_meeting_rules":
      if (payload.maxSharesPerMeeting != null) {
        out.impactLines?.push(`max shares: ${String(payload.maxSharesPerMeeting)}`);
      }
      if (payload.meetingIntervalDays != null) {
        out.impactLines?.push(`interval: ${String(payload.meetingIntervalDays)}d`);
      }
      break;
    case "change_charter":
      if (payload.publicDescription) out.impactLines?.push("charter / public profile");
      break;
    case "dissolve_group":
      out.impactLines?.push("dissolve AVEC");
      break;
    case "cycle_closure":
      out.impactLines?.push("close cycle");
      break;
    default:
      break;
  }

  if (args.financialImpactUsdt != null && Number.isFinite(args.financialImpactUsdt)) {
    out.impactLines?.push(`${args.financialImpactUsdt.toFixed(2)} USDT`);
  }

  if (out.impactLines?.length === 0) delete out.impactLines;

  return out;
}

export function proposalTypeI18nKey(type: ProposalType): string {
  return `group_gov_type_${type}`;
}

export function granularRoleI18nKey(role: GranularRoleId): string {
  return `group_gov_granular_${role}`;
}

export function membershipRoleI18nKey(role: string): string {
  if (role === "admin") return "group_gov_role_admin";
  if (role === "co_admin") return "group_gov_role_co_admin";
  if (role === "committee") return "group_gov_role_committee";
  if (role === "revoked") return "group_gov_role_revoked";
  return "group_gov_role_member";
}
