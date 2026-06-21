import { and, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  academyEditions,
  academyEnrollments,
  academyPrograms,
  academySessions,
  academyTrainingEvents,
  getDb,
  users,
} from "@/db";
import { EventStatus } from "@/lib/events/types";
import { ACADEMY_PROGRAM_LIVE_STUDIO } from "@/lib/academy-config";
import { createLiveStudioEdition } from "@/lib/academy-live-service";
import { enrollInEdition } from "@/lib/academy-service";
import { getAppAbsoluteUrl } from "@/lib/app-url";
import {
  webinarSubThemeLabel,
  webinarThemeLabel,
} from "@/lib/academy-webinar-themes";

export type LiveStudioCohortMeta = {
  liveStudio: boolean;
  published: boolean;
  publicSlug: string;
  theme: string;
  subTheme: string;
  coordinates?: { label: string };
  maxParticipants: number;
  purchaseId: string;
};

function newPublicSlug(): string {
  return randomUUID().replace(/-/g, "").slice(0, 10);
}

function hostPseudo(row: {
  displayName: string | null;
  email: string;
}): string {
  const d = row.displayName?.trim();
  if (d) return d.slice(0, 32);
  return row.email.split("@")[0] ?? "Animateur";
}

export async function publishLiveStudioWebinar(args: {
  userId: string;
  titleFr: string;
  startsAt: Date;
  theme: string;
  subTheme: string;
  coordinatesLabel?: string;
  durationMin?: number;
}): Promise<
  | {
      ok: true;
      editionSlug: string;
      sessionSlug: string;
      programSlug: string;
      publicSlug: string;
      publicUrl: string;
    }
  | { ok: false; message: string }
> {
  const created = await createLiveStudioEdition({
    userId: args.userId,
    titleFr: args.titleFr,
    startsAt: args.startsAt,
    durationMin: args.durationMin,
    theme: args.theme,
    subTheme: args.subTheme,
    coordinatesLabel: args.coordinatesLabel,
    publish: true,
    publicSlug: newPublicSlug(),
  });
  if (!created.ok) return created;

  return {
    ok: true,
    editionSlug: created.editionSlug,
    sessionSlug: created.sessionSlug,
    programSlug: created.programSlug,
    publicSlug: created.publicSlug,
    publicUrl: getAppAbsoluteUrl(`/webinar/${created.publicSlug}`),
  };
}

export type PublishedWebinarRow = {
  publicSlug: string;
  editionSlug: string;
  sessionSlug: string;
  programSlug: string;
  title: string;
  theme: string;
  subTheme: string;
  themeLabel: string;
  subThemeLabel: string;
  coordinatesLabel: string | null;
  startsAt: string;
  hostPseudo: string;
  isLiveNow: boolean;
};

