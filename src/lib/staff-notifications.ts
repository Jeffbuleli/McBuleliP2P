import { inArray } from "drizzle-orm";
import { getDb, users } from "@/db";
import { UserRole } from "@/lib/roles";
import type { UserRoleType } from "@/lib/roles";
import { agentHasScope, normalizeStaffScopesJson, type StaffScope } from "@/lib/staff-scopes";
import {
  createUserNotification,
  type NotificationKind,
} from "@/lib/notifications-service";

/** Notify agents / super-admins who can process manual crypto deposits & withdrawals. */
export async function notifyStaffWithdrawalsScope(args: {
  kind: Extract<
    NotificationKind,
    | "admin_deposit_order"
    | "admin_deposit_review"
    | "admin_withdrawal_order"
  >;
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const db = getDb();
    const rows = await db
      .select({
        id: users.id,
        role: users.role,
        staffScopes: users.staffScopes,
      })
      .from(users)
      .where(inArray(users.role, [UserRole.AGENT, UserRole.SUPER_ADMIN]));

    const tasks: Promise<void>[] = [];
    for (const u of rows) {
      const scopes: StaffScope[] | null =
        u.role === UserRole.AGENT
          ? u.staffScopes == null
            ? null
            : normalizeStaffScopesJson(u.staffScopes)
          : null;
      if (
        !agentHasScope(
          {
            role: u.role as UserRoleType,
            staffScopes: scopes,
          },
          "withdrawals",
        )
      ) {
        continue;
      }
      tasks.push(
        createUserNotification({
          userId: u.id,
          kind: args.kind,
          payload: args.payload,
        }),
      );
    }
    await Promise.all(tasks);
  } catch {
    // Never block order creation.
  }
}
