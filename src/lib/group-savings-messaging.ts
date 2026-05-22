import { desc, eq } from "drizzle-orm";
import { getDb, groupMessages, users } from "@/db";
import { notifyGroupMembers } from "@/lib/group-savings-notifications";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";
import { p2pDisplayName } from "@/lib/p2p-display";

export type GroupMessageType =
  | "chat"
  | "system"
  | "proof"
  | "payout_decision"
  | "loan_decision"
  | "closure_decision";

export type PayoutDecisionMeta = {
  requestId: string;
  amountUsdt: number;
  beneficiaryUserId: string;
  beneficiaryDisplay: string;
  initiatedByUserId: string;
  initiatedByDisplay: string;
  approvers: { userId: string; displayName: string }[];
  executedAt: string;
};

export type LoanDecisionMeta = {
  loanId: string;
  amountUsdt: number;
  borrowerUserId: string;
  borrowerDisplay: string;
  initiatedByUserId: string;
  initiatedByDisplay: string;
  approvers: { userId: string; displayName: string }[];
  executedAt: string;
  kind: "disbursed";
};

export type ClosureDecisionMeta = {
  requestId: string;
  cycleNumber: number;
  distributableUsdt: number;
  finalShareValueUsdt: number;
  totalShares: number;
  initiatedByUserId: string;
  initiatedByDisplay: string;
  approvers: { userId: string; displayName: string }[];
  executedAt: string;
};

export type MessageReaction = { userId: string; emoji: string };

const IMAGE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const REACTION_EMOJIS = new Set(["👍", "❤️", "😂", "🎉", "👏"]);

function parseReactions(meta: Record<string, unknown> | null): MessageReaction[] {
  if (!meta || !Array.isArray(meta.reactions)) return [];
  const out: MessageReaction[] = [];
  for (const r of meta.reactions) {
    if (r && typeof r === "object" && "userId" in r && "emoji" in r) {
      const userId = String((r as MessageReaction).userId);
      const emoji = String((r as MessageReaction).emoji);
      if (userId && REACTION_EMOJIS.has(emoji)) out.push({ userId, emoji });
    }
  }
  return out;
}

