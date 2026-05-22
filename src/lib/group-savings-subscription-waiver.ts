import { eq } from "drizzle-orm";
import { getDb, groupSavingsGroups, users } from "@/db";
import { UserRole } from "@/lib/roles";

/** Super-admin test groups: no $5/mo treasury billing, no suspension for unpaid subscription. */
export async function userHasAvecSubscriptionWaiver(userId: string): Promise<boolean> {
  const [u] = await getDb()
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return u?.role === UserRole.SUPER_ADMIN;
}

export async function groupHasAvecSubscriptionWaiver(groupId: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ role: users.role })
    .from(groupSavingsGroups)
    .innerJoin(users, eq(groupSavingsGroups.createdByUserId, users.id))
    .where(eq(groupSavingsGroups.id, groupId))
    .limit(1);
  return row?.role === UserRole.SUPER_ADMIN;
}
