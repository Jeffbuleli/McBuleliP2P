import { and, eq } from "drizzle-orm";
import {
  academyEditionHosts,
  academyEditions,
  academyPrograms,
  getDb,
  users,
} from "@/db";
import {
  canonicalEmailForDedup,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";

export type EditionHostView = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
  createdAt: string;
};

export async function isEditionCoHost(args: {
  userId: string;
  editionId: string;
}): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: academyEditionHosts.id })
    .from(academyEditionHosts)
    .where(
      and(
        eq(academyEditionHosts.editionId, args.editionId),
        eq(academyEditionHosts.userId, args.userId),
      ),
    )
    .limit(1);
  return !!row;
}

export async function listEditionHosts(
  editionSlug: string,
): Promise<EditionHostView[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: academyEditionHosts.id,
      userId: academyEditionHosts.userId,
      role: academyEditionHosts.role,
      createdAt: academyEditionHosts.createdAt,
      email: users.email,
      displayName: users.displayName,
    })
    .from(academyEditionHosts)
    .innerJoin(
      academyEditions,
      eq(academyEditionHosts.editionId, academyEditions.id),
    )
    .innerJoin(users, eq(academyEditionHosts.userId, users.id))
    .where(eq(academyEditions.slug, editionSlug))
    .orderBy(academyEditionHosts.createdAt);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    email: r.email,
    displayName: r.displayName,
    role: r.role,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function addEditionCoHostByEmail(args: {
  editionSlug: string;
  programSlug?: string;
  email: string;
}): Promise<
  | { ok: true; host: EditionHostView }
  | { ok: false; code: string }
> {
  const email = normalizeAuthEmail(args.email);
  if (!email) return { ok: false, code: "invalid_email" };

  const db = getDb();
  const canonical = canonicalEmailForDedup(email);
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.emailCanonical, canonical))
    .limit(1);
  if (!user) return { ok: false, code: "user_not_found" };

  const [edition] = await db
    .select({ id: academyEditions.id })
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
  if (!edition) return { ok: false, code: "academy_edition_not_found" };

  const [existing] = await db
    .select({ id: academyEditionHosts.id })
    .from(academyEditionHosts)
    .where(
      and(
        eq(academyEditionHosts.editionId, edition.id),
        eq(academyEditionHosts.userId, user.id),
      ),
    )
    .limit(1);
  if (existing) {
    return {
      ok: true,
      host: {
        id: existing.id,
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        role: "co_host",
        createdAt: new Date().toISOString(),
      },
    };
  }

  const [row] = await db
    .insert(academyEditionHosts)
    .values({
      editionId: edition.id,
      userId: user.id,
      role: "co_host",
    })
    .returning({
      id: academyEditionHosts.id,
      createdAt: academyEditionHosts.createdAt,
    });

  return {
    ok: true,
    host: {
      id: row.id,
      userId: user.id,
      email: user.email,
      displayName: user.displayName,
      role: "co_host",
      createdAt: row.createdAt.toISOString(),
    },
  };
}

export async function removeEditionCoHost(args: {
  editionSlug: string;
  hostId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .where(eq(academyEditions.slug, args.editionSlug))
    .limit(1);
  if (!edition) return { ok: false, code: "academy_edition_not_found" };

  await db
    .delete(academyEditionHosts)
    .where(
      and(
        eq(academyEditionHosts.id, args.hostId),
        eq(academyEditionHosts.editionId, edition.id),
      ),
    );

  return { ok: true };
}
