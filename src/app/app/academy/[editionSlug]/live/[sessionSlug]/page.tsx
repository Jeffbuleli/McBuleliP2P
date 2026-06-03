import { AcademyLiveRoomClient } from "@/components/academy/academy-live-room-client";

export const dynamic = "force-dynamic";

export default async function AcademyLiveRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ editionSlug: string; sessionSlug: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { editionSlug, sessionSlug } = await params;
  const sp = await searchParams;
  const programSlug =
    sp.program?.trim() || "launch-crypto-trading-ia-p2p";

  return (
    <AcademyLiveRoomClient
      editionSlug={editionSlug}
      sessionSlug={sessionSlug}
      programSlug={programSlug}
    />
  );
}
