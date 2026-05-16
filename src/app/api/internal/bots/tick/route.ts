import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/pool-env";
import { runBotsTick } from "@/lib/bot-tick-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const out = await runBotsTick();
  return NextResponse.json({ ok: true, ...out });
}
