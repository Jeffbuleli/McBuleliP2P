import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import {
  getDb,
  supportMessageReads,
  supportMessages,
  supportThreads,
  users,
  type SupportAttachment,
} from "@/db";
import { UserRole } from "@/lib/roles";
import { createUserNotification } from "@/lib/notifications-service";
import { p2pDisplayName } from "@/lib/p2p-display";
import {
  filterAttachmentsForDisplay,
  purgeExpiredSupportAttachments,
} from "@/lib/support-attachments";
import { bodyHasLink, extractMentionHandles } from "@/lib/support-rich-text";

const MAX_BODY = 4000;
const MAX_IMAGE_BYTES = 350_000;

function isMissingRelationError(e: unknown): boolean {
  const anyE = e as { code?: unknown; cause?: unknown } | null;
  if (!anyE) return false;
  if (anyE.code === "42P01") return true;
  const c = anyE.cause as { code?: unknown } | null;
  return c?.code === "42P01";
}

export type SupportParticipant = {
  id: string;
  label: string;
  handle: string;
  avatarUrl: string | null;
  role: string;
  isAgent: boolean;
};

export type SupportMessageDto = {
  id: string;
  body: string;
  createdAt: string;
  senderUserId: string;
  senderLabel: string;
  senderHandle: string;
  senderAvatarUrl: string | null;
  senderRole: string;
  own: boolean;
  attachments: SupportAttachment[] | null;
  mentions: string[] | null;
  readBy: { userId: string; label: string; readAt: string }[];
  unreadForViewer: boolean;
  hasLink: boolean;
  hadExpiredImages: boolean;
};

function userHandle(u: {
  displayName: string | null;
  piUsername: string | null;
  email: string;
}): string {
  const dn = (u.displayName ?? "").trim();
  if (dn) return dn.replace(/\s+/g, "").toLowerCase();
  const pi = (u.piUsername ?? "").trim().replace(/^@/, "");
  if (pi) return pi.toLowerCase();
  const local = u.email.split("@")[0] ?? "trader";
  return local.toLowerCase();
}

function isStaffRole(role: string): boolean {
  return role === UserRole.AGENT || role === UserRole.SUPER_ADMIN;
}

async function listStaffUsers(): Promise<SupportParticipant[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      piUsername: users.piUsername,
      avatarUrl: users.avatarUrl,
      role: users.role,
    })
    .from(users)
    .where(inArray(users.role, [UserRole.AGENT, UserRole.SUPER_ADMIN]));

  return rows.map((r) => ({
    id: r.id,
    label: isStaffRole(r.role) ? "McBuleli Support" : p2pDisplayName(r),
    handle: isStaffRole(r.role) ? "support" : userHandle(r),
    avatarUrl: r.avatarUrl ?? null,
    role: r.role,
    isAgent: true,
  }));
}

export async function listSupportMentionables(args: {
  viewerUserId: string;
  threadId?: string;
}): Promise<SupportParticipant[]> {
  try {
    const db = getDb();
    const staff = await listStaffUsers();
    const out = new Map<string, SupportParticipant>();
    for (const s of staff) out.set(s.id, s);

    if (args.threadId) {
      const [th] = await db
        .select({ userId: supportThreads.userId })
        .from(supportThreads)
        .where(eq(supportThreads.id, args.threadId))
        .limit(1);
      if (th) {
        const [u] = await db
          .select({
            id: users.id,
            email: users.email,
            displayName: users.displayName,
            piUsername: users.piUsername,
            avatarUrl: users.avatarUrl,
            role: users.role,
          })
          .from(users)
          .where(eq(users.id, th.userId))
          .limit(1);
        if (u) {
          out.set(u.id, {
            id: u.id,
            label: p2pDisplayName(u),
            handle: userHandle(u),
            avatarUrl: u.avatarUrl ?? null,
            role: u.role,
            isAgent: false,
          });
        }
      }
    } else {
      const [self] = await db
        .select({
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          piUsername: users.piUsername,
          avatarUrl: users.avatarUrl,
          role: users.role,
        })
        .from(users)
        .where(eq(users.id, args.viewerUserId))
        .limit(1);
      if (self) {
        out.set(self.id, {
          id: self.id,
          label: p2pDisplayName(self),
          handle: userHandle(self),
          avatarUrl: self.avatarUrl ?? null,
          role: self.role,
          isAgent: isStaffRole(self.role),
        });
      }
    }

    return [...out.values()].sort((a, b) =>
      a.isAgent === b.isAgent ? a.label.localeCompare(b.label) : a.isAgent ? -1 : 1,
    );
  } catch (e) {
    if (isMissingRelationError(e)) return [];
    throw e;
  }
}

