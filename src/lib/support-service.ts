import { and, asc, desc, eq, inArray, lt, ne, sql } from "drizzle-orm";
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
import { ensureSupportSchema } from "@/lib/support-schema";

const MAX_BODY = 4000;
const MAX_IMAGE_BYTES = 350_000;
/** Close open threads after 3 hours without messages. */
export const SUPPORT_INACTIVE_MS = 3 * 60 * 60 * 1000;
export const SUPPORT_SYSTEM_PREFIX = "__support_system__:";

export type SupportClosedReason = "satisfied" | "inactive";

export type SupportThreadDto = {
  id: string;
  status: string;
  assignedToUserId: string | null;
  closedAt: string | null;
  closedReason: SupportClosedReason | null;
  isNew: boolean;
};

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
  isSystem: boolean;
  systemKind: string | null;
};

function isSystemBody(body: string): boolean {
  return body.startsWith(SUPPORT_SYSTEM_PREFIX);
}

function systemKindFromBody(body: string): string | null {
  if (!isSystemBody(body)) return null;
  return body.slice(SUPPORT_SYSTEM_PREFIX.length).split(":")[0] ?? null;
}

function systemMessageBody(kind: string): string {
  return `${SUPPORT_SYSTEM_PREFIX}${kind}`;
}

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
    await ensureSupportSchema();
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

function toThreadDto(
  row: {
    id: string;
    status: string;
    assignedToUserId: string | null;
    closedAt: Date | null;
    closedReason: string | null;
  },
  isNew: boolean,
): SupportThreadDto {
  const reason = row.closedReason;
  return {
    id: row.id,
    status: row.status,
    assignedToUserId: row.assignedToUserId,
    closedAt: row.closedAt?.toISOString() ?? null,
    closedReason:
      reason === "satisfied" || reason === "inactive" ? reason : null,
    isNew,
  };
}

async function insertSystemMessage(
  threadId: string,
  senderUserId: string,
  kind: string,
): Promise<void> {
  const db = getDb();
  const [msg] = await db
    .insert(supportMessages)
    .values({
      threadId,
      senderUserId,
      body: systemMessageBody(kind),
    })
    .returning({ id: supportMessages.id });
  await db.insert(supportMessageReads).values({
    messageId: msg.id,
    userId: senderUserId,
  });
}

async function closeSupportThreadInternal(
  threadId: string,
  reason: SupportClosedReason,
): Promise<void> {
  const db = getDb();
  const [th] = await db
    .select({
      id: supportThreads.id,
      userId: supportThreads.userId,
      status: supportThreads.status,
    })
    .from(supportThreads)
    .where(eq(supportThreads.id, threadId))
    .limit(1);
  if (!th || th.status !== "open") return;

  await db
    .update(supportThreads)
    .set({
      status: "closed",
      closedAt: new Date(),
      closedReason: reason,
    })
    .where(eq(supportThreads.id, threadId));

  await insertSystemMessage(threadId, th.userId, `closed_${reason}`);
}

async function closeInactiveOpenThreadsForUser(userId: string): Promise<void> {
  const db = getDb();
  const cutoff = new Date(Date.now() - SUPPORT_INACTIVE_MS);
  const stale = await db
    .select({ id: supportThreads.id })
    .from(supportThreads)
    .where(
      and(
        eq(supportThreads.userId, userId),
        eq(supportThreads.status, "open"),
        lt(supportThreads.lastMessageAt, cutoff),
      ),
    );
  for (const row of stale) {
    await closeSupportThreadInternal(row.id, "inactive");
  }
}

async function createOpenSupportThread(userId: string): Promise<SupportThreadDto> {
  const db = getDb();
  const [created] = await db
    .insert(supportThreads)
    .values({ userId })
    .returning({
      id: supportThreads.id,
      status: supportThreads.status,
      assignedToUserId: supportThreads.assignedToUserId,
      closedAt: supportThreads.closedAt,
      closedReason: supportThreads.closedReason,
    });
  if (!created) throw new Error("support_thread_create_failed");
  await insertSystemMessage(created.id, userId, "welcome");
  return toThreadDto(created, true);
}

