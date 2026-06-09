import { and, desc, eq, gt, inArray, lt, ne, or, sql } from "drizzle-orm";
import {
  communityDmMessages,
  communityDmMutes,
  communityDmReads,
  communityDmThreads,
  communityDmTyping,
  communityMedia,
  communityReports,
  communityUserBlocks,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import { communityEnabled } from "@/lib/community/config";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import {
  checkDmRateLimit,
  moderateDmText,
} from "@/lib/community/dm-moderation";
import { listActiveBotSubscriptions } from "@/lib/bot-subscription-service";
import { UserRole } from "@/lib/roles";

const ONLINE_MS = 5 * 60 * 1000;

export type DmPeerView = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  verifiedBlue: boolean;
  isAdmin: boolean;
  showKycBadge: boolean;
  online: boolean;
};

export type DmThreadListItem = {
  id: string;
  peer: DmPeerView;
  status: string;
  lastMessagePreview: string | null;
  lastMessageAt: string;
  unreadCount: number;
  isRequest: boolean;
};

export type DmMessageView = {
  id: string;
  body: string;
  messageType: string;
  attachmentUrl: string | null;
  attachmentMeta: Record<string, unknown> | null;
  hidden: boolean;
  hiddenReason: string | null;
  createdAt: string;
  senderId: string;
  own: boolean;
  delivered: boolean;
  read: boolean;
};

function orderedPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

async function isBlocked(a: string, b: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: communityUserBlocks.id })
    .from(communityUserBlocks)
    .where(
      or(
        and(
          eq(communityUserBlocks.blockerId, a),
          eq(communityUserBlocks.blockedId, b),
        ),
        and(
          eq(communityUserBlocks.blockerId, b),
          eq(communityUserBlocks.blockedId, a),
        ),
      ),
    )
    .limit(1);
  return !!row;
}

async function peerView(userId: string): Promise<DmPeerView | null> {
  const db = getDb();
  const [profile] = await db
    .select()
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.userId, userId))
    .limit(1);
  const [u] = await db
    .select({
      avatarUrl: users.avatarUrl,
      kycStatus: users.kycStatus,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!profile || !u) return null;

  const subs = await listActiveBotSubscriptions(userId);
  const verifiedBlue = profile.verifiedBlue || subs.length > 0;
  const online =
    !!profile.lastActiveAt &&
    Date.now() - profile.lastActiveAt.getTime() < ONLINE_MS;

  return {
    userId,
    handle: profile.handle,
    displayName: profile.displayName,
    avatarUrl: u.avatarUrl,
    verifiedBlue,
    isAdmin: u.role === UserRole.AGENT || u.role === UserRole.SUPER_ADMIN,
    showKycBadge:
      profile.showKycBadge && u.kycStatus === "approved",
    online,
  };
}

async function dmSchemaReady(): Promise<void> {
  await ensureCommunitySchema();
}

export async function touchCommunityPresence(userId: string): Promise<void> {
  await dmSchemaReady();
  const db = getDb();
  await db
    .update(communityUserProfiles)
    .set({ lastActiveAt: new Date(), updatedAt: new Date() })
    .where(eq(communityUserProfiles.userId, userId));
}

