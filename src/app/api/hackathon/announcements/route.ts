import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, hackathonAnnouncements } from "@/db";
import { getFeaturedEditionRow } from "@/lib/hackathon/hub";
import { SessionError, requireUserId } from "@/lib/session";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const edition = await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const db = getDb();
    const rows = await db
      .select()
      .from(hackathonAnnouncements)
      .where(eq(hackathonAnnouncements.editionId, edition.id))
      .orderBy(
        desc(hackathonAnnouncements.pinned),
        desc(hackathonAnnouncements.publishedAt),
      )
      .limit(50);
    return NextResponse.json({
      announcements: rows.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        pinned: a.pinned,
        publishedAt: a.publishedAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[hackathon/announcements GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const createSchema = z.object({
  title: z.string().trim().min(2).max(200),
  body: z.string().trim().min(1).max(5000),
  pinned: z.boolean().optional(),
  editionId: z.string().uuid().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    await requireStaffScope("hackathon_stats");
    const json = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }
    const edition =
      parsed.data.editionId
        ? { id: parsed.data.editionId }
        : await getFeaturedEditionRow();
    if (!edition) {
      return NextResponse.json({ error: "no_edition" }, { status: 404 });
    }
    const db = getDb();
    const [row] = await db
      .insert(hackathonAnnouncements)
      .values({
        editionId: edition.id,
        title: parsed.data.title,
        body: parsed.data.body,
        pinned: parsed.data.pinned ?? false,
        createdByUserId: userId,
      })
      .returning();
    return NextResponse.json({ ok: true, announcement: row });
  } catch (e) {
    if (e instanceof SessionError || e instanceof StaffAuthError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    console.error("[hackathon/announcements POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