/** Ensures schema, auto-closes inactive threads, returns open thread or creates a new one. */
export async function ensureOpenSupportThread(
  userId: string,
): Promise<SupportThreadDto | null> {
  try {
    await ensureSupportSchema();
    const db = getDb();
    await closeInactiveOpenThreadsForUser(userId);

    const [open] = await db
      .select()
      .from(supportThreads)
      .where(
        and(eq(supportThreads.userId, userId), eq(supportThreads.status, "open")),
      )
      .orderBy(desc(supportThreads.lastMessageAt))
      .limit(1);

    if (open) {
      return toThreadDto(open, false);
    }

    return await createOpenSupportThread(userId);
  } catch (e) {
    if (isMissingRelationError(e)) return null;
    throw e;
  }
}

export async function closeSupportThreadByUser(args: {
  threadId: string;
  userId: string;
  reason?: SupportClosedReason;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await ensureSupportSchema();
    const db = getDb();
    const [th] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, args.threadId))
      .limit(1);
    if (!th) return { ok: false, message: "support_thread_not_found" };
    if (th.userId !== args.userId) {
      return { ok: false, message: "support_forbidden" };
    }
    if (th.status !== "open") {
      return { ok: false, message: "support_thread_closed" };
    }
    await closeSupportThreadInternal(
      args.threadId,
      args.reason ?? "satisfied",
    );
    return { ok: true };
  } catch (e) {
    if (isMissingRelationError(e)) return { ok: false, message: "support_unavailable" };
    throw e;
  }
}

