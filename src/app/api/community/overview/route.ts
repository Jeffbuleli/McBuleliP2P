import { NextResponse } from "next/server";
import { getCommunityOverview } from "@/lib/community/overview-service";

export const dynamic = "force-dynamic";

export async function GET() {
  const overview = await getCommunityOverview();
  return NextResponse.json(overview);
}
