import { notFound, redirect } from "next/navigation";
import { HackathonScanRemote } from "@/components/hackathon/hackathon-scan-remote";
import { loginHrefFor } from "@/lib/auth-return-path";
import { eventDayIndex } from "@/lib/hackathon/access";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { mcControlAuthorized } from "@/lib/hackathon/mc-auth";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Télécommande Porte · McBuleli",
  robots: { index: false, follow: false },
};

export default async function HackathonScanPage() {
  const user = await getSessionUser();
  const isStaff =
    user &&
    (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AGENT);
  if (!isStaff) {
    redirect(loginHrefFor("/hackathon/scan"));
  }

  if (!(await mcControlAuthorized())) {
    redirect("/admin");
  }

  const edition = await getFeaturedEditionRow();
  if (!edition) notFound();

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <HackathonScanRemote
        initialEdition={{
          id: edition.id,
          nameFr: edition.nameFr,
          dayIndex: eventDayIndex(edition),
        }}
      />
    </div>
  );
}
