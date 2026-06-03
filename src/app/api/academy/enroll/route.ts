import { NextResponse } from "next/server";
import { z } from "zod";
import { enrollInEdition } from "@/lib/academy-service";
import { getSessionUserId } from "@/lib/session";

const bodySchema = z.object({
  editionSlug: z.string().trim().min(1).max(64),
  programSlug: z.string().trim().max(64).optional(),
});

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 400 });
  }

  const result = await enrollInEdition({
    userId,
    editionSlug: parsed.data.editionSlug,
    programSlug: parsed.data.programSlug,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    enrollmentId: result.enrollmentId,
    alreadyEnrolled: result.alreadyEnrolled,
  });
}
