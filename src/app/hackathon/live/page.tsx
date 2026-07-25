import { HackathonLiveClient } from "@/components/hackathon/hackathon-live-client";
import { buildLivePayload } from "@/lib/hackathon/live";

export const dynamic = "force-dynamic";

export default async function HackathonLivePage() {
  const payload = await buildLivePayload();
  if ("error" in payload && payload.error) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16 text-[color:var(--fd-fg)]">
        <h1 className="text-3xl font-bold">Live</h1>
        <p className="mt-4 text-[color:var(--fd-muted)]">Aucune édition active.</p>
      </main>
    );
  }
  return <HackathonLiveClient initial={payload} />;
}
