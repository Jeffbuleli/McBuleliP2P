/** Canonical Academy URLs - single source for hub, cohort, live, events. */

export type AcademySessionLink = {
  editionSlug: string;
  programSlug: string;
  sessionSlug: string;
  isLiveNow?: boolean;
};

export function academyProgramQuery(programSlug: string): string {
  return `?program=${encodeURIComponent(programSlug)}`;
}

export function academyCohortHref(
  editionSlug: string,
  programSlug: string,
): string {
  return `/app/academy/${editionSlug}${academyProgramQuery(programSlug)}`;
}

export function academyLiveHref(
  editionSlug: string,
  sessionSlug: string,
  programSlug: string,
): string {
  return `/app/academy/${editionSlug}/live/${sessionSlug}${academyProgramQuery(programSlug)}`;
}

/** Continuer / rejoindre une session - toujours la salle live companion. */
export function academySessionContinueHref(session: AcademySessionLink): string {
  return academyLiveHref(
    session.editionSlug,
    session.sessionSlug,
    session.programSlug,
  );
}
