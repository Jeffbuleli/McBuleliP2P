import type { Messages } from "@/i18n/messages";
import type { AdminDashboardStats } from "@/lib/admin-dashboard-stats";
export type ProfileChipTone =
  | "mint"
  | "sky"
  | "amber"
  | "violet"
  | "forest"
  | "copper";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";
import type { SessionUser } from "@/lib/session-user";

export type OpsHubIcon =
  | "dashboard"
  | "withdraw"
  | "p2p"
  | "users"
  | "finance"
  | "bots"
  | "deposits"
  | "kyc"
  | "support";

export type OpsHubItem = {
  id: string;
  href: string;
  labelKey: keyof Messages;
  descKey: keyof Messages;
  tone: ProfileChipTone;
  icon: OpsHubIcon;
  badge: number | null;
  /** users: growth count; default: pending queue */
  badgeKind?: "pending" | "growth";
};

export function buildProfileOpsHubItems(
  user: SessionUser,
  stats: AdminDashboardStats,
): OpsHubItem[] {
  const isSuper = user.role === UserRole.SUPER_ADMIN;
  const showW = isSuper || agentHasScope(user, "withdrawals");
  const showP2p = isSuper || agentHasScope(user, "p2p_disputes");

  const items: OpsHubItem[] = [];

  const dashboardPending =
    (showW ? stats.withdrawalsPendingAgent : 0) +
    (showP2p ? stats.p2pDisputesOpen : 0) +
    (isSuper ? stats.groupsPendingReview : 0);

  items.push({
    id: "dashboard",
    href: "/admin",
    labelKey: "profile_ops_dashboard",
    descKey: "profile_ops_dashboard_desc",
    tone: "forest",
    icon: "dashboard",
    badge: dashboardPending > 0 ? dashboardPending : null,
  });

  if (showW) {
    items.push({
      id: "deposits",
      href: "/admin/deposits",
      labelKey: "profile_ops_deposits",
      descKey: "profile_ops_deposits_desc",
      tone: "mint",
      icon: "deposits",
      badge: null,
    });
    items.push({
      id: "withdrawals",
      href: "/admin/withdrawals?status=PENDING_AGENT&assignFilter=all",
      labelKey: "profile_ops_withdrawals",
      descKey: "profile_ops_withdrawals_desc",
      tone: "amber",
      icon: "withdraw",
      badge:
        stats.withdrawalsPendingAgent > 0 ? stats.withdrawalsPendingAgent : null,
    });
  }

  if (showP2p) {
    items.push({
      id: "p2p",
      href: "/admin/p2p",
      labelKey: "profile_ops_p2p",
      descKey: "profile_ops_p2p_desc",
      tone: "copper",
      icon: "p2p",
      badge: stats.p2pDisputesOpen > 0 ? stats.p2pDisputesOpen : null,
    });
  }

  if (isSuper) {
    items.push({
      id: "kyc",
      href: "/admin/kyc",
      labelKey: "profile_ops_kyc",
      descKey: "profile_ops_kyc_desc",
      tone: "amber",
      icon: "kyc",
      badge: null,
    });

    items.push({
      id: "support",
      href: "/admin/support",
      labelKey: "profile_ops_support",
      descKey: "profile_ops_support_desc",
      tone: "sky",
      icon: "support",
      badge: null,
    });

    items.push({
      id: "users",
      href: "/admin/users",
      labelKey: "profile_ops_users",
      descKey: "profile_ops_users_desc",
      tone: "sky",
      icon: "users",
      badge:
        stats.usersRegisteredLast7Days > 0
          ? stats.usersRegisteredLast7Days
          : null,
      badgeKind: "growth",
    });

    items.push({
      id: "finance",
      href: "/admin/finance",
      labelKey: "profile_ops_finance",
      descKey: "profile_ops_finance_desc",
      tone: "mint",
      icon: "finance",
      badge: null,
    });

    items.push({
      id: "bots",
      href: "/admin/bots",
      labelKey: "profile_ops_bots",
      descKey: "profile_ops_bots_desc",
      tone: "violet",
      icon: "bots",
      badge: null,
    });

    items.push({
      id: "academy",
      href: "/admin/academy",
      labelKey: "profile_ops_academy",
      descKey: "profile_ops_academy_desc",
      tone: "forest",
      icon: "dashboard",
      badge: null,
    });
  }

  return items;
}

export function opsHubTotalPending(items: OpsHubItem[]): number {
  return items.reduce((sum, i) => sum + (i.badge ?? 0), 0);
}
