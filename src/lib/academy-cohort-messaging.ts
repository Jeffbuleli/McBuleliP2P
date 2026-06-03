import { and, asc, desc, eq } from "drizzle-orm";
import {
  academyCohortMessages,
  academyEditions,
  academyEnrollments,
  academyPrograms,
  getDb,
  users,
} from "@/db";
import { p2pDisplayName } from "@/lib/p2p-display";

export async function assertEnrolledInEdition(args: {
  userId: string;
  editionId: string;
}): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, args.editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);
  return !!row;
}

export async function listCohortMessages(args: {
  editionId: string;
  userId: string;
  limit?: number;
  before?: string;
}): Promise<
  | { ok: true; messages: CohortMessageDto[] }
  | { ok: false; code: string }
> {
  const enrolled = await assertEnrolledInEdition({
    userId: args.userId,
    editionId: args.editionId,
  });
  if (!enrolled) return { ok: false, code: "academy_not_enrolled" };

  const db = getDb();
  const limit = Math.min(80, Math.max(10, args.limit ?? 40));

  const rows = await db
    .select({
      id: academyCohortMessages.id,
      senderUserId: academyCohortMessages.senderUserId,
      body: academyCohortMessages.body,
      messageType: academyCohortMessages.messageType,
      meta: academyCohortMessages.meta,
      createdAt: academyCohortMessages.createdAt,
      email: users.email,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    })
    .from(academyCohortMessages)
    .leftJoin(users, eq(academyCohortMessages.senderUserId, users.id))
    .where(eq(academyCohortMessages.editionId, args.editionId))
    .orderBy(desc(academyCohortMessages.createdAt))
    .limit(limit);

  const ordered = [...rows].reverse();

  return {
    ok: true,
    messages: ordered.map((r) => ({
      id: r.id,
      senderUserId: r.senderUserId,
      senderDisplay: r.senderUserId
        ? p2pDisplayName({
            email: r.email ?? "",
            displayName: r.displayName,
            avatarUrl: r.avatarUrl,
            piUsername: null,
          })
        : "McBuleli",
      senderAvatarUrl: r.avatarUrl,
      body: r.body,
      messageType: r.messageType,
      meta: r.meta,
      createdAt: r.createdAt.toISOString(),
      own: r.senderUserId === args.userId,
    })),
  };
}

export type CohortMessageDto = {
  id: string;
  senderUserId: string | null;
  senderDisplay: string;
  senderAvatarUrl: string | null;
  body: string;
  messageType: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
  own: boolean;
};

export async function postCohortMessage(args: {
  editionId: string;
  userId: string;
  body: string;
  messageType?: "chat" | "announcement";
  isStaff?: boolean;
}): Promise<{ ok: true; id: string } | { ok: false; code: string }> {
  const body = args.body.trim();
  if (body.length < 1 || body.length > 2000) {
    return { ok: false, code: "academy_chat_empty" };
  }

  const db = getDb();
  const type = args.messageType ?? "chat";

  if (type === "announcement" && !args.isStaff) {
    return { ok: false, code: "academy_forbidden" };
  }

  if (type === "chat") {
    const enrolled = await assertEnrolledInEdition({
      userId: args.userId,
      editionId: args.editionId,
    });
    if (!enrolled) return { ok: false, code: "academy_not_enrolled" };
  }

  const [row] = await db
    .insert(academyCohortMessages)
    .values({
      editionId: args.editionId,
      senderUserId: args.userId,
      body,
      messageType: type,
    })
    .returning({ id: academyCohortMessages.id });

  return { ok: true, id: row.id };
}

export async function resolveEditionIdBySlug(args: {
  editionSlug: string;
  programSlug?: string;
}): Promise<string | null> {
  const db = getDb();
  const rows = await db
    .select({ editionId: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.programSlug
        ? and(
            eq(academyEditions.slug, args.editionSlug),
            eq(academyPrograms.slug, args.programSlug),
          )
        : eq(academyEditions.slug, args.editionSlug),
    )
    .limit(1);
  return rows[0]?.editionId ?? null;
}
