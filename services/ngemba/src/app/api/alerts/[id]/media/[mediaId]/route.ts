import { NextResponse } from "next/server";
import { readCitizenToken } from "@/lib/citizen/token";
import { getNgembaObject } from "@/lib/media/r2";
import { mediaPublicUrl, readMediaFile } from "@/lib/media/store";
import { getSession } from "@/lib/sessions/store";
import { requireOpsAuth } from "@/lib/ops/auth";

type Ctx = { params: Promise<{ id: string; mediaId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { id, mediaId } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const attachment = session.media.find((m) => m.id === mediaId);
  if (!attachment) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requireOpsAuth(req);
  const isOps = !(auth instanceof NextResponse);
  const citizen = await readCitizenToken();
  const isCitizen = Boolean(citizen && session.citizenToken === citizen);

  if (!isOps && !isCitizen) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const publicUrl = mediaPublicUrl(attachment);
  if (publicUrl) {
    return NextResponse.redirect(publicUrl, 302);
  }

  let buf = readMediaFile(id, attachment);
  if (!buf && attachment.storageKey) {
    buf = (await getNgembaObject(attachment.storageKey)) ?? null;
  }
  if (!buf) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": attachment.mimeType,
      "Cache-Control": "private, no-store",
      "Content-Disposition": `inline; filename="${attachment.fileName.replace(/"/g, "")}"`,
    },
  });
}
