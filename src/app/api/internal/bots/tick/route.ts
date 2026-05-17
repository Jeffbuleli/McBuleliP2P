import { NextResponse } from "next/server";
import { recordBotCronRun } from "@/lib/bot-cron-health";
import { getCronSecret } from "@/lib/pool-env";
import { runBotsTick } from "@/lib/bot-tick-service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const out = await runBotsTick();
  if (!out.locked) {
    await recordBotCronRun({
      instances: out.instances,
      executed: out.executed,
      skipped: out.skipped,
      errors: out.errors,
    });
  }
  return NextResponse.json({ ok: true, ...out });
}
