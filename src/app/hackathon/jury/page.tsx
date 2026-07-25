import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HackathonJuryClient } from "@/components/hackathon/hackathon-jury-client";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HackathonJuryPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    const h = await headers();
    const path = h.get("x-pathname") || "/hackathon/jury";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }
  return <HackathonJuryClient />;
}