export async function listDmThreads(
  userId: string,
): Promise<DmThreadListItem[]> {
  if (!communityEnabled()) return [];
  await dmSchemaReady();
  const db = getDb();

  const rows = await db
    .select()
    .from(communityDmThreads)
    .where(
      or(
        eq(communityDmThreads.participantA, userId),
        eq(communityDmThreads.participantB, userId),
      ),
    )
    .orderBy(desc(communityDmThreads.lastMessageAt))
    .limit(50);

  const out: DmThreadListItem[] = [];
  for (const row of rows) {
    const peerId =
      row.participantA === userId ? row.participantB : row.participantA;
    const peer = await peerView(peerId);
    if (!peer) continue;

    const [read] = await db
      .select({ lastReadAt: communityDmReads.lastReadAt })
      .from(communityDmReads)
      .where(
        and(
          eq(communityDmReads.threadId, row.id),
          eq(communityDmReads.userId, userId),
        ),
      )
      .limit(1);

    const unreadCond = read?.lastReadAt
      ? gt(communityDmMessages.createdAt, read.lastReadAt)
      : sql`true`;

    const [unread] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(communityDmMessages)
      .where(
        and(
          eq(communityDmMessages.threadId, row.id),
          ne(communityDmMessages.senderId, userId),
          unreadCond,
          eq(communityDmMessages.hidden, false),
        ),
      );

    out.push({
      id: row.id,
      peer,
      status: row.status,
      lastMessagePreview: row.lastMessagePreview,
      lastMessageAt: row.lastMessageAt.toISOString(),
      unreadCount: Number(unread?.n ?? 0),
      isRequest:
        row.status === "pending" && row.requestedBy !== userId,
    });
  }
  return out;
}

export async function getOrCreateDmThread(args: {
  viewerId: string;
  peerHandle: string;
}): Promise<
  | { ok: true; threadId: string; status: string; created: boolean }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [peer] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, args.peerHandle))
    .limit(1);
  if (!peer) return { ok: false, error: "not_found" };
  if (peer.userId === args.viewerId) return { ok: false, error: "self" };
  if (await isBlocked(args.viewerId, peer.userId)) {
    return { ok: false, error: "blocked" };
  }

  const [a, b] = orderedPair(args.viewerId, peer.userId);
  const [existing] = await db
    .select()
    .from(communityDmThreads)
    .where(
      and(
        eq(communityDmThreads.participantA, a),
        eq(communityDmThreads.participantB, b),
      ),
    )
    .limit(1);

  if (existing) {
    return {
      ok: true,
      threadId: existing.id,
      status: existing.status,
      created: false,
    };
  }

  const peerProfile = await peerView(peer.userId);
  const autoAccept = peerProfile?.verifiedBlue ?? false;

  const [row] = await db
    .insert(communityDmThreads)
    .values({
      participantA: a,
      participantB: b,
      status: autoAccept ? "active" : "pending",
      requestedBy: args.viewerId,
    })
    .returning();

  if (!row) return { ok: false, error: "create_failed" };
  return {
    ok: true,
    threadId: row.id,
    status: row.status,
    created: true,
  };
}

export async function acceptDmThread(args: {
  userId: string;
  threadId: string;
}): Promise<{ ok: boolean; error?: string }> {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(communityDmThreads)
    .where(eq(communityDmThreads.id, args.threadId))
    .limit(1);
  if (!thread) return { ok: false, error: "not_found" };
  if (
    thread.participantA !== args.userId &&
    thread.participantB !== args.userId
  ) {
    return { ok: false, error: "forbidden" };
  }
  await db
    .update(communityDmThreads)
    .set({ status: "active" })
    .where(eq(communityDmThreads.id, args.threadId));
  return { ok: true };
}

