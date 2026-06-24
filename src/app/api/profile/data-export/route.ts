import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { buildProfileDataExport } from "@/lib/profile-data-export";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const data = await buildProfileDataExport(userId);
    if (!data) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="mcbuleli-profile-${userId.slice(0, 8)}.json"`,
      },
    });
  } catch (err) {
    console.error("[profile/data-export]", err);
    return NextResponse.json({ error: "profile_load_failed" }, { status: 500 });
  }
}
