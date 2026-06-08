import { NextResponse } from "next/server";
import { z } from "zod";
import { createCommunityImageMedia } from "@/lib/community/media-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const postZ = z.object({
  dataUrl: z.string().min(30).max(900_000),
  mime: z.string().min(3).max(64),
  sizeBytes: z.number().int().min(1).max(10_000_000),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const result = await createCommunityImageMedia({
    ownerId: userId,
    dataUrl: parsed.data.dataUrl,
    mimeType: parsed.data.mime,
    sizeBytes: parsed.data.sizeBytes,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ id: result.id, url: result.url });
}
