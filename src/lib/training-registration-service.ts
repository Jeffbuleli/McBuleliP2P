import { count, desc, eq } from "drizzle-orm";
import { getDb, trainingRegistrations } from "@/db";
import { assertAcademyDbReady } from "@/lib/academy-db-ready";

export type TrainingRegistrationInput = {
  fullName: string;
  email: string;
  phone: string;
  city?: string;
  locale: "fr" | "en";
  experienceLevel?: string;
  interests: string[];
  whatsappOptIn: boolean;
  source?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
};

export async function createTrainingRegistration(
  input: TrainingRegistrationInput,
): Promise<{ id: string; duplicate: boolean }> {
  await assertAcademyDbReady();
  const db = getDb();
  const email = input.email.trim().toLowerCase();

  const [existing] = await db
    .select({ id: trainingRegistrations.id })
    .from(trainingRegistrations)
    .where(eq(trainingRegistrations.email, email))
    .limit(1);

  if (existing) {
    return { id: existing.id, duplicate: true };
  }

  const [row] = await db
    .insert(trainingRegistrations)
    .values({
      fullName: input.fullName.trim(),
      email,
      phone: input.phone.trim(),
      city: input.city?.trim() || null,
      locale: input.locale,
      experienceLevel: input.experienceLevel || null,
      interests: input.interests,
      whatsappOptIn: input.whatsappOptIn,
      source: input.source ?? "formation",
      utmSource: input.utmSource || null,
      utmMedium: input.utmMedium || null,
      utmCampaign: input.utmCampaign || null,
    })
    .returning({ id: trainingRegistrations.id });

  return { id: row.id, duplicate: false };
}

export async function listTrainingRegistrations(args: {
  limit: number;
  offset: number;
}) {
  const db = getDb();
  const rows = await db
    .select()
    .from(trainingRegistrations)
    .orderBy(desc(trainingRegistrations.createdAt))
    .limit(args.limit)
    .offset(args.offset);

  const [countRow] = await db
    .select({ n: count() })
    .from(trainingRegistrations);

  return { rows, total: Number(countRow?.n ?? 0) };
}
