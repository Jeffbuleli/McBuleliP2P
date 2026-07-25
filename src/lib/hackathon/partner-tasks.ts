import { and, asc, eq } from "drizzle-orm";
import { getDb, hackathonPartnerOrgs, hackathonPartnerTasks } from "@/db";
import { profileForSlug } from "@/lib/hackathon/partner-passes";

export async function ensureDefaultPartnerTasks(orgId: string) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(hackathonPartnerOrgs)
    .where(eq(hackathonPartnerOrgs.id, orgId))
    .limit(1);
  if (!org) return [];

  const existing = await db
    .select({ id: hackathonPartnerTasks.id })
    .from(hackathonPartnerTasks)
    .where(eq(hackathonPartnerTasks.orgId, orgId))
    .limit(1);
  if (existing.length) {
    return listPartnerTasks(orgId);
  }

  const profile = profileForSlug(org.slug);
  if (!profile.defaultTasks.length) return [];

  await db.insert(hackathonPartnerTasks).values(
    profile.defaultTasks.map((t, i) => ({
      orgId: org.id,
      editionId: org.editionId,
      title: t.title,
      kind: t.kind,
      status: "todo" as const,
      sortOrder: i,
    })),
  );
  return listPartnerTasks(orgId);
}

export async function listPartnerTasks(orgId: string) {
  const db = getDb();
  return db
    .select()
    .from(hackathonPartnerTasks)
    .where(eq(hackathonPartnerTasks.orgId, orgId))
    .orderBy(asc(hackathonPartnerTasks.sortOrder), asc(hackathonPartnerTasks.createdAt));
}

export async function addPartnerTask(opts: {
  orgId: string;
  editionId: string;
  title: string;
  kind?: string;
  userId?: string | null;
}) {
  const title = opts.title.trim().slice(0, 240);
  if (title.length < 2) throw new Error("invalid_title");
  const db = getDb();
  const [row] = await db
    .insert(hackathonPartnerTasks)
    .values({
      orgId: opts.orgId,
      editionId: opts.editionId,
      title,
      kind: opts.kind ?? "other",
      status: "todo",
      sortOrder: 100,
      createdByUserId: opts.userId ?? null,
    })
    .returning();
  return row;
}

export async function setPartnerTaskStatus(opts: {
  taskId: string;
  orgId: string;
  status: "todo" | "doing" | "done";
}) {
  const db = getDb();
  const [row] = await db
    .update(hackathonPartnerTasks)
    .set({ status: opts.status, updatedAt: new Date() })
    .where(
      and(
        eq(hackathonPartnerTasks.id, opts.taskId),
        eq(hackathonPartnerTasks.orgId, opts.orgId),
      ),
    )
    .returning();
  return row ?? null;
}