function attachmentVisible(
  url: string | null,
  expiresAt: Date | null,
): string | null {
  if (!url) return null;
  if (!expiresAt) return url;
  if (expiresAt.getTime() < Date.now()) return null;
  return url;
}

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
        senderDisplayName: string;
        senderAvatarUrl: string | null;
        body: string;
        messageType: string;
        attachmentUrl: string | null;
        attachmentExpiresAt: string | null;
        reactions: MessageReaction[];
        meta: Record<string, unknown> | null;
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
      senderDisplayName: users.displayName,
      senderAvatarUrl: users.avatarUrl,
      senderPiUsername: users.piUsername,
      body: groupMessages.body,
      messageType: groupMessages.messageType,
      attachmentUrl: groupMessages.attachmentUrl,
      attachmentExpiresAt: groupMessages.attachmentExpiresAt,
      meta: groupMessages.meta,
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
        senderDisplayName: p2pDisplayName({
          email: r.senderEmail,
          displayName: r.senderDisplayName,
          avatarUrl: r.senderAvatarUrl,
          piUsername: r.senderPiUsername,
        }),
        senderAvatarUrl: r.senderAvatarUrl,
        body: r.body,
        messageType: r.messageType,
        attachmentUrl: attachmentVisible(r.attachmentUrl, r.attachmentExpiresAt),
        attachmentExpiresAt: r.attachmentExpiresAt
          ? r.attachmentExpiresAt.toISOString()
          : null,
        reactions: parseReactions(r.meta as Record<string, unknown> | null),
        meta: (r.meta as Record<string, unknown> | null) ?? null,
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
  mentionUserIds?: string[];
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
  const attachmentExpiresAt = args.attachmentUrl
    ? new Date(Date.now() + IMAGE_TTL_MS)
    : null;

  const db = getDb();
  const [row] = await db
    .insert(groupMessages)
    .values({
      groupId: args.groupId,
      senderUserId: args.userId,
      body: body || "—",
      messageType,
      attachmentUrl: args.attachmentUrl ?? null,
      attachmentExpiresAt,
      meta:
        args.mentionUserIds && args.mentionUserIds.length > 0
          ? { mentions: args.mentionUserIds, reactions: [] }
          : { reactions: [] },
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

export async function toggleGroupMessageReaction(args: {
  groupId: string;
  userId: string;
  messageId: string;
  emoji: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const m = await getMyMembershipOrNull({ groupId: args.groupId, userId: args.userId });
  if (!m || m.status !== "approved") {
    return { ok: false, message: "group_forbidden" };
  }
  if (!REACTION_EMOJIS.has(args.emoji)) {
    return { ok: false, message: "group_invalid_body" };
  }

  const db = getDb();
  const [msg] = await db
    .select({ id: groupMessages.id, meta: groupMessages.meta })
    .from(groupMessages)
    .where(eq(groupMessages.id, args.messageId))
    .limit(1);
  if (!msg) return { ok: false, message: "group_not_found" };

  const meta = (msg.meta as Record<string, unknown> | null) ?? {};
  let reactions = parseReactions(meta);
  const idx = reactions.findIndex((r) => r.userId === args.userId);
  if (idx >= 0 && reactions[idx]!.emoji === args.emoji) {
    reactions = reactions.filter((_, i) => i !== idx);
  } else if (idx >= 0) {
    reactions[idx] = { userId: args.userId, emoji: args.emoji };
  } else {
    reactions.push({ userId: args.userId, emoji: args.emoji });
  }

  await db
    .update(groupMessages)
    .set({ meta: { ...meta, reactions } })
    .where(eq(groupMessages.id, args.messageId));

  return { ok: true };
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

export async function insertGroupPayoutDecisionMessage(args: {
  groupId: string;
  actorUserId: string;
  meta: PayoutDecisionMeta;
}): Promise<void> {
  try {
    const db = getDb();
    const m = args.meta;
    const approverLine = m.approvers.map((a) => a.displayName).join(", ");
    const body = [
      "PAYOUT_EXECUTED",
      m.amountUsdt.toFixed(2),
      m.beneficiaryDisplay,
      m.initiatedByDisplay,
      approverLine,
      m.executedAt,
    ].join("|");

    await db.insert(groupMessages).values({
      groupId: args.groupId,
      senderUserId: args.actorUserId,
      body: body.slice(0, 4000),
      messageType: "payout_decision",
      attachmentUrl: null,
      meta: m as unknown as Record<string, unknown>,
    });

    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      payload: {
        groupId: args.groupId,
        messageId: "",
        preview: body.slice(0, 80),
        senderEmail: "",
        messageType: "payout_decision",
        humanPreview: `Payout ${m.amountUsdt.toFixed(2)} USDT → ${m.beneficiaryDisplay}`,
      },
    });
  } catch {
    // Migration may not be applied yet.
  }
}

export async function insertGroupLoanDecisionMessage(args: {
  groupId: string;
  actorUserId: string;
  meta: LoanDecisionMeta;
}): Promise<void> {
  try {
    const db = getDb();
    const m = args.meta;
    const body = [
      "LOAN_DISBURSED",
      m.amountUsdt.toFixed(2),
      m.borrowerDisplay,
      m.initiatedByDisplay,
      m.approvers.map((a) => a.displayName).join(", "),
      m.executedAt,
    ].join("|");

    await db.insert(groupMessages).values({
      groupId: args.groupId,
      senderUserId: args.actorUserId,
      body: body.slice(0, 4000),
      messageType: "loan_decision",
      attachmentUrl: null,
      meta: m as unknown as Record<string, unknown>,
    });

    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      payload: {
        groupId: args.groupId,
        messageId: "",
        preview: body.slice(0, 80),
        senderEmail: "",
        messageType: "loan_decision",
        humanPreview: `Loan ${m.amountUsdt.toFixed(2)} USDT → ${m.borrowerDisplay}`,
      },
    });
  } catch {
    // Migration may not be applied yet.
  }
}

export async function insertGroupClosureDecisionMessage(args: {
  groupId: string;
  actorUserId: string;
  meta: ClosureDecisionMeta;
}): Promise<void> {
  try {
    const db = getDb();
    const m = args.meta;
    const body = [
      "CYCLE_CLOSED",
      String(m.cycleNumber),
      m.distributableUsdt.toFixed(2),
      m.finalShareValueUsdt.toFixed(4),
      m.initiatedByDisplay,
      m.approvers.map((a) => a.displayName).join(", "),
      m.executedAt,
    ].join("|");

    await db.insert(groupMessages).values({
      groupId: args.groupId,
      senderUserId: args.actorUserId,
      body: body.slice(0, 4000),
      messageType: "closure_decision",
      attachmentUrl: null,
      meta: m as unknown as Record<string, unknown>,
    });

    await notifyGroupMembers({
      groupId: args.groupId,
      kind: "group_message",
      payload: {
        groupId: args.groupId,
        messageId: "",
        preview: body.slice(0, 80),
        senderEmail: "",
        messageType: "closure_decision",
      },
    });
  } catch {
    // Migration may not be applied yet.
  }
}
