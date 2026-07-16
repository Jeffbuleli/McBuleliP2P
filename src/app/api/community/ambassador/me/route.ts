import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getAmbassadorSummary,
  submitAmbassadorApplication,
} from "@/lib/community/ambassador-service";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

const bodyZ = z.object({
  region: z.string().trim().min(2).max(120),
  motivation: z.string().trim().min(40).max(4000),
  experience: z.string().trim().max(4000).optional(),
  languages: z.string().trim().max(120).optional(),
  charterAccepted: z.literal(true),
});

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getAmbassadorSummary(userId);
    return NextResponse.json(summary);
  } catch (e) {
    console.error("[ambassador/me GET]", e);
    return NextResponse.json(
      { message: "amb_load_failed" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodyZ.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const result = await submitAmbassadorApplication({
    userId,
    region: parsed.data.region,
    motivation: parsed.data.motivation,
    experience: parsed.data.experience,
    languages: parsed.data.languages,
    charterAccepted: parsed.data.charterAccepted,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.code }, { status: 400 });
  }

  return NextResponse.json({ ok: true, application: result.application });
}
