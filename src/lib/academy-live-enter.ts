import { resolveGatedLiveJoinUrl } from "@/lib/academy-live-join";
import type { LiveEnterParams } from "@/lib/academy-live-enter-path";
import { resolveLiveSessionRecord } from "@/lib/academy-live-resolve";
import type { UserRoleType } from "@/lib/roles";

export type { LiveEnterParams } from "@/lib/academy-live-enter-path";
export {
  buildLiveEnterAppPath,
  parseLiveEnterSearchParams,
} from "@/lib/academy-live-enter-path";

export async function resolveLiveEnterForUser(args: {
  userId: string;
  displayName: string;
  appRole: UserRoleType | null | undefined;
  params: LiveEnterParams;
}): Promise<
  | { ok: true; url: string; companionHref: string }
  | { ok: false; code: string; companionHref: string }
> {
  const row = await resolveLiveSessionRecord({
    editionSlug: args.params.editionSlug,
    programSlug: args.params.programSlug,
    sessionSlug: args.params.sessionSlug,
  });

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
    sessionTitle: row.sessionTitle,
    programSlug: args.params.programSlug,
    mode: args.params.mode,
    appRole: args.appRole,
  });

  if (!out.ok) {
    return { ok: false, code: out.code, companionHref };
  }

  return { ok: true, url: out.url, companionHref };
}
