import { NextResponse } from "next/server";
import { enforceIpRateLimit } from "@/lib/api-rate-limit";
import {
  clearMcMeet,
  ensureMcSessionHydrated,
  getMcSession,
} from "@/lib/hackathon/mc-state";

export const dynamic = "force-dynamic";

/** Public kiosk hangup: leave Meet → clear projector meet mode. */
export async function POST(req: Request) {
  const limited = enforceIpRateLimit("hackathon_live_meet_end", req, 20, 60_000);
  if (limited) return limited;

  await ensureMcSessionHydrated();
  const mc = getMcSession();
  if (mc.projectorMode === "meet" || mc.meetSlug) {
    clearMcMeet();
  }
  return NextResponse.json({ ok: true });
}
