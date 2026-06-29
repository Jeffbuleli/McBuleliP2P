/** Structured metadata for Academy formation posts in Community. */

export type FormationPostMeta = {
  v: 1;
  eventId: string;
  eventSlug: string;
  editionSlug: string;
  programSlug: string;
  editionTitle?: string;
  joinPath: string;
  trainerName: string;
  startDate: string;
  timezone: string;
  title: string;
  description?: string;
  eventStatus?: string;
};

export function isFormationPostMeta(raw: unknown): raw is FormationPostMeta {
  if (!raw || typeof raw !== "object") return false;
  const m = raw as Record<string, unknown>;
  return (
    m.v === 1 &&
    typeof m.eventSlug === "string" &&
    typeof m.joinPath === "string" &&
    typeof m.title === "string"
  );
}

export function parseFormationPostMeta(
  meta: unknown,
  body?: string,
): FormationPostMeta | null {
  if (isFormationPostMeta(meta)) return meta;
  if (body) return parseFormationMetaFromLegacyBody(body);
  return null;
}

/** Fallback for posts created before meta column (plain-text announce). */
export function parseFormationMetaFromLegacyBody(body: string): FormationPostMeta | null {
  if (!body.includes("Participer :")) return null;

  const joinMatch = body.match(/Participer\s*:\s*(\S+)/);
  if (!joinMatch) return null;
  const joinPath = joinMatch[1]!.trim();

  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const title =
    lines.find(
      (l) =>
        l !== "Annonce · Formation" &&
        !l.startsWith("Formateur") &&
        !l.startsWith("Plateforme") &&
        !l.startsWith("Participer"),
    ) ?? "Formation McBuleli";

  const trainerMatch = body.match(/Formateur\s*:\s*(.+)/);
  const editionMatch = joinPath.match(/\/app\/academy\/([^/]+)/);
  const programMatch = joinPath.match(/[?&]program=([^&]+)/);

  return {
    v: 1,
    eventId: "",
    eventSlug: joinPath.split("/live/")[1]?.split("?")[0] ?? "",
    editionSlug: editionMatch?.[1] ?? "",
    programSlug: programMatch?.[1] ? decodeURIComponent(programMatch[1]) : "",
    joinPath,
    trainerName: trainerMatch?.[1]?.trim() ?? "McBuleli",
    startDate: new Date().toISOString(),
    timezone: "Africa/Kinshasa",
    title,
    eventStatus: "PUBLISHED",
  };
}

export function formatFormationDate(
  iso: string,
  timezone: string,
  fr: boolean,
): string {
  return new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: timezone,
  }).format(new Date(iso));
}

/** Event timezone + viewer local time (for cards and links). */
export function formatFormationDateWithUserTz(
  iso: string,
  eventTimezone: string,
  userTimezone: string,
  fr: boolean,
): { eventLocal: string; userLocal: string; userTzLabel: string } {
  const eventLocal = formatFormationDate(iso, eventTimezone, fr);
  const userLocal = new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: userTimezone,
  }).format(new Date(iso));
  const userTzLabel =
    userTimezone === eventTimezone
      ? eventTimezone
      : `${userTimezone} (${fr ? "votre heure" : "your time"})`;
  return { eventLocal, userLocal, userTzLabel };
}

export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Africa/Kinshasa";
  } catch {
    return "Africa/Kinshasa";
  }
}

/** Compact date for Lives « À venir » lists. */
export function formatUpcomingSessionDate(iso: string, fr: boolean): string {
  return new Intl.DateTimeFormat(fr ? "fr-FR" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formationSummaryBody(meta: FormationPostMeta, fr: boolean): string {
  const when = formatFormationDate(meta.startDate, meta.timezone, fr);
  return fr
    ? `${meta.title} - ${when} · ${meta.trainerName} · McBuleli Live`
    : `${meta.title} - ${when} · ${meta.trainerName} · McBuleli Live`;
}
