/**
 * Upsert hackathon edition for mcbuleli.com/nov26 (formation en ligne, 50 USD).
 *
 *   npx tsx scripts/seed-nov26-formation.ts
 */
import { eq } from "drizzle-orm";
import { getDb, hackathonEditions } from "../src/db";
import { emptyStats, defaultProgram } from "../src/lib/hackathon/constants";
import { NOV26_EDITION_SLUG } from "../src/lib/hackathon/editions";

async function main() {
  const db = getDb();
  const slug = NOV26_EDITION_SLUG;

  const program = [
    {
      day: 1,
      titleFr: "27 nov. · Fondations & Vibe Coding",
      titleEn: "Nov 27 · Foundations & Vibe Coding",
      itemsFr: [
        "Esprit Vibe Coding · Cursor, Claude, Codex",
        "Cadrage projet app IA",
        "Premier squelette",
      ],
      itemsEn: [
        "Vibe Coding · Cursor, Claude, Codex",
        "Scoping your AI app",
        "First skeleton",
      ],
    },
    {
      day: 2,
      titleFr: "28 nov. · Construction",
      titleEn: "Nov 28 · Build",
      itemsFr: [
        "Itération IA · debug & UX",
        "Intégrations (auth, API)",
        "Préparation démo",
      ],
      itemsEn: [
        "AI iteration · debug & UX",
        "Integrations (auth, APIs)",
        "Demo prep",
      ],
    },
    {
      day: 3,
      titleFr: "29 nov. · Finalisation & démo",
      titleEn: "Nov 29 · Polish & demo",
      itemsFr: [
        "Finition & documentation",
        "Démo & Q&A",
        "Suite (Academy, portfolio)",
      ],
      itemsEn: [
        "Polish & docs",
        "Demo & Q&A",
        "Next steps (Academy, portfolio)",
      ],
    },
  ];

  const payload = {
    slug,
    nameFr: "Formation IA · Nov 2026",
    nameEn: "AI Training · Nov 2026",
    taglineFr: "Créez une app avec Cursor, Claude et Codex — en ligne.",
    taglineEn: "Build an app with Cursor, Claude, and Codex — online.",
    startDate: new Date("2026-11-27T18:30:00.000Z"),
    endDate: new Date("2026-11-29T21:30:00.000Z"),
    venue: "Google Meet",
    city: "En ligne",
    country: "CD",
    maxSeats: 120,
    priceDay1Usd: "50",
    priceFullUsd: "50",
    status: "open" as const,
    featured: false,
    program: program.length ? program : defaultProgram(),
    prizes: [],
    gallery: [],
    displayStats: emptyStats(),
    coverImage: "/events/nov26/affiche.png",
    softMaxTeams: 12,
    targetTeamSize: 1,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ id: hackathonEditions.id })
    .from(hackathonEditions)
    .where(eq(hackathonEditions.slug, slug))
    .limit(1);

  if (existing) {
    await db
      .update(hackathonEditions)
      .set(payload)
      .where(eq(hackathonEditions.id, existing.id));
    console.log(`Updated edition ${slug} (${existing.id})`);
  } else {
    const [inserted] = await db
      .insert(hackathonEditions)
      .values({ ...payload, createdAt: new Date() })
      .returning({ id: hackathonEditions.id });
    console.log(`Created edition ${slug} (${inserted?.id})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