export async function listPublishedWebinars(): Promise<PublishedWebinarRow[]> {
  const db = getDb();
  const now = new Date();
  const rows = await db
    .select({
      edition: academyEditions,
      ownerDisplayName: users.displayName,
      ownerEmail: users.email,
      sessionSlug: academySessions.slug,
      sessionStarts: academySessions.startsAt,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .innerJoin(
      academySessions,
      eq(academySessions.editionId, academyEditions.id),
    )
    .innerJoin(users, eq(academyEditions.ownerUserId, users.id))
    .where(
      and(
        eq(academyEditions.source, "live_studio"),
        inArray(academyEditions.status, ["open", "active"]),
        sql`${academyEditions.cohortMeta}->>'published' = 'true'`,
        gt(academyEditions.endsAt, now),
      ),
    )
    .orderBy(academySessions.startsAt);

  const seen = new Set<string>();
  const out: PublishedWebinarRow[] = [];

  for (const r of rows) {
    const meta = r.edition.cohortMeta as LiveStudioCohortMeta | null;
    if (!meta?.publicSlug || seen.has(meta.publicSlug)) continue;
    seen.add(meta.publicSlug);
    const start = r.sessionStarts.getTime();
    const end = r.edition.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
    const t = Date.now();
    out.push({
      publicSlug: meta.publicSlug,
      editionSlug: r.edition.slug,
      sessionSlug: r.sessionSlug,
      programSlug: ACADEMY_PROGRAM_LIVE_STUDIO,
      title: r.edition.titleFr,
      theme: meta.theme,
      subTheme: meta.subTheme,
      themeLabel: webinarThemeLabel(meta.theme),
      subThemeLabel: webinarSubThemeLabel(meta.theme, meta.subTheme),
      coordinatesLabel: meta.coordinates?.label ?? null,
      startsAt: r.sessionStarts.toISOString(),
      hostPseudo: hostPseudo({
        displayName: r.ownerDisplayName,
        email: r.ownerEmail,
      }),
      isLiveNow: t >= start - 20 * 60 * 1000 && t <= end + 20 * 60 * 1000,
    });
  }
  return out;
}

export async function getWebinarByPublicSlug(publicSlug: string) {
  const db = getDb();
  const [row] = await db
    .select({
      edition: academyEditions,
      ownerDisplayName: users.displayName,
      ownerEmail: users.email,
      sessionSlug: academySessions.slug,
      sessionStarts: academySessions.startsAt,
      sessionEnds: academySessions.endsAt,
    })
    .from(academyEditions)
    .innerJoin(
      academySessions,
      eq(academySessions.editionId, academyEditions.id),
    )
    .innerJoin(users, eq(academyEditions.ownerUserId, users.id))
    .where(sql`${academyEditions.cohortMeta}->>'publicSlug' = ${publicSlug}`)
    .limit(1);

  if (!row) return null;
  const meta = row.edition.cohortMeta as LiveStudioCohortMeta | null;
  if (!meta?.published) return null;

  return {
    publicSlug,
    editionSlug: row.edition.slug,
    sessionSlug: row.sessionSlug,
    programSlug: ACADEMY_PROGRAM_LIVE_STUDIO,
    title: row.edition.titleFr,
    theme: meta.theme,
    subTheme: meta.subTheme,
    themeLabel: webinarThemeLabel(meta.theme),
    subThemeLabel: webinarSubThemeLabel(meta.theme, meta.subTheme),
    coordinatesLabel: meta.coordinates?.label ?? null,
    startsAt: row.sessionStarts.toISOString(),
    endsAt: row.sessionEnds?.toISOString() ?? null,
    hostPseudo: hostPseudo({
      displayName: row.ownerDisplayName,
      email: row.ownerEmail,
    }),
    ownerUserId: row.edition.ownerUserId,
  };
}

export async function registerForWebinar(args: {
  userId: string;
  publicSlug: string;
}): Promise<
  | { ok: true; editionSlug: string; sessionSlug: string; programSlug: string }
  | { ok: false; code: string }
> {
  const w = await getWebinarByPublicSlug(args.publicSlug);
  if (!w) return { ok: false, code: "academy_webinar_not_found" };

  const out = await enrollInEdition({
    userId: args.userId,
    editionSlug: w.editionSlug,
    programSlug: w.programSlug,
  });
  if (!out.ok) return { ok: false, code: out.code };

  return {
    ok: true,
    editionSlug: w.editionSlug,
    sessionSlug: w.sessionSlug,
    programSlug: w.programSlug,
  };
}

export async function listOwnerWebinars(userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      edition: academyEditions,
      sessionSlug: academySessions.slug,
      sessionStarts: academySessions.startsAt,
    })
    .from(academyEditions)
    .innerJoin(
      academySessions,
      eq(academySessions.editionId, academyEditions.id),
    )
    .where(
      and(
        eq(academyEditions.ownerUserId, userId),
        eq(academyEditions.source, "live_studio"),
      ),
    )
    .orderBy(desc(academySessions.startsAt));

  const seen = new Set<string>();
  const out: {
    editionSlug: string;
    sessionSlug: string;
    title: string;
    publicSlug: string | null;
    publicUrl: string | null;
    startsAt: string;
    registrationCount: number;
    status: string;
  }[] = [];

  for (const r of rows) {
    if (seen.has(r.edition.id)) continue;
    seen.add(r.edition.id);
    const meta = r.edition.cohortMeta as LiveStudioCohortMeta | null;
    const [countRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(academyEnrollments)
      .where(eq(academyEnrollments.editionId, r.edition.id));
    out.push({
      editionSlug: r.edition.slug,
      sessionSlug: r.sessionSlug,
      title: r.edition.titleFr,
      publicSlug: meta?.publicSlug ?? null,
      publicUrl: meta?.publicSlug
        ? getAppAbsoluteUrl(`/webinar/${meta.publicSlug}`)
        : null,
      startsAt: r.sessionStarts.toISOString(),
      registrationCount: countRow?.n ?? 0,
      status: r.edition.status,
    });
  }
  return out;
}

export async function listWebinarRegistrations(args: {
  ownerUserId: string;
  editionSlug: string;
}): Promise<
  | {
      ok: true;
      rows: {
        enrolledAt: string;
        pseudo: string;
        emailMasked: string;
      }[];
    }
  | { ok: false; code: string }
> {
  const db = getDb();
  const [ed] = await db
    .select({ id: academyEditions.id, ownerUserId: academyEditions.ownerUserId })
    .from(academyEditions)
    .where(eq(academyEditions.slug, args.editionSlug))
    .limit(1);
  if (!ed || ed.ownerUserId !== args.ownerUserId) {
    return { ok: false, code: "academy_webinar_forbidden" };
  }

  const rows = await db
    .select({
      enrolledAt: academyEnrollments.enrolledAt,
      displayName: users.displayName,
      email: users.email,
    })
    .from(academyEnrollments)
    .innerJoin(users, eq(academyEnrollments.userId, users.id))
    .where(eq(academyEnrollments.editionId, ed.id))
    .orderBy(desc(academyEnrollments.enrolledAt));

  return {
    ok: true,
    rows: rows.map((r) => {
      const email = r.email;
      const [local, domain] = email.split("@");
      const masked =
        local.length <= 2
          ? `${local[0] ?? "*"}***@${domain ?? ""}`
          : `${local.slice(0, 2)}***@${domain ?? ""}`;
      return {
        enrolledAt: r.enrolledAt.toISOString(),
        pseudo: hostPseudo({ displayName: r.displayName, email: r.email }),
        emailMasked: masked,
      };
    }),
  };
}

export async function cancelOwnerWebinar(args: {
  userId: string;
  editionSlug: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [row] = await db
    .select({
      id: academyEditions.id,
      startsAt: academyEditions.startsAt,
      cohortMeta: academyEditions.cohortMeta,
    })
    .from(academyEditions)
    .where(
      and(
        eq(academyEditions.slug, args.editionSlug),
        eq(academyEditions.ownerUserId, args.userId),
        eq(academyEditions.source, "live_studio"),
      ),
    )
    .limit(1);

  if (!row) return { ok: false, code: "academy_webinar_not_found" };
  if (row.startsAt && row.startsAt.getTime() <= Date.now()) {
    return { ok: false, code: "academy_webinar_started" };
  }

  const meta = row.cohortMeta as LiveStudioCohortMeta | null;
  await db
    .update(academyEditions)
    .set({
      status: "closed",
      cohortMeta: meta ? { ...meta, published: false } : row.cohortMeta,
    })
    .where(eq(academyEditions.id, row.id));

  await db
    .update(academyTrainingEvents)
    .set({ status: EventStatus.CANCELLED, updatedAt: new Date() })
    .where(eq(academyTrainingEvents.editionId, row.id));

  return { ok: true };
}