/** @deprecated Use ensureOpenSupportThread */
export async function getOrCreateSupportThread(userId: string): Promise<{
  id: string;
  status: string;
  assignedToUserId: string | null;
} | null> {
  const th = await ensureOpenSupportThread(userId);
  if (!th) return null;
  return {
    id: th.id,
    status: th.status,
    assignedToUserId: th.assignedToUserId,
  };
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
    await ensureSupportSchema();
    const db = getDb();
    const [th] = await db
      .select()
      .from(supportThreads)
      .where(eq(supportThreads.id, args.threadId))
      .limit(1);
    if (!th) return { ok: false, message: "support_thread_not_found" };
    if (th.status !== "open") {
      return { ok: false, message: "support_thread_closed" };
    }

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
    const sys = isSystemBody(r.body);
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
      attachments: sys ? null : attachments,
      mentions: r.mentions,
      readBy: sys ? [] : readBy,
      unreadForViewer: sys
        ? false
        : !viewerRead && r.senderUserId !== args.viewerUserId,
      hasLink: sys ? false : bodyHasLink(r.body),
      hadExpiredImages: sys ? false : hadExpiredImages,
      isSystem: sys,
      systemKind: systemKindFromBody(r.body),
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

    const userMsgCount = rows.filter((r) => !isSystemBody(r.body)).length;

    return {
      ok: true,
      messages,
      thread: toThreadDto(
        {
          id: th.id,
          status: th.status,
          assignedToUserId: th.assignedToUserId ?? null,
          closedAt: th.closedAt ?? null,
          closedReason: th.closedReason ?? null,
        },
        userMsgCount === 0,
      ),
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
    await ensureSupportSchema();
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
    await ensureSupportSchema();
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

    await closeInactiveOpenThreadsForUser(viewerUserId);
    const [open] = await db
      .select({ id: supportThreads.id })
      .from(supportThreads)
      .where(
        and(
          eq(supportThreads.userId, viewerUserId),
          eq(supportThreads.status, "open"),
        ),
      )
      .limit(1);
    if (!open) return 0;

    const rows = await db.execute<{ n: number }>(sql`
      SELECT COUNT(*)::int AS n
      FROM support_messages m
      WHERE m.thread_id = ${open.id}
        AND m.sender_user_id <> ${viewerUserId}
        AND m.body NOT LIKE ${SUPPORT_SYSTEM_PREFIX + "%"}
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

/** Derived queue priority for the staff inbox (not persisted). */
export type SupportUrgency = "urgent" | "attention" | "normal" | "closed";

export type SupportThreadSort = "urgency" | "lastMessage" | "unread" | "status";

export type SupportThreadListItem = {
  id: string;
  userId: string;
  userLabel: string;
  userAvatarUrl: string | null;
  status: string;
  urgency: SupportUrgency;
  lastMessageAt: string;
  preview: string;
  unreadCount: number;
  assignedToUserId: string | null;
  /** Last non-system message was written by the end-user (vs staff). */
  lastSenderIsUser: boolean;
  /** Minutes since last non-system activity (staff or user). */
  waitingMinutes: number;
};

const URGENCY_RANK: Record<SupportUrgency, number> = {
  urgent: 0,
  attention: 1,
  normal: 2,
  closed: 3,
};

function supportStaffPreview(body: string | undefined | null): string {
  const raw = (body ?? "").trim();
  if (!raw || isSystemBody(raw)) return "";
  if (raw === " ") return "📷";
  return raw.replace(/\s+/g, " ").slice(0, 120);
}

function computeSupportUrgency(args: {
  status: string;
  unreadCount: number;
  waitingMs: number;
  lastSenderIsUser: boolean;
}): SupportUrgency {
  if (args.status === "closed") return "closed";
  if (args.unreadCount >= 3) return "urgent";
  if (
    args.unreadCount >= 1 &&
    args.lastSenderIsUser &&
    args.waitingMs >= 2 * 60 * 60 * 1000
  ) {
    return "urgent";
  }
  if (args.unreadCount >= 1) return "attention";
  if (args.lastSenderIsUser && args.waitingMs >= 4 * 60 * 60 * 1000) {
    return "attention";
  }
  return "normal";
}

export type SupportThreadsPage = {
  threads: SupportThreadListItem[];
  total: number;
  page: number;
  pageSize: number;
};

const STAFF_THREADS_FETCH_LIMIT = 500;

export async function listSupportThreadsForStaff(
  staffUserId: string,
): Promise<SupportThreadListItem[]> {
  const pg = await listSupportThreadsForStaffPaginated(staffUserId, {
    page: 1,
    limit: 80,
    sort: "lastMessage",
    order: "desc",
  });
  return pg.threads;
}

export async function listSupportThreadsForStaffPaginated(
  staffUserId: string,
  opts: {
    status?: "all" | "open" | "closed";
    urgency?: "all" | "urgent" | "attention";
    sort?: SupportThreadSort;
    order?: "asc" | "desc";
    page?: number;
    /** Page size — only 10, 20 or 30 are accepted. */
    limit?: number;
  } = {},
): Promise<SupportThreadsPage> {
  const rawLimit = opts.limit ?? 20;
  const pageSize =
    rawLimit === 10 ||
    rawLimit === 20 ||
    rawLimit === 30 ||
    rawLimit === 80
      ? rawLimit
      : 20;
  const page = Math.max(1, opts.page ?? 1);
  const statusFilter = opts.status ?? "all";
  const urgencyFilter = opts.urgency ?? "all";
  const sort = opts.sort ?? "urgency";
  const order = opts.order === "asc" ? "asc" : "desc";

  try {
    await ensureSupportSchema();
    const db = getDb();

    const statusCond =
      statusFilter === "open"
        ? eq(supportThreads.status, "open")
        : statusFilter === "closed"
          ? eq(supportThreads.status, "closed")
          : undefined;

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
      .where(statusCond ?? sql`true`)
      .orderBy(desc(supportThreads.lastMessageAt))
      .limit(STAFF_THREADS_FETCH_LIMIT);

    const enriched: SupportThreadListItem[] = [];
    const now = Date.now();
    const systemLike = SUPPORT_SYSTEM_PREFIX + "%";

    for (const t of threads) {
      const [last] = await db
        .select({
          body: supportMessages.body,
          senderUserId: supportMessages.senderUserId,
          createdAt: supportMessages.createdAt,
        })
        .from(supportMessages)
        .where(
          and(
            eq(supportMessages.threadId, t.id),
            sql`${supportMessages.body} NOT LIKE ${systemLike}`,
          ),
        )
        .orderBy(desc(supportMessages.createdAt))
        .limit(1);

      const unreadRows = await db.execute<{ n: number }>(sql`
        SELECT COUNT(*)::int AS n
        FROM support_messages m
        WHERE m.thread_id = ${t.id}
          AND m.sender_user_id = ${t.userId}
          AND m.body NOT LIKE ${systemLike}
          AND NOT EXISTS (
            SELECT 1 FROM support_message_reads r
            WHERE r.message_id = m.id AND r.user_id = ${staffUserId}
          )
      `);
      const unreadRaw = unreadRows[0]?.n ?? 0;
      const unreadCount =
        typeof unreadRaw === "number" ? unreadRaw : Number(unreadRaw);

      const lastSenderIsUser =
        !!last?.senderUserId && last.senderUserId === t.userId;
      const lastAt = last?.createdAt ?? t.lastMessageAt;
      const waitingMs = Math.max(0, now - lastAt.getTime());
      const urgency = computeSupportUrgency({
        status: t.status,
        unreadCount,
        waitingMs,
        lastSenderIsUser,
      });

      if (urgencyFilter === "urgent" && urgency !== "urgent") continue;
      if (urgencyFilter === "attention" && urgency !== "attention") continue;

      const previewRaw = supportStaffPreview(last?.body);
      enriched.push({
        id: t.id,
        userId: t.userId,
        userLabel: p2pDisplayName(t),
        userAvatarUrl: t.avatarUrl ?? null,
        status: t.status,
        urgency,
        lastMessageAt: t.lastMessageAt.toISOString(),
        preview: previewRaw.length > 0 ? previewRaw : "—",
        unreadCount,
        assignedToUserId: t.assignedToUserId ?? null,
        lastSenderIsUser,
        waitingMinutes: Math.floor(waitingMs / 60_000),
      });
    }

    const dirSign = order === "asc" ? 1 : -1;

    enriched.sort((a, b) => {
      let cmp = 0;
      switch (sort) {
        case "lastMessage":
          cmp =
            new Date(a.lastMessageAt).getTime() -
            new Date(b.lastMessageAt).getTime();
          cmp *= dirSign;
          break;
        case "unread":
          cmp = a.unreadCount - b.unreadCount;
          cmp *= dirSign;
          break;
        case "status":
          cmp =
            (a.status === "open" ? 0 : 1) - (b.status === "open" ? 0 : 1);
          cmp *= dirSign;
          if (cmp === 0) {
            cmp =
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime();
          }
          break;
        case "urgency":
        default:
          cmp = URGENCY_RANK[a.urgency] - URGENCY_RANK[b.urgency];
          if (cmp === 0) cmp = b.unreadCount - a.unreadCount;
          if (cmp === 0) {
            cmp =
              new Date(b.lastMessageAt).getTime() -
              new Date(a.lastMessageAt).getTime();
          }
          break;
      }
      if (sort !== "urgency" && sort !== "status" && cmp === 0) {
        cmp =
          new Date(b.lastMessageAt).getTime() -
          new Date(a.lastMessageAt).getTime();
      }
      return cmp;
    });

    const total = enriched.length;
    const offset = (page - 1) * pageSize;
    const pageRows = enriched.slice(offset, offset + pageSize);

    return { threads: pageRows, total, page, pageSize };
  } catch (e) {
    if (isMissingRelationError(e)) {
      return { threads: [], total: 0, page: 1, pageSize };
    }
    throw e;
  }
}