export async function getOrCreateSupportThread(userId: string): Promise<{
  id: string;
  status: string;
  assignedToUserId: string | null;
} | null> {
  try {
    const db = getDb();
    const [existing] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.userId, userId))
      .limit(1);
    if (existing) {
      return {
        id: existing.id,
        status: existing.status,
        assignedToUserId: existing.assignedToUserId ?? null,
      };
    }
    const [created] = await db
      .insert(supportThreads)
      .values({ userId })
      .returning({
        id: supportThreads.id,
        status: supportThreads.status,
        assignedToUserId: supportThreads.assignedToUserId,
      });
    return created
      ? {
          id: created.id,
          status: created.status,
          assignedToUserId: created.assignedToUserId ?? null,
        }
      : null;
  } catch (e) {
    if (isMissingRelationError(e)) return null;
    throw e;
  }
}

async function resolveMentionUserIds(
  body: string,
  participants: SupportParticipant[],
): Promise<string[]> {
  const handles = extractMentionHandles(body);
  if (!handles.length) return [];
  const ids = new Set<string>();
  for (const h of handles) {
    const p = participants.find((x) => x.handle.toLowerCase() === h);
    if (p) ids.add(p.id);
  }
  return [...ids];
}

function validateAttachments(
  attachments: SupportAttachment[] | undefined,
): SupportAttachment[] | null {
  if (!attachments?.length) return null;
  const out: SupportAttachment[] = [];
  for (const a of attachments) {
    if (a.type !== "image") continue;
    if (!a.dataUrl.startsWith("data:image/")) continue;
    if (a.sizeBytes <= 0 || a.sizeBytes > MAX_IMAGE_BYTES) continue;
    out.push({
      type: "image",
      dataUrl: a.dataUrl,
      mime: a.mime.slice(0, 64),
      sizeBytes: a.sizeBytes,
    });
  }
  return out.length ? out : null;
}

async function notifySupportMessage(args: {
  recipientUserId: string;
  threadId: string;
  preview: string;
  fromLabel: string;
}) {
  await createUserNotification({
    userId: args.recipientUserId,
    kind: "support_message",
    payload: {
      threadId: args.threadId,
      preview: args.preview.slice(0, 120),
      fromLabel: args.fromLabel,
    },
  });
}

export async function postSupportMessage(args: {
  threadId: string;
  senderUserId: string;
  body: string;
  attachments?: SupportAttachment[];
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const text = args.body.trim();
  if (!text && !args.attachments?.length) {
    return { ok: false, message: "support_empty" };
  }
  if (text.length > MAX_BODY) return { ok: false, message: "support_too_long" };

  try {
    const db = getDb();
    const [th] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, args.threadId))
      .limit(1);
    if (!th) return { ok: false, message: "support_thread_not_found" };

    const [sender] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        piUsername: users.piUsername,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, args.senderUserId))
      .limit(1);
    if (!sender) return { ok: false, message: "support_forbidden" };

    const staff = isStaffRole(sender.role);
    if (!staff && th.userId !== args.senderUserId) {
      return { ok: false, message: "support_forbidden" };
    }

    const mentionables = await listSupportMentionables({
      viewerUserId: args.senderUserId,
      threadId: args.threadId,
    });
    const mentionIds = await resolveMentionUserIds(text, mentionables);
    const attachments = validateAttachments(args.attachments);

    const [msg] = await db
      .insert(supportMessages)
      .values({
        threadId: args.threadId,
        senderUserId: args.senderUserId,
        body: text || " ",
        attachments,
        mentions: mentionIds.length ? mentionIds : null,
      })
      .returning({ id: supportMessages.id });

    await db.insert(supportMessageReads).values({
      messageId: msg.id,
      userId: args.senderUserId,
    });

    await db
      .update(supportThreads)
      .set({ lastMessageAt: new Date() })
      .where(eq(supportThreads.id, args.threadId));

    if (staff && !th.assignedToUserId) {
      await db
        .update(supportThreads)
        .set({ assignedToUserId: args.senderUserId })
        .where(eq(supportThreads.id, args.threadId));
    }

    const fromLabel = staff ? "McBuleli Support" : p2pDisplayName(sender);
    const preview = text || (attachments?.length ? "Image" : "");

    const notifyIds = new Set<string>();
    notifyIds.add(th.userId);
    if (th.assignedToUserId) notifyIds.add(th.assignedToUserId);
    for (const id of mentionIds) notifyIds.add(id);
    if (staff) {
      const agents = await listStaffUsers();
      for (const a of agents) notifyIds.add(a.id);
    }
    notifyIds.delete(args.senderUserId);

    await Promise.all(
      [...notifyIds].map((uid) =>
        notifySupportMessage({
          recipientUserId: uid,
          threadId: args.threadId,
          preview,
          fromLabel,
        }),
      ),
    );

    return { ok: true };
  } catch (e) {
    if (isMissingRelationError(e)) return { ok: false, message: "support_unavailable" };
    throw e;
  }
}

