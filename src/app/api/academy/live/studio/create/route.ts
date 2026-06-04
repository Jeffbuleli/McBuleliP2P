import { NextResponse } from "next/server";
import { z } from "zod";
import { createLiveStudioEdition } from "@/lib/academy-live-service";
import { getSessionUserId } from "@/lib/session";

const bodySchema = z.object({
  titleFr: z.string().trim().min(3).max(160),
  startsAt: z.string().datetime(),
  durationMin: z.number().int().min(30).max(240).optional(),
});

export const dynamic = "force-dynamic";

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

  const result = await createLiveStudioEdition({
    userId,
    titleFr: parsed.data.titleFr,
    startsAt: new Date(parsed.data.startsAt),
    durationMin: parsed.data.durationMin,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json(result);
}
