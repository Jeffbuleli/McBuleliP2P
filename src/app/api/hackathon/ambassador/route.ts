import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createAmbassadorPromo,
  getAmbassadorPromoForUser,
} from "@/lib/hackathon/ambassador";
import { getSessionUser } from "@/lib/session-user";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  code: z.string().trim().min(4).max(16),
  displayName: z.string().trim().min(2).max(80),
});

/** Current ambassador promo for the logged-in user (featured edition). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }
  try {
    const promo = await getAmbassadorPromoForUser({ userId: user.id });
    return NextResponse.json({ ok: true, promo });
  } catch (e) {
    console.error("[hackathon/ambassador GET]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

/** Create (or return existing) ambassador promo for the logged-in user. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const out = await createAmbassadorPromo({
      userId: user.id,
      email: user.email,
      code: parsed.data.code,
      displayName: parsed.data.displayName,
    });
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: out.status });
    }
    return NextResponse.json({ ok: true, promo: out.promo });
  } catch (e) {
    console.error("[hackathon/ambassador POST]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