async function buildMessageDtos(args: {
  threadId: string;
  viewerUserId: string;
  rows: {
    id: string;
    body: string;
    createdAt: Date;
    senderUserId: string;
    attachments: SupportAttachment[] | null;
    mentions: string[] | null;
    email: string;
    displayName: string | null;
    piUsername: string | null;
    avatarUrl: string | null;
    role: string;
  }[];
}): Promise<SupportMessageDto[]> {
  if (!args.rows.length) return [];
  const db = getDb();
  const msgIds = args.rows.map((r) => r.id);
  const readRows = await db
    .select({
      messageId: supportMessageReads.messageId,
      userId: supportMessageReads.userId,
      readAt: supportMessageReads.readAt,
      displayName: users.displayName,
      piUsername: users.piUsername,
      email: users.email,
      role: users.role,
    })
    .from(supportMessageReads)
    .innerJoin(users, eq(supportMessageReads.userId, users.id))
    .where(inArray(supportMessageReads.messageId, msgIds));

  const readsByMsg = new Map<string, { userId: string; label: string; readAt: string }[]>();
  for (const r of readRows) {
    const label = isStaffRole(r.role)
      ? "McBuleli Support"
      : p2pDisplayName({
          email: r.email,
          displayName: r.displayName,
          piUsername: r.piUsername,
          avatarUrl: null,
        });
    const list = readsByMsg.get(r.messageId) ?? [];
    list.push({
      userId: r.userId,
      label,
      readAt: r.readAt.toISOString(),
    });
    readsByMsg.set(r.messageId, list);
  }

  return args.rows.map((r) => {
    const staff = isStaffRole(r.role);
    const label = staff ? "McBuleli Support" : p2pDisplayName(r);
    const handle = staff ? "support" : userHandle(r);
    const readBy = readsByMsg.get(r.id) ?? [];
    const viewerRead = readBy.some((x) => x.userId === args.viewerUserId);
    const { attachments, hadExpiredImages } = filterAttachmentsForDisplay(
      r.attachments,
      r.createdAt,
    );
    return {
      id: r.id,
      body: r.body.trim(),
      createdAt: r.createdAt.toISOString(),
      senderUserId: r.senderUserId,
      senderLabel: label,
      senderHandle: handle,
      senderAvatarUrl: r.avatarUrl ?? null,
      senderRole: r.role,
      own: r.senderUserId === args.viewerUserId,
      attachments,
      mentions: r.mentions,
      readBy,
      unreadForViewer: !viewerRead && r.senderUserId !== args.viewerUserId,
      hasLink: bodyHasLink(r.body),
      hadExpiredImages,
    };
  });
}

export async function listSupportMessages(args: {
  threadId: string;
  viewerUserId: string;
}): Promise<
  | { ok: true; messages: SupportMessageDto[]; thread: { id: string; status: string } }
  | { ok: false; message: string }
> {
  try {
    const db = getDb();
    const [th] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, args.threadId))
      .limit(1);
    if (!th) return { ok: false, message: "support_thread_not_found" };

    const [viewer] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, args.viewerUserId))
      .limit(1);
    const staff = viewer ? isStaffRole(viewer.role) : false;
    if (!staff && th.userId !== args.viewerUserId) {
      return { ok: false, message: "support_forbidden" };
    }

    void purgeExpiredSupportAttachments();

    const rows = await db
      .select({
        id: supportMessages.id,
        body: supportMessages.body,
        createdAt: supportMessages.createdAt,
        senderUserId: supportMessages.senderUserId,
        attachments: supportMessages.attachments,
        mentions: supportMessages.mentions,
        email: users.email,
        displayName: users.displayName,
        piUsername: users.piUsername,
        avatarUrl: users.avatarUrl,
        role: users.role,
      })
      .from(supportMessages)
      .innerJoin(users, eq(supportMessages.senderUserId, users.id))
      .where(eq(supportMessages.threadId, args.threadId))
      .orderBy(asc(supportMessages.createdAt));

    const messages = await buildMessageDtos({
      threadId: args.threadId,
      viewerUserId: args.viewerUserId,
      rows,
    });

    return {
      ok: true,
      messages,
      thread: { id: th.id, status: th.status },
    };
  } catch (e) {
    if (isMissingRelationError(e)) return { ok: false, message: "support_unavailable" };
    throw e;
  }
}

