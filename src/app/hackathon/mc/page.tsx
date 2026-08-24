import { redirect } from "next/navigation";
import { McOperatorConsole } from "@/components/hackathon/mc-operator-console";
import { loginHrefFor } from "@/lib/auth-return-path";
import { mcControlAuthorized } from "@/lib/hackathon/mc-auth";
import {
  ensureMcSessionHydrated,
  getMcSession,
  toMcPublic,
} from "@/lib/hackathon/mc-state";
import { getMcSlideRemoteSummary } from "@/lib/hackathon/slides/session";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Télécommande Live · McBuleli",
  robots: { index: false, follow: false },
};

export default async function HackathonMcOperatorPage() {
  const user = await getSessionUser();
  const isStaff =
    user &&
    (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.AGENT);
  if (!isStaff) {
    redirect(loginHrefFor("/hackathon/mc"));
  }

  if (!(await mcControlAuthorized())) {
    redirect("/admin");
  }

  await ensureMcSessionHydrated();
  const session = toMcPublic(getMcSession());
  const slides = await getMcSlideRemoteSummary();

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <McOperatorConsole initialSession={session} initialSlides={slides} />
    </div>
  );
}
