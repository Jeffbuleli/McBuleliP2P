import type { LiveJoinMode } from "@/lib/academy-live";

/** Client-safe URL helpers for /app/live/enter (no DB imports). */
export type LiveEnterParams = {
  editionSlug?: string;
  sessionSlug: string;
  programSlug?: string;
  mode: LiveJoinMode;
};

export function buildLiveEnterAppPath(params: LiveEnterParams): string {
  const q = new URLSearchParams({
    session: params.sessionSlug,
    mode: params.mode,
  });
  if (params.editionSlug?.trim()) q.set("edition", params.editionSlug.trim());
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
  if (!session?.trim()) return null;
  return {
    editionSlug: edition?.trim() || undefined,
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
