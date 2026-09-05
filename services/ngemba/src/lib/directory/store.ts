import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import { db } from "@/db";
import { ngReferrals } from "@/db/schema";
import type { ReferralMatch } from "@/lib/directory/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "referrals.json");

type StoredReferral = {
  id: string;
  sessionId: string;
  createdAt: string;
  matches: ReferralMatch[];
  unmatched: string[];
};

const g = globalThis as unknown as {
  __ngembaReferrals?: Map<string, StoredReferral>;
  __ngembaReferralsLoaded?: boolean;
};

function ensureLoaded(): Map<string, StoredReferral> {
  if (!g.__ngembaReferrals) g.__ngembaReferrals = new Map();
  if (g.__ngembaReferralsLoaded) return g.__ngembaReferrals;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as StoredReferral[];
      for (const row of raw) g.__ngembaReferrals.set(row.sessionId, row);
    }
  } catch {
    // empty
  }
  g.__ngembaReferralsLoaded = true;
  return g.__ngembaReferrals;
}

function persist() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const rows = [...ensureLoaded().values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
    fs.writeFileSync(
      DATA_FILE,
      JSON.stringify(rows.slice(0, 2000), null, 2),
      "utf8",
    );
  } catch (err) {
    console.warn("[ngemba] referrals persist failed", err);
  }
}

async function pgInsert(sessionId: string, matches: ReferralMatch[]) {
  if (!db || !matches.length) return;
  try {
    // Only if session exists in PG - ignore FK errors
    for (const m of matches) {
      await db.insert(ngReferrals).values({
        id: randomUUID(),
        sessionId,
        serviceCode: m.serviceCode,
        serviceId: m.serviceId,
        organizationId: null,
        partnerSeedId: m.partnerSeedId,
        rank: m.rank,
        score: m.score,
        reason: m.reason,
        scope: m.scope,
      });
    }
  } catch {
    // Session may still be JSON-only
  }
}

export function saveReferrals(input: {
  sessionId: string;
  matches: ReferralMatch[];
  unmatched: string[];
}): StoredReferral {
  const row: StoredReferral = {
    id: randomUUID(),
    sessionId: input.sessionId,
    createdAt: new Date().toISOString(),
    matches: input.matches,
    unmatched: input.unmatched,
  };
  ensureLoaded().set(input.sessionId, row);
  persist();
  void pgInsert(input.sessionId, input.matches);
  return row;
}

export function getReferrals(sessionId: string): StoredReferral | null {
  return ensureLoaded().get(sessionId) ?? null;
}
