import { and, eq } from "drizzle-orm";
import {
  academyEditions,
  academyPrograms,
  academySessions,
  getDb,
} from "@/db";
import { resolveGatedLiveJoinUrl } from "@/lib/academy-live-join";
import type { LiveJoinMode } from "@/lib/academy-live";
import type { UserRoleType } from "@/lib/roles";

export type LiveEnterParams = {
  editionSlug: string;
  sessionSlug: string;
  programSlug?: string;
  mode: LiveJoinMode;
};

export function buildLiveEnterAppPath(params: LiveEnterParams): string {
  const q = new URLSearchParams({
    edition: params.editionSlug,
    session: params.sessionSlug,
    mode: params.mode,
  });
  if (params.programSlug) q.set("program", params.programSlug);
  return `/app/live/enter?${q}`;
}

export function parseLiveEnterSearchParams(
  sp: Record<string, string | string[] | undefined>,
): LiveEnterParams | null {
  const edition =
    pick(sp, "edition") ?? pick(sp, "editionSlug") ?? undefined;
  const session =
    pick(sp, "session") ?? pick(sp, "sessionSlug") ?? pick(sp, "room") ?? undefined;
  const program = pick(sp, "program") ?? pick(sp, "programSlug");
  const modeRaw = pick(sp, "mode") ?? "learner";
  const mode =
    modeRaw === "host" || modeRaw === "audio" ? modeRaw : "learner";
  if (!edition?.trim() || !session?.trim()) return null;
  return {
    editionSlug: edition.trim(),
    sessionSlug: session.trim().replace(/^\//, ""),
    programSlug: program?.trim() || undefined,
    mode,
  };
}

function pick(
  sp: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const v = sp[key];
  if (Array.isArray(v)) return v[0];
  return v;
}

export async function resolveLiveEnterForUser(args: {
  userId: string;
  displayName: string;
  appRole: UserRoleType | null | undefined;
  params: LiveEnterParams;
}): Promise<
  | { ok: true; url: string; companionHref: string }
  | { ok: false; code: string; companionHref: string }
> {
  const db = getDb();
  const [row] = await db
    .select({
      editionId: academyEditions.id,
      editionSlug: academyEditions.slug,
      liveBaseUrl: academyEditions.liveBaseUrl,
      programSlug: academyPrograms.slug,
      sessionSlug: academySessions.slug,
      sessionLiveUrl: academySessions.liveUrl,
      sessionTitleFr: academySessions.titleFr,
    })
    .from(academySessions)
    .innerJoin(academyEditions, eq(academySessions.editionId, academyEditions.id))
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.params.programSlug
        ? and(
            eq(academyEditions.slug, args.params.editionSlug),
            eq(academyPrograms.slug, args.params.programSlug),
            eq(academySessions.slug, args.params.sessionSlug),
          )
        : and(
            eq(academyEditions.slug, args.params.editionSlug),
            eq(academySessions.slug, args.params.sessionSlug),
          ),
    )
    .limit(1);

  const companionQ = new URLSearchParams();
  if (args.params.programSlug) {
    companionQ.set("program", args.params.programSlug);
  }
  const companionHref = row
    ? `/app/academy/${row.editionSlug}/live/${row.sessionSlug}?${companionQ}`
    : `/app/academy`;

  if (!row) {
    return { ok: false, code: "academy_edition_not_found", companionHref };
  }

  const out = await resolveGatedLiveJoinUrl({
    userId: args.userId,
    displayName: args.displayName,
    editionId: row.editionId,
    editionSlug: row.editionSlug,
    sessionSlug: row.sessionSlug,
    sessionLiveUrl: row.sessionLiveUrl,
    liveBaseUrl: row.liveBaseUrl,
    sessionTitle: row.sessionTitleFr,
    mode: args.params.mode,
    appRole: args.appRole,
  });

  if (!out.ok) {
    return { ok: false, code: out.code, companionHref };
  }

  return { ok: true, url: out.url, companionHref };
}
