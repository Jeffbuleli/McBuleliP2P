import { NextResponse } from "next/server";
import { buildLivePayload } from "@/lib/hackathon/live";

export const dynamic = "force-dynamic";

/** Public live wall payload (kiosk-safe). */
export async function GET() {
  try {
    const payload = await buildLivePayload();
    if ("error" in payload && payload.error) {
      return NextResponse.json(payload, { status: 404 });
    }
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[hackathon/live]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
