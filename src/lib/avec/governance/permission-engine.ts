import {
  hasGranularRole,
  hasRole,
  isGroupManager,
  type MembershipLike,
} from "@/lib/avec/governance/membership-roles";

export type { MembershipLike } from "@/lib/avec/governance/membership-roles";
export {
  hasGranularRole,
  isGroupManager,
  membershipGranularRoles,
} from "@/lib/avec/governance/membership-roles";

/** Propose / initiate internal loans (governance or legacy pending). */
export function canProposeGroupLoan(m: MembershipLike | null): boolean {
  if (!m || m.status !== "approved") return false;
  if (isGroupManager(m)) return true;
  if (hasRole(m, ["committee"])) return true;
  return hasGranularRole(m, "credit_officer");
}

/** 2/3 manager approvals, loan reject, manager repay on behalf. */
export function canManageGroupLoans(m: MembershipLike | null): boolean {
  return isGroupManager(m);
}

/** Propose collective payouts (tier B/C). */
export function canProposeGroupPayout(m: MembershipLike | null): boolean {
  if (!m || m.status !== "approved") return false;
  if (isGroupManager(m)) return true;
  if (hasRole(m, ["committee"])) return true;
  return hasGranularRole(m, "treasurer");
}

/** Group settings / RH proposals (co-admins, committee, granular roles). */
export function canProposeGovernancePolicy(m: MembershipLike | null): boolean {
  return hasRole(m, ["admin"]);
}

/** Invite link, pending member review, treasury manager tools. */
export function canModerateGroupMembership(m: MembershipLike | null): boolean {
  return isGroupManager(m);
}

/** Dialogue: hide off-topic messages and publish meeting minutes (PV). */
export function canModerateGroupDialogue(m: MembershipLike | null): boolean {
  if (!m || m.status !== "approved") return false;
  if (isGroupManager(m)) return true;
  return hasGranularRole(m, "secretary");
}

export type AvecDashboardTab =
  | "vue"
  | "meeting"
  | "members"
  | "treasury"
  | "dialogue"
  | "reports";

/** Tab visibility by role / granular responsibilities. */
export function canAccessAvecTab(
  m: MembershipLike | null,
  tab: AvecDashboardTab,
): boolean {
  if (!m) return tab === "vue";
  if (m.status === "pending") return tab === "vue";
  if (m.status !== "approved") return false;

  switch (tab) {
    case "vue":
    case "meeting":
    case "members":
    case "dialogue":
      return true;
    case "treasury":
      return (
        isGroupManager(m) ||
        hasRole(m, ["committee"]) ||
        hasGranularRole(m, "treasurer") ||
        hasGranularRole(m, "credit_officer")
      );
    case "reports":
      return true;
    default:
      return false;
  }
}
