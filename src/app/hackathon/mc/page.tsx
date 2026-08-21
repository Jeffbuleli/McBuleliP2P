import { McOperatorConsole } from "@/components/hackathon/mc-operator-console";
import { MC_CUES } from "@/lib/hackathon/mc-day";
import { getMcSession, toMcPublic } from "@/lib/hackathon/mc-state";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Console MC · McBuleli AI",
  robots: { index: false, follow: false },
};

export default async function HackathonMcOperatorPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  const session = toMcPublic(getMcSession());
  const controlConfigured = Boolean(
    (process.env.HACKATHON_MC_KEY ?? "").trim(),
  );

  return (
    <div className="min-h-dvh bg-[#050a08] text-white">
      <McOperatorConsole
        initialSession={session}
        cues={MC_CUES}
        initialKey={sp.key?.trim() ?? ""}
        controlConfigured={controlConfigured}
      />
    </div>
  );
}
