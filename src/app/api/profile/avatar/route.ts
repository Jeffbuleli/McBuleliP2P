import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, users } from "@/db";
import { assertAvatarImageBuffer } from "@/lib/avatar-image";
import { getSessionUserId } from "@/lib/session";

const urlBody = z.object({
  avatarUrl: z.string().url().max(2000),
});

function dataUrlForMime(m: "image/jpeg" | "image/png" | "image/webp", buf: Buffer) {
  return `data:${m};base64,${buf.toString("base64")}`;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  // Note: Render/serverless often has no persistent disk. We store uploads as data URLs in DB.
  // Existing /uploads/... avatarUrl values will still render if the file exists.

  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File) || file.size < 1) {
      return NextResponse.json({ error: "avatar_no_file" }, { status: 400 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const v = assertAvatarImageBuffer(buf);
    if (!v.ok) {
      return NextResponse.json({ error: v.error }, { status: 400 });
    }

    const dataUrl = dataUrlForMime(v.mime, buf);
    await db.update(users).set({ avatarUrl: dataUrl }).where(eq(users.id, userId));
    return NextResponse.json({ ok: true, avatarUrl: dataUrl });
  }

  const json = await req.json().catch(() => null);
  const parsed = urlBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "avatar_invalid_url" }, { status: 400 });
  }

  await db
    .update(users)
    .set({ avatarUrl: parsed.data.avatarUrl.trim() })
    .where(eq(users.id, userId));

  return NextResponse.json({ ok: true, avatarUrl: parsed.data.avatarUrl.trim() });
}

export async function DELETE() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
