import { getDb, groupAuditLog } from "@/db";

export async function writeGroupAudit(args: {
  groupId: string;
  actorUserId: string | null;
  action: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}): Promise<void> {
  const db = getDb();
  await db.insert(groupAuditLog).values({
    groupId: args.groupId,
    actorUserId: args.actorUserId,
    action: args.action,
    before: args.before ?? null,
    after: args.after ?? null,
  });
}

