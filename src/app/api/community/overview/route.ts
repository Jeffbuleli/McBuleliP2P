import { NextResponse } from "next/server";
import { getDefaultCommunityModules } from "@/lib/community/default-modules";
import { getCommunityOverview } from "@/lib/community/overview-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const overview = await getCommunityOverview();
    return NextResponse.json(overview);
  } catch {
    return NextResponse.json({
      enabled: true,
      modules: getDefaultCommunityModules(),
    });
  }
}