export async function markSupportThreadRead(args: {
  threadId: string;
  viewerUserId: string;
}): Promise<{ ok: true; marked: number } | { ok: false; message: string }> {
  try {
    const db = getDb();
    const [th] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, args.threadId))
      .limit(1);
    if (!th) return { ok: false, message: "support_thread_not_found" };

    const [viewer] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, args.viewerUserId))
      .limit(1);
    const staff = viewer ? isStaffRole(viewer.role) : false;
    if (!staff && th.userId !== args.viewerUserId) {
      return { ok: false, message: "support_forbidden" };
    }

    const unread = await db
      .select({ id: supportMessages.id })
      .from(supportMessages)
      .leftJoin(
        supportMessageReads,
        and(
          eq(supportMessageReads.messageId, supportMessages.id),
          eq(supportMessageReads.userId, args.viewerUserId),
        ),
      )
      .where(
        and(
          eq(supportMessages.threadId, args.threadId),
          ne(supportMessages.senderUserId, args.viewerUserId),
          sql`${supportMessageReads.messageId} IS NULL`,
        ),
      );

    let marked = 0;
    for (const m of unread) {
      await db
        .insert(supportMessageReads)
        .values({ messageId: m.id, userId: args.viewerUserId })
        .onConflictDoNothing({
          target: [supportMessageReads.messageId, supportMessageReads.userId],
        });
      marked += 1;
    }
    return { ok: true, marked };
  } catch (e) {
    if (isMissingRelationError(e)) return { ok: false, message: "support_unavailable" };
    throw e;
  }
}

export async function countSupportUnread(viewerUserId: string): Promise<number> {
  try {
    const db = getDb();
    const [viewer] = await db
      .select({ role: users.role })
      .from(users)
      .where(eq(users.id, viewerUserId))
      .limit(1);
    const staff = viewer ? isStaffRole(viewer.role) : false;

    if (staff) {
      const rows = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n
        FROM support_messages m
        INNER JOIN support_threads t ON t.id = m.thread_id
        WHERE m.sender_user_id = t.user_id
          AND NOT EXISTS (
            SELECT 1 FROM support_message_reads r
            WHERE r.message_id = m.id AND r.user_id = ${viewerUserId}
          )
      `);
      const n = rows[0]?.n;
      return typeof n === "number" ? n : Number(n ?? 0);
    }

    const th = await getOrCreateSupportThread(viewerUserId);
    if (!th) return 0;

    const rows = await db.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n
      FROM support_messages m
      WHERE m.thread_id = ${th.id}
        AND m.sender_user_id <> ${viewerUserId}
        AND NOT EXISTS (
          SELECT 1 FROM support_message_reads r
          WHERE r.message_id = m.id AND r.user_id = ${viewerUserId}
        )
    `);
    const n = rows[0]?.n;
    return typeof n === "number" ? n : Number(n ?? 0);
  } catch (e) {
    if (isMissingRelationError(e)) return 0;
    throw e;
  }
}

export type SupportThreadListItem = {
  id: string;
  userId: string;
  userLabel: string;
  userAvatarUrl: string | null;
  status: string;
  lastMessageAt: string;
  preview: string;
  unreadCount: number;
  assignedToUserId: string | null;
};

export async function listSupportThreadsForStaff(
  staffUserId: string,
): Promise<SupportThreadListItem[]> {
  try {
    const db = getDb();
    const threads = await db
      .select({
        id: supportThreads.id,
        userId: supportThreads.userId,
        status: supportThreads.status,
        lastMessageAt: supportThreads.lastMessageAt,
        assignedToUserId: supportThreads.assignedToUserId,
        email: users.email,
        displayName: users.displayName,
        piUsername: users.piUsername,
        avatarUrl: users.avatarUrl,
      })
      .from(supportThreads)
      .innerJoin(users, eq(supportThreads.userId, users.id))
      .orderBy(desc(supportThreads.lastMessageAt))
      .limit(80);

    const out: SupportThreadListItem[] = [];
    for (const t of threads) {
      const [last] = await db
        .select({ body: supportMessages.body })
        .from(supportMessages)
        .where(eq(supportMessages.threadId, t.id))
        .orderBy(desc(supportMessages.createdAt))
        .limit(1);

      const unreadRows = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n
        FROM support_messages m
        WHERE m.thread_id = ${t.id}
          AND m.sender_user_id = ${t.userId}
          AND NOT EXISTS (
            SELECT 1 FROM support_message_reads r
            WHERE r.message_id = m.id AND r.user_id = ${staffUserId}
          )
      `);
      const unread = unreadRows[0]?.n ?? 0;

      out.push({
        id: t.id,
        userId: t.userId,
        userLabel: p2pDisplayName(t),
        userAvatarUrl: t.avatarUrl ?? null,
        status: t.status,
        lastMessageAt: t.lastMessageAt.toISOString(),
        preview: last?.body?.slice(0, 80) ?? "",
        unreadCount: typeof unread === "number" ? unread : Number(unread),
        assignedToUserId: t.assignedToUserId ?? null,
      });
    }
    return out;
  } catch (e) {
    if (isMissingRelationError(e)) return [];
    throw e;
  }
}
