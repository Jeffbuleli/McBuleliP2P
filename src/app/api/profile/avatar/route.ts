import { eq } from "drizzle-orm";
import { mkdir, unlink, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import path from "path";
import { z } from "zod";
import { getDb, users } from "@/db";
import { assertAvatarImageBuffer } from "@/lib/avatar-image";
import { getSessionUserId } from "@/lib/session";

const urlBody = z.object({
  avatarUrl: z.string().url().max(2000),
});

function extForMime(m: "image/jpeg" | "image/png" | "image/webp") {
  if (m === "image/png") return "png";
  if (m === "image/webp") return "webp";
  return "jpg";
}

async function removeOldLocalFile(avatarUrl: string | null) {
  if (!avatarUrl?.startsWith("/uploads/avatars/")) return;
  const full = path.join(process.cwd(), "public", avatarUrl);
  try {
    await unlink(full);
  } catch {
    // ignore
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [prev] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

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

    await mkdir(path.join(process.cwd(), "public", "uploads", "avatars"), {
      recursive: true,
    });
    await removeOldLocalFile(prev?.avatarUrl ?? null);

    const ext = extForMime(v.mime);
    const rel = `/uploads/avatars/${userId}.${ext}`;
    const full = path.join(process.cwd(), "public", rel);
    await writeFile(full, buf);

    await db.update(users).set({ avatarUrl: rel }).where(eq(users.id, userId));
    return NextResponse.json({ ok: true, avatarUrl: rel });
  }

  const json = await req.json().catch(() => null);
  const parsed = urlBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "avatar_invalid_url" }, { status: 400 });
  }

  await removeOldLocalFile(prev?.avatarUrl ?? null);
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
  const [prev] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  await removeOldLocalFile(prev?.avatarUrl ?? null);
  await db.update(users).set({ avatarUrl: null }).where(eq(users.id, userId));

  return NextResponse.json({ ok: true });
}
