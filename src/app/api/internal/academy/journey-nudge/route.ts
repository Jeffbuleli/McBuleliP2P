import { NextResponse } from "next/server";
import { runAcademyJourneyNudges } from "@/lib/academy-journey-nudge";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = (process.env.CRON_SECRET ?? process.env.MCBULELI_CRON_SECRET ?? "").trim();
  const header = req.headers.get("x-cron-secret")?.trim() ?? "";
  if (!secret || header !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runAcademyJourneyNudges();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[academy/journey-nudge]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
