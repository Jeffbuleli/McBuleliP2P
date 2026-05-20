import { NextResponse } from "next/server";
import { purgeExpiredSupportAttachments } from "@/lib/support-attachments";
import { getCronSecret } from "@/lib/pool-env";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const purged = await purgeExpiredSupportAttachments(200);
  return NextResponse.json({ ok: true, purged });
}
