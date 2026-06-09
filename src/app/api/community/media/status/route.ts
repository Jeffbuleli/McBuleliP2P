import { NextResponse } from "next/server";
import { communityEnabled } from "@/lib/community/config";
import {
  communityR2Configured,
  getCommunityR2Config,
} from "@/lib/community/media-r2";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Vérifie où les médias Community sont stockés (R2 backend integration). */
export async function GET() {
  if (!communityEnabled()) {
    return NextResponse.json({ error: "community_disabled" }, { status: 503 });
  }

  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configured = communityR2Configured();
  const cfg = getCommunityR2Config();

  return NextResponse.json({
    storage: "cloudflare_r2",
    integration: "backend_s3_api",
    description:
      "Render uploads via S3 API; files are served from COMMUNITY_R2_PUBLIC_BASE_URL (not the main site DNS).",
    r2Configured: configured,
    bucket: cfg?.bucket ?? null,
    publicBaseUrl: cfg?.publicBaseUrl ?? null,
    objectKeyPrefix: "mcbuleli-community/",
    checks: {
      accountId: Boolean(process.env.COMMUNITY_R2_ACCOUNT_ID),
      bucket: Boolean(process.env.COMMUNITY_R2_BUCKET),
      accessKey: Boolean(process.env.COMMUNITY_R2_ACCESS_KEY_ID),
      secretKey: Boolean(process.env.COMMUNITY_R2_SECRET_ACCESS_KEY),
      publicBaseUrl: Boolean(process.env.COMMUNITY_R2_PUBLIC_BASE_URL),
    },
    customDomainRequired:
      "Map cdn.mcbuleli.org (or pub-xxx.r2.dev) as R2 public URL — separate from mcbuleli.org → Render.",
  });
}
