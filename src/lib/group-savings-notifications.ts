import { and, eq, inArray, ne } from "drizzle-orm";
import { getDb, groupSavingsMemberships } from "@/db";
import {
  createUserNotification,
  type NotificationKind,
} from "@/lib/notifications-service";
import type { GroupMembershipRole } from "@/lib/group-savings-types";

export async function notifyGroupMembers(args: {
  groupId: string;
  kind: NotificationKind;
  payload: Record<string, unknown>;
  excludeUserId?: string;
  onlyRoles?: GroupMembershipRole[];
}): Promise<void> {
  const db = getDb();
  const conds = [
    eq(groupSavingsMemberships.groupId, args.groupId),
    eq(groupSavingsMemberships.status, "approved"),
  ];
  if (args.excludeUserId) {
    conds.push(ne(groupSavingsMemberships.userId, args.excludeUserId));
  }
  if (args.onlyRoles?.length) {
    conds.push(inArray(groupSavingsMemberships.role, args.onlyRoles));
  }

  const rows = await db
    .select({ userId: groupSavingsMemberships.userId })
    .from(groupSavingsMemberships)
    .where(and(...conds))
    .limit(500);

  await Promise.all(
    rows.map((r) =>
      createUserNotification({
        userId: r.userId,
        kind: args.kind,
        payload: args.payload,
      }),
    ),
  );
}
