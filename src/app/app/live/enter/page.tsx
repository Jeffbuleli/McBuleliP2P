import Link from "next/link";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { AcademyLiveEnterRedirect } from "@/components/academy/academy-live-enter-redirect";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";
import { getDb, users } from "@/db";
import {
  buildLiveEnterAppPath,
  parseLiveEnterSearchParams,
  resolveLiveEnterForUser,
} from "@/lib/academy-live-enter";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/i18n/messages";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function LiveEnterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = parseLiveEnterSearchParams(sp);
  const locale = await getLocale();
  const dict = getDictionary(locale);

  if (!params) {
    redirect("/app/academy");
  }

  const enterPath = buildLiveEnterAppPath(params);
  const user = await getSessionUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(enterPath)}`);
  }

  const db = getDb();
  const [profile] = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);
  const displayName =
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email.split("@")[0] ||
    "McBuleli";
  const out = await resolveLiveEnterForUser({
    userId: user.id,
    displayName,
    appRole: user.role,
    params,
  });

  if (out.ok) {
    return <AcademyLiveEnterRedirect url={out.url} />;
  }

  const errKey =
    out.code === "academy_live_waiting_host"
      ? "academy_live_waiting_host"
      : out.code === "academy_live_host_requires_payment"
        ? "academy_live_host_requires_payment"
        : out.code === "academy_edition_not_found"
          ? "academy_live_session_not_found"
          : "academy_live_enroll_required";

  const waitingHost = out.code === "academy_live_waiting_host";

  return (
    <div className={`mx-auto max-w-md space-y-4 px-4 py-8 ${academyCls.root}`}>
      <div className="text-center">
        <span
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${
            waitingHost ? "bg-[#e8f3ee] ring-2 ring-[#305f33]/20" : "bg-[#305f33]"
          }`}
        >
          <AcademyIcon
            name={waitingHost ? "calendar" : "live"}
            className={`h-7 w-7 ${waitingHost ? "text-[#305f33]" : "!text-white"}`}
          />
        </span>
        {!waitingHost ? (
          <h1 className="mt-3 text-lg font-black text-[color:var(--fd-text)]">
            {dict.academy_live_enter_title}
          </h1>
        ) : null}
        <p
          className={`mt-3 font-extrabold ${
            waitingHost ? "text-sm text-[#305f33]" : "text-sm text-[color:var(--fd-muted)]"
          }`}
        >
          {dict[errKey as keyof typeof dict] as string}
        </p>
      </div>
      <Link
        href={out.companionHref}
        className="flex w-full justify-center rounded-xl bg-[#305f33] px-4 py-3 text-sm font-extrabold text-white"
      >
        {waitingHost
          ? `${dict.academy_live_companion_here} →`
          : `${dict.academy_live_enter_academy_btn} →`}
      </Link>
      <Link
        href="/app/academy/studio"
        className="block text-center text-xs font-bold text-[#305f33] underline"
      >
        {dict.academy_live_studio_hub}
      </Link>
    </div>
  );
}
