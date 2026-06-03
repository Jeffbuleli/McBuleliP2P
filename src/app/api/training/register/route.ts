import { NextResponse } from "next/server";
import { z } from "zod";
import { isAcademyDbNotReadyError } from "@/lib/academy-db-ready";
import { createTrainingRegistration } from "@/lib/training-registration-service";

const bodySchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(8).max(32),
  city: z.string().trim().max(80).optional(),
  locale: z.enum(["fr", "en"]).default("fr"),
  experienceLevel: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  interests: z
    .array(z.enum(["crypto", "trading", "ia", "p2p"]))
    .max(4)
    .default([]),
  whatsappOptIn: z.boolean().default(true),
  utmSource: z.string().max(64).optional(),
  utmMedium: z.string().max(32).optional(),
  utmCampaign: z.string().max(64).optional(),
});

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const result = await createTrainingRegistration({
      ...parsed.data,
      source: "formation",
    });
    return NextResponse.json({
      ok: true,
      id: result.id,
      duplicate: result.duplicate,
    });
  } catch (e) {
    if (isAcademyDbNotReadyError(e)) {
      return NextResponse.json(
        { error: "academy_db_not_migrated" },
        { status: 503 },
      );
    }
    console.error("[training/register]", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
