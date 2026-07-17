import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, users } from "@/db";
import { communityEnabled } from "@/lib/community/config";

export const dynamic = "force-dynamic";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Serves community list avatars without embedding base64 in JSON payloads.
 * data:image/... stored in users.avatar_url → binary response; http(s) → redirect.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ userId: string }> },
) {
  if (!communityEnabled()) {
    return new NextResponse(null, { status: 503 });
  }

  const { userId } = await ctx.params;
  if (!UUID_RE.test(userId)) {
    return new NextResponse(null, { status: 404 });
  }

  const db = getDb();
  const [row] = await db
    .select({ avatarUrl: users.avatarUrl })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const url = row?.avatarUrl?.trim() ?? "";
  if (!url) return new NextResponse(null, { status: 404 });

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return NextResponse.redirect(url, 302);
  }

  if (url.startsWith("/")) {
    return NextResponse.redirect(new URL(url, _req.url), 302);
  }

  const match = /^data:(image\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    url,
  );
  if (!match) return new NextResponse(null, { status: 404 });

  const mime = match[1]!.toLowerCase();
  if (!mime.startsWith("image/")) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const buf = Buffer.from(match[2]!.replace(/\s/g, ""), "base64");
    if (buf.length < 32 || buf.length > 2_500_000) {
      return new NextResponse(null, { status: 404 });
    }
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(buf.length),
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
