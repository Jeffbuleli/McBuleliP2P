import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { AcademyLiveEnterRedirect } from "@/components/academy/academy-live-enter-redirect";
import { getDb, users } from "@/db";
import {
  ensurePartnerMeet,
  partnerMeetLandingPath,
  resolvePartnerMeetJoinUrl,
} from "@/lib/partner-meet";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export default async function PartnerMeetHostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meet = await ensurePartnerMeet(slug);
  if (!meet) redirect("/app");

  const hostPath = `/meet/${meet.slug}/host`;
  const user = await getSessionUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(hostPath)}`);
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
    "McBuleli Host";

  const out = await resolvePartnerMeetJoinUrl({
    userId: user.id,
    userEmail: profile?.email ?? user.email,
    displayName,
    appRole: user.role,
    meet,
    mode: "host",
  });

  if (out.ok) {
    return <AcademyLiveEnterRedirect url={out.url} />;
  }

  const message =
    out.code === "partner_meet_host_forbidden"
      ? "Seul l'hôte (CEO) ou le staff peut ouvrir la salle en mode hôte."
      : out.code === "partner_meet_closed"
        ? "Ce RDV est clos."
        : "Impossible d'ouvrir la salle hôte.";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="text-lg font-bold text-[#1e4d2b]">McBuleli Meet · Hôte</h1>
      <p className="text-sm text-[#5c6b60]">{message}</p>
      <Link
        href={partnerMeetLandingPath(meet.slug)}
        className="inline-flex rounded-xl bg-[#1e4d2b] px-4 py-3 text-sm font-bold text-white"
      >
        Retour à l&apos;invitation
      </Link>
    </div>
  );
}
