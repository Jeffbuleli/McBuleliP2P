import { NextResponse } from "next/server";
import { z } from "zod";
import { inviteUserToEdition } from "@/lib/academy-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  email: z.string().trim().email().max(255),
  programSlug: z.string().max(64).optional(),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ editionSlug: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { editionSlug } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await inviteUserToEdition({
    inviterUserId: userId,
    editionSlug,
    programSlug: parsed.data.programSlug,
    inviteeEmail: parsed.data.email,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, outcome: result.outcome });
}
