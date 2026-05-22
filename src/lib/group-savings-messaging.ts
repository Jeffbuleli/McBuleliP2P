import { desc, eq } from "drizzle-orm";
import { getDb, groupMessages, users } from "@/db";
import { notifyGroupMembers } from "@/lib/group-savings-notifications";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";

export type GroupMessageType = "chat" | "system" | "proof";

export async function listGroupMessages(args: {
  groupId: string;
  userId: string;
  limit?: number;
}): Promise<
  | {
      ok: true;
      messages: {
        id: string;
        senderUserId: string;
        senderEmail: string;
        body: string;
        messageType: string;
        attachmentUrl: string | null;
        createdAt: string;
      }[];
    }
  | { ok: false; message: string }
> {
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || (m.status !== "approved" && m.status !== "pending")) {
    return { ok: false, message: "group_forbidden" };
  }

  const limit = Math.min(Math.max(1, args.limit ?? 80), 200);
  const db = getDb();
  const rows = await db
    .select({
      id: groupMessages.id,
      senderUserId: groupMessages.senderUserId,
      senderEmail: users.email,
      body: groupMessages.body,
      messageType: groupMessages.messageType,
      attachmentUrl: groupMessages.attachmentUrl,
      createdAt: groupMessages.createdAt,
    })
    .from(groupMessages)
    .innerJoin(users, eq(groupMessages.senderUserId, users.id))
    .where(eq(groupMessages.groupId, args.groupId))
    .orderBy(desc(groupMessages.createdAt))
    .limit(limit);

  return {
    ok: true,
    messages: rows
      .map((r) => ({
        id: r.id,
        senderUserId: r.senderUserId,
        senderEmail: r.senderEmail,
        body: r.body,
        messageType: r.messageType,
        attachmentUrl: r.attachmentUrl,
        createdAt: r.createdAt.toISOString(),
      }))
      .reverse(),
  };
}

export async function sendGroupMessage(args: {
  groupId: string;
  userId: string;
  body: string;
  messageType?: GroupMessageType;
  attachmentUrl?: string | null;
}): Promise<{ ok: true; messageId: string } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }

  const body = args.body.trim();
  if (body.length < 1 && !args.attachmentUrl) {
    return { ok: false, message: "group_message_empty" };
  }
  if (body.length > 4000) {
    return { ok: false, message: "group_message_too_long" };
  }

  const messageType = args.messageType ?? "chat";
  const db = getDb();
  const [row] = await db
    .insert(groupMessages)
    .values({
      groupId: args.groupId,
      senderUserId: args.userId,
      body: body || "—",
      messageType,
      attachmentUrl: args.attachmentUrl ?? null,
      meta: null,
    })
    .returning({ id: groupMessages.id });

  if (!row?.id) return { ok: false, message: "group_message_failed" };

  const [sender] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, args.userId))
    .limit(1);

  await notifyGroupMembers({
    groupId: args.groupId,
    kind: "group_message",
    excludeUserId: args.userId,
    payload: {
      groupId: args.groupId,
      messageId: row.id,
      preview: body.slice(0, 120),
      senderEmail: sender?.email ?? "",
      messageType,
    },
  });

  return { ok: true, messageId: row.id };
}

export async function insertGroupActivitySystemMessage(args: {
  groupId: string;
  actorUserId: string;
  body: string;
}): Promise<void> {
  try {
    const db = getDb();
    await db.insert(groupMessages).values({
      groupId: args.groupId,
      senderUserId: args.actorUserId,
      body: args.body.slice(0, 4000),
      messageType: "system",
      attachmentUrl: null,
    });
  } catch {
    // Migration may not be applied yet.
  }
}
