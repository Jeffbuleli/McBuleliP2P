import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcademyLiveEnterRedirect } from "@/components/academy/academy-live-enter-redirect";
import { getDb, users } from "@/db";
import { getEventLiveUrlForUser } from "@/lib/events/events-service";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function EventLiveJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const modeRaw = Array.isArray(sp.mode) ? sp.mode[0] : sp.mode;
  const mode =
    modeRaw === "host" || modeRaw === "audio" ? modeRaw : "learner";

  const livePath = `/app/events/${slug}/live${mode !== "learner" ? `?mode=${mode}` : ""}`;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(livePath)}`);
  }

  const [profile] = await getDb()
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const displayName =
    profile?.displayName?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email.split("@")[0] ||
    "McBuleli";

  const out = await getEventLiveUrlForUser({
    idOrSlug: slug,
    userId: user.id,
    displayName,
    appRole: user.role,
    mode,
  });

  if (out.ok) {
    return <AcademyLiveEnterRedirect url={out.url} />;
  }

  const message =
    out.code === "event_not_enrolled"
      ? "Inscrivez-vous à cet événement pour rejoindre le live."
      : out.code === "event_live_unavailable"
        ? "La salle live n'est pas encore disponible."
        : "Impossible d'ouvrir le live.";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="text-lg font-bold text-[#305f33]">McBuleli Live</h1>
      <p className="text-sm text-[#57534e]">{message}</p>
      <Link
        href={`/app/events/${slug}`}
        className="inline-flex rounded-xl bg-[#305f33] px-4 py-3 text-sm font-bold text-white"
      >
        Retour à l&apos;événement
      </Link>
    </div>
  );
}