export async function listDmMessages(args: {
  userId: string;
  threadId: string;
  before?: string | null;
  limit?: number;
}): Promise<
  | { ok: true; messages: DmMessageView[]; peerTyping: boolean }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [thread] = await db
    .select()
    .from(communityDmThreads)
    .where(eq(communityDmThreads.id, args.threadId))
    .limit(1);
  if (!thread) return { ok: false, error: "not_found" };
  if (
    thread.participantA !== args.userId &&
    thread.participantB !== args.userId
  ) {
    return { ok: false, error: "forbidden" };
  }

  const limit = Math.min(args.limit ?? 40, 80);
  const conds = [eq(communityDmMessages.threadId, args.threadId)];
  if (args.before) {
    const [ref] = await db
      .select({ createdAt: communityDmMessages.createdAt })
      .from(communityDmMessages)
      .where(eq(communityDmMessages.id, args.before))
      .limit(1);
    if (ref) conds.push(lt(communityDmMessages.createdAt, ref.createdAt));
  }

  const rows = await db
    .select()
    .from(communityDmMessages)
    .where(and(...conds))
    .orderBy(desc(communityDmMessages.createdAt))
    .limit(limit);

  const peerId =
    thread.participantA === args.userId
      ? thread.participantB
      : thread.participantA;

  const [peerRead] = await db
    .select({ lastReadAt: communityDmReads.lastReadAt })
    .from(communityDmReads)
    .where(
      and(
        eq(communityDmReads.threadId, args.threadId),
        eq(communityDmReads.userId, peerId),
      ),
    )
    .limit(1);

  const [typing] = await db
    .select()
    .from(communityDmTyping)
    .where(
      and(
        eq(communityDmTyping.threadId, args.threadId),
        eq(communityDmTyping.userId, peerId),
        gt(communityDmTyping.expiresAt, new Date()),
      ),
    )
    .limit(1);

  await db
    .insert(communityDmReads)
    .values({
      threadId: args.threadId,
      userId: args.userId,
      lastReadAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [communityDmReads.threadId, communityDmReads.userId],
      set: { lastReadAt: new Date() },
    });

  const messages: DmMessageView[] = rows.reverse().map((m) => ({
    id: m.id,
    body: m.hidden ? "" : m.body,
    messageType: m.messageType,
    attachmentUrl: m.hidden ? null : m.attachmentUrl,
    attachmentMeta: m.attachmentMeta,
    hidden: m.hidden,
    hiddenReason: m.hiddenReason,
    createdAt: m.createdAt.toISOString(),
    senderId: m.senderId,
    own: m.senderId === args.userId,
    delivered: !!m.deliveredAt,
    read:
      m.senderId === args.userId &&
      !!peerRead?.lastReadAt &&
      m.createdAt <= peerRead.lastReadAt,
  }));

  return { ok: true, messages, peerTyping: !!typing };
}

export async function sendDmMessage(args: {
  userId: string;
  threadId: string;
  body: string;
  messageType?: string;
  attachmentUrl?: string | null;
  attachmentMeta?: Record<string, unknown> | null;
}): Promise<
  | { ok: true; message: DmMessageView }
  | { ok: false; error: string }
> {
  if (!checkDmRateLimit(args.userId)) {
    return { ok: false, error: "rate_limit" };
  }

  const db = getDb();
  const [thread] = await db
    .select()
    .from(communityDmThreads)
    .where(eq(communityDmThreads.id, args.threadId))
    .limit(1);
  if (!thread) return { ok: false, error: "not_found" };
  if (
    thread.participantA !== args.userId &&
    thread.participantB !== args.userId
  ) {
    return { ok: false, error: "forbidden" };
  }
  if (thread.status !== "active") {
    return { ok: false, error: "request_pending" };
  }

  const peerId =
    thread.participantA === args.userId
      ? thread.participantB
      : thread.participantA;
  if (await isBlocked(args.userId, peerId)) {
    return { ok: false, error: "blocked" };
  }

  const mod = moderateDmText(args.body);
  if (!mod.allowed && mod.reason === "empty" && !args.attachmentUrl) {
    return { ok: false, error: "empty" };
  }

  const now = new Date();
  const [row] = await db
    .insert(communityDmMessages)
    .values({
      threadId: args.threadId,
      senderId: args.userId,
      body: mod.sanitizedBody,
      messageType: args.messageType ?? "text",
      attachmentUrl: args.attachmentUrl ?? null,
      attachmentMeta: args.attachmentMeta ?? null,
      hidden: mod.hidden,
      hiddenReason: mod.reason ?? null,
      deliveredAt: now,
    })
    .returning();

  if (!row) return { ok: false, error: "send_failed" };

  const preview = mod.hidden
    ? "[Message masqué]"
    : (args.attachmentUrl ? "[Fichier]" : mod.sanitizedBody).slice(0, 160);

  await db
    .update(communityDmThreads)
    .set({ lastMessageAt: now, lastMessagePreview: preview })
    .where(eq(communityDmThreads.id, args.threadId));

  await touchCommunityPresence(args.userId);

  return {
    ok: true,
    message: {
      id: row.id,
      body: row.hidden ? "" : row.body,
      messageType: row.messageType,
      attachmentUrl: row.hidden ? null : row.attachmentUrl,
      attachmentMeta: row.attachmentMeta,
      hidden: row.hidden,
      hiddenReason: row.hiddenReason,
      createdAt: row.createdAt.toISOString(),
      senderId: row.senderId,
      own: true,
      delivered: true,
      read: false,
    },
  };
}

