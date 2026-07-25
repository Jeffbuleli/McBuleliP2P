import { and, asc, eq } from "drizzle-orm";
import { getDb, hackathonChallenges, hackathonEditions } from "@/db";
import { challengeCategories } from "@/lib/hackathon/landing-copy";

/** Ensure edition has the standard challenge catalogue. Idempotent. */
export async function ensureChallengesSeeded(editionId: string): Promise<number> {
  const db = getDb();
  const existing = await db
    .select({ id: hackathonChallenges.id })
    .from(hackathonChallenges)
    .where(eq(hackathonChallenges.editionId, editionId))
    .limit(1);
  if (existing.length) return 0;

  const fr = challengeCategories(true);
  const en = challengeCategories(false);
  const enById = new Map(en.map((c) => [c.id, c]));

  await db.insert(hackathonChallenges).values(
    fr.map((c, i) => ({
      editionId,
      slug: c.id,
      labelFr: c.label,
      labelEn: enById.get(c.id)?.label ?? c.label,
      blurbFr: c.blurb,
      blurbEn: enById.get(c.id)?.blurb ?? c.blurb,
      sortOrder: i,
      published: true,
    })),
  );
  return fr.length;
}

export async function listPublishedChallenges(editionId: string) {
  await ensureChallengesSeeded(editionId);
  const db = getDb();
  return db
    .select()
    .from(hackathonChallenges)
    .where(
      and(
        eq(hackathonChallenges.editionId, editionId),
        eq(hackathonChallenges.published, true),
      ),
    )
    .orderBy(asc(hackathonChallenges.sortOrder));
}

export async function seedChallengesForFeaturedEdition(): Promise<string | null> {
  const db = getDb();
  const [featured] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.featured, true))
    .limit(1);
  if (!featured) return null;
  await ensureChallengesSeeded(featured.id);
  return featured.id;
}
