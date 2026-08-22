import { NextResponse } from "next/server";
import { buildAwardsLeaderboard } from "@/lib/hackathon/awards";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const awards = await buildAwardsLeaderboard(edition.id);
    return NextResponse.json({ ok: true, awards });
  } catch (e) {
    console.error("[hackathon/awards GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