export async function setDmTyping(args: {
  userId: string;
  threadId: string;
}): Promise<void> {
  const db = getDb();
  const expires = new Date(Date.now() + 5000);
  await db
    .insert(communityDmTyping)
    .values({
      threadId: args.threadId,
      userId: args.userId,
      expiresAt: expires,
    })
    .onConflictDoUpdate({
      target: [communityDmTyping.threadId, communityDmTyping.userId],
      set: { expiresAt: expires },
    });
}

export async function blockDmUser(args: {
  userId: string;
  peerHandle: string;
}): Promise<{ ok: boolean }> {
  const db = getDb();
  const [peer] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, args.peerHandle))
    .limit(1);
  if (!peer || peer.userId === args.userId) return { ok: false };

  try {
    await db.insert(communityUserBlocks).values({
      blockerId: args.userId,
      blockedId: peer.userId,
    });
  } catch {
    /* already blocked */
  }
  return { ok: true };
}

export async function muteDmUser(args: {
  userId: string;
  peerHandle: string;
  hours?: number;
}): Promise<{ ok: boolean }> {
  const db = getDb();
  const [peer] = await db
    .select({ userId: communityUserProfiles.userId })
    .from(communityUserProfiles)
    .where(eq(communityUserProfiles.handle, args.peerHandle))
    .limit(1);
  if (!peer) return { ok: false };

  const until = args.hours
    ? new Date(Date.now() + args.hours * 3600_000)
    : null;

  await db
    .insert(communityDmMutes)
    .values({ userId: args.userId, mutedUserId: peer.userId, untilAt: until })
    .onConflictDoUpdate({
      target: [communityDmMutes.userId, communityDmMutes.mutedUserId],
      set: { untilAt: until },
    });
  return { ok: true };
}

export async function resolveDmAttachmentUrl(
  mediaId: string,
  ownerId: string,
): Promise<string | null> {
  const db = getDb();
  const [m] = await db
    .select({ publicUrl: communityMedia.publicUrl, status: communityMedia.status })
    .from(communityMedia)
    .where(
      and(
        eq(communityMedia.id, mediaId),
        eq(communityMedia.ownerId, ownerId),
        eq(communityMedia.status, "ready"),
      ),
    )
    .limit(1);
  return m?.publicUrl ?? null;
}

export async function listDmReportsForAdmin(): Promise<
  {
    id: string;
    reporterId: string;
    targetId: string;
    reason: string;
    details: string | null;
    createdAt: string;
  }[]
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityReports)
    .where(eq(communityReports.targetType, "dm_thread"))
    .orderBy(desc(communityReports.createdAt))
    .limit(100);
  return rows.map((r) => ({
    id: r.id,
    reporterId: r.reporterId,
    targetId: r.targetId,
    reason: r.reason,
    details: r.details,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listHiddenDmMessagesForAdmin(): Promise<
  {
    id: string;
    threadId: string;
    senderId: string;
    body: string;
    hiddenReason: string | null;
    createdAt: string;
  }[]
> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityDmMessages)
    .where(eq(communityDmMessages.hidden, true))
    .orderBy(desc(communityDmMessages.createdAt))
    .limit(80);
  return rows.map((r) => ({
    id: r.id,
    threadId: r.threadId,
    senderId: r.senderId,
    body: r.body,
    hiddenReason: r.hiddenReason,
    createdAt: r.createdAt.toISOString(),
  }));
}
