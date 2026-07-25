import { NextResponse } from "next/server";
import {
  ensurePartnerOrgsSeeded,
  listPartnerOrgsPublic,
} from "@/lib/hackathon/partner-chat";

export const dynamic = "force-dynamic";

/** Public org list for gate dropdown + status badges (no emails). */
export async function GET() {
  try {
    const editionId = await ensurePartnerOrgsSeeded();
    if (!editionId) {
      return NextResponse.json({ orgs: [], editionId: null });
    }
    const orgs = await listPartnerOrgsPublic(editionId);
    return NextResponse.json({ editionId, orgs });
  } catch (e) {
    console.error("[hackathon/chat/orgs]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
