import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb, hackathonChallenges, hackathonEditions, hackathonTeams } from "@/db";
import { CANONICAL_CHALLENGES } from "@/lib/hackathon/team-formation";

/**
 * Sync edition to the 4 canonical tracks.
 * - Upserts canonical rows (published)
 * - Unpublishes any other challenge slugs
 * - Remaps teams from absorbed legacy slugs onto the new track
 */
export async function ensureChallengesSeeded(editionId: string): Promise<number> {
  const db = getDb();
  const canonicalSlugs = CANONICAL_CHALLENGES.map((c) => c.slug);

  const existing = await db
    .select()
    .from(hackathonChallenges)
    .where(eq(hackathonChallenges.editionId, editionId));
  const bySlug = new Map(existing.map((c) => [c.slug, c]));

  let upserted = 0;
  for (let i = 0; i < CANONICAL_CHALLENGES.length; i++) {
    const c = CANONICAL_CHALLENGES[i];
    const hit = bySlug.get(c.slug);
    if (hit) {
      await db
        .update(hackathonChallenges)
        .set({
          labelFr: c.labelFr,
          labelEn: c.labelEn,
          blurbFr: c.blurbFr,
          blurbEn: c.blurbEn,
          sortOrder: i,
          published: true,
        })
        .where(eq(hackathonChallenges.id, hit.id));
    } else {
      await db.insert(hackathonChallenges).values({
        editionId,
        slug: c.slug,
        labelFr: c.labelFr,
        labelEn: c.labelEn,
        blurbFr: c.blurbFr,
        blurbEn: c.blurbEn,
        sortOrder: i,
        published: true,
      });
      upserted += 1;
    }
  }

  // Unpublish non-canonical (legacy 8-category catalogue).
  const legacy = existing.filter((c) => !canonicalSlugs.includes(c.slug));
  if (legacy.length) {
    await db
      .update(hackathonChallenges)
      .set({ published: false })
      .where(
        and(
          eq(hackathonChallenges.editionId, editionId),
          inArray(
            hackathonChallenges.id,
            legacy.map((c) => c.id),
          ),
        ),
      );
  }

  // Remap team challenges from absorbed legacy slugs → canonical track.
  const refreshed = await db
    .select()
    .from(hackathonChallenges)
    .where(eq(hackathonChallenges.editionId, editionId));
  const idBySlug = new Map(refreshed.map((c) => [c.slug, c.id]));

  for (const track of CANONICAL_CHALLENGES) {
    const targetId = idBySlug.get(track.slug);
    if (!targetId) continue;
    const absorbedLegacy = track.absorbs.filter((s) => s !== track.slug);
    if (!absorbedLegacy.length) continue;
    const sourceIds = absorbedLegacy
      .map((s) => idBySlug.get(s))
      .filter((id): id is string => Boolean(id));
    if (!sourceIds.length) continue;
    await db
      .update(hackathonTeams)
      .set({ challengeId: targetId, updatedAt: new Date() })
      .where(
        and(
          eq(hackathonTeams.editionId, editionId),
          inArray(hackathonTeams.challengeId, sourceIds),
        ),
      );
  }

  return upserted;
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

/** Prefer challenge with fewest teams (soft balance across 4 tracks). */
export async function suggestChallengeId(editionId: string): Promise<string | null> {
  const challenges = await listPublishedChallenges(editionId);
  if (!challenges.length) return null;
  const db = getDb();
  const countMap = new Map<string, number>();
  for (const c of challenges) countMap.set(c.id, 0);
  const allCounts = await db
    .select({
      challengeId: hackathonTeams.challengeId,
      n: sql<number>`count(*)::int`,
    })
    .from(hackathonTeams)
    .where(eq(hackathonTeams.editionId, editionId))
    .groupBy(hackathonTeams.challengeId);
  for (const row of allCounts) {
    if (row.challengeId && countMap.has(row.challengeId)) {
      countMap.set(row.challengeId, row.n);
    }
  }
  let best = challenges[0];
  let bestN = countMap.get(best.id) ?? 0;
  for (const c of challenges) {
    const n = countMap.get(c.id) ?? 0;
    if (n < bestN) {
      best = c;
      bestN = n;
    }
  }
  return best.id;
}
