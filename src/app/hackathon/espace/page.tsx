import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HackathonEspaceClient } from "@/components/hackathon/hackathon-espace-client";
import { buildHubPayload } from "@/lib/hackathon/hub";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function HackathonEspacePage() {
  const userId = await getSessionUserId();
  if (!userId) {
    const h = await headers();
    const path = h.get("x-pathname") || "/hackathon/espace";
    redirect(`/login?next=${encodeURIComponent(path)}`);
  }

  const payload = await buildHubPayload(userId);
  if ("error" in payload) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-[color:var(--fd-fg)]">
        <h1 className="text-2xl font-bold">Espace participant</h1>
        <p className="mt-4 text-[color:var(--fd-muted)]">
          Aucune édition hackathon active pour le moment.
        </p>
        <a href="/hackathon" className="mt-6 inline-block text-[color:var(--fd-primary)]">
          Retour au hackathon
        </a>
      </main>
    );
  }

  return <HackathonEspaceClient initial={payload} />;
}
