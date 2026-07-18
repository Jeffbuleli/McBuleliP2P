import { NextResponse } from "next/server";
import { getFeaturedHackathon } from "@/lib/hackathon/service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getFeaturedHackathon();
    if (!data) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (e) {
    console.error("[hackathon/featured]", e);
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
