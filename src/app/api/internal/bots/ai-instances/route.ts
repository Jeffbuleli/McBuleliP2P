import { NextResponse } from "next/server";
import { listAiAssistInstances } from "@/lib/bot-ai-instances";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const instances = await listAiAssistInstances();
  return NextResponse.json({ ok: true, instances });
}
