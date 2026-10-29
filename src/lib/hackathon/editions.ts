import { eq } from "drizzle-orm";
import { getDb, hackathonEditions } from "@/db";

export const NOV26_EDITION_SLUG = "nov26";

export async function getHackathonEditionBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  if (!normalized) return null;
  const db = getDb();
  const [row] = await db
    .select()
    .from(hackathonEditions)
    .where(eq(hackathonEditions.slug, normalized))
    .limit(1);
  return row ?? null;
}

export async function getEditionBasePriceUsd(editionId: string): Promise<string> {
  const db = getDb();
  const [row] = await db
    .select({ priceFullUsd: hackathonEditions.priceFullUsd })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.id, editionId))
    .limit(1);
  if (!row?.priceFullUsd) return "100";
  return String(row.priceFullUsd);
}
