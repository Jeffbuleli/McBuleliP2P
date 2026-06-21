import { and, eq } from "drizzle-orm";
import {
  academyEditions,
  academyPrograms,
  academyQuizQuestions,
  academyQuizzes,
  academySessions,
  getDb,
} from "@/db";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_EDITION_PRO_Q3,
  ACADEMY_PROGRAM_LAUNCH,
  ACADEMY_PROGRAM_PRO,
  ACADEMY_QUIZ_FUNDAMENTALS,
  ACADEMY_TEST_LIVE_SESSION,
} from "@/lib/academy-config";
import { isAcademyTestLiveEnabled } from "@/lib/academy-session-filters";
import { fmtWalletAmount } from "@/lib/wallet-types";
import { ensureAcademyKnowledgeSeeded } from "@/lib/academy-knowledge";
import { ensureAllEditionEventsSynced } from "@/lib/events/sync-edition-events";
import { LAUNCH_WEBINAR_ISO, TRAINING_END, TRAINING_START } from "@/lib/launch-campaign";

let seedPromise: Promise<void> | null = null;

/**
 * Idempotent seed for the June 2026 launch cohort (prod + dev).
 */
export async function ensureAcademyLaunchSeed(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
    const db = getDb();
    const [existing] = await db
      .select({ id: academyPrograms.id })
      .from(academyPrograms)
      .where(eq(academyPrograms.slug, ACADEMY_PROGRAM_LAUNCH))
      .limit(1);
    if (existing) {
      await seedProProgram(db);
      await ensureAcademyKnowledgeSeeded();
      await ensureAllEditionEventsSynced();
      return;
    }

    const [program] = await db
      .insert(academyPrograms)
      .values({
        slug: ACADEMY_PROGRAM_LAUNCH,
        level: "discovery",
        priceUsdt: null,
        titleFr: "Formation McBuleli — Crypto, Trading, IA & P2P",
        titleEn: "McBuleli Training — Crypto, Trading, AI & P2P",
        summaryFr:
          "Parcours gratuit de lancement : soirée live du 8 juin et sessions du 15 au 30 juin.",
        summaryEn:
          "Free launch track: live evening on 8 June and Saturday sessions 15–30 June.",
        topics: ["crypto", "trading", "ia", "p2p"],
        requiresKyc: false,
        sortOrder: 0,
        published: true,
      })
      .returning({ id: academyPrograms.id });

    const [edition] = await db
      .insert(academyEditions)
      .values({
        programId: program.id,
        slug: ACADEMY_EDITION_JUNE_2026,
        titleFr: "Cohorte juin 2026",
        titleEn: "June 2026 cohort",
        deliveryMode: "online",
        status: "open",
        startsAt: new Date(`${TRAINING_START}T17:30:00.000Z`),
        endsAt: new Date(`${TRAINING_END}T21:00:00.000Z`),
        cohortMeta: { launch: true },
        liveBaseUrl:
          process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() || null,
        tutorEnabled: true,
      })
      .returning({ id: academyEditions.id });

    const sessions: {
      slug: string;
      titleFr: string;
      titleEn: string;
      startsAt: Date;
      endsAt: Date;
      sortOrder: number;
    }[] = [
      {
        slug: "lancement-8-juin",
        titleFr: "Soirée de lancement",
        titleEn: "Launch evening",
        startsAt: new Date(LAUNCH_WEBINAR_ISO),
        endsAt: new Date(new Date(LAUNCH_WEBINAR_ISO).getTime() + 2 * 60 * 60 * 1000),
        sortOrder: 0,
      },
      {
        slug: "samedi-15-juin",
        titleFr: "Session 1 — Crypto & wallet",
        titleEn: "Session 1 — Crypto & wallet",
        startsAt: new Date("2026-06-15T17:30:00.000Z"),
        endsAt: new Date("2026-06-15T19:00:00.000Z"),
        sortOrder: 1,
      },
      {
        slug: "samedi-22-juin",
        titleFr: "Session 2 — Trading & IA",
        titleEn: "Session 2 — Trading & AI",
        startsAt: new Date("2026-06-22T17:30:00.000Z"),
        endsAt: new Date("2026-06-22T19:00:00.000Z"),
        sortOrder: 2,
      },
      {
        slug: "samedi-29-juin",
        titleFr: "Session 3 — P2P & écosystème McBuleli",
        titleEn: "Session 3 — P2P & McBuleli ecosystem",
        startsAt: new Date("2026-06-29T17:30:00.000Z"),
        endsAt: new Date("2026-06-29T19:00:00.000Z"),
        sortOrder: 3,
      },
    ];

    for (const s of sessions) {
      await db.insert(academySessions).values({
        editionId: edition.id,
        slug: s.slug,
        titleFr: s.titleFr,
        titleEn: s.titleEn,
        kind: "live",
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        sortOrder: s.sortOrder,
      });
    }

    const [quiz] = await db
      .insert(academyQuizzes)
      .values({
        editionId: edition.id,
        slug: ACADEMY_QUIZ_FUNDAMENTALS,
        titleFr: "Quiz — Fondamentaux",
        titleEn: "Quiz — Fundamentals",
        passPercent: 70,
        maxAttempts: 3,
      })
      .returning({ id: academyQuizzes.id });

    const questions: {
      sortOrder: number;
      promptFr: string;
      promptEn: string;
      optionsFr: string[];
      optionsEn: string[];
      correctIndex: number;
    }[] = [
      {
        sortOrder: 0,
        promptFr: "USDT sur McBuleli sert surtout à…",
        promptEn: "USDT on McBuleli is mainly used for…",
        optionsFr: [
          "P2P, wallet et services internes",
          "Uniquement les jeux en ligne",
          "Retraits bancaires automatiques RDC",
          "Minage de Bitcoin",
        ],
        optionsEn: [
          "P2P, wallet and in-app services",
          "Online games only",
          "Automatic DRC bank withdrawals",
          "Bitcoin mining",
        ],
        correctIndex: 0,
      },
      {
        sortOrder: 1,
        promptFr: "Le P2P McBuleli utilise principalement…",
        promptEn: "McBuleli P2P primarily uses…",
        optionsFr: [
          "Un escrow interne en USDT",
          "Des virements Western Union obligatoires",
          "Un compte bancaire partagé",
          "Aucune sécurisation",
        ],
        optionsEn: [
          "Internal USDT escrow",
          "Mandatory Western Union transfers",
          "A shared bank account",
          "No protection",
        ],
        correctIndex: 0,
      },
      {
        sortOrder: 2,
        promptFr: "Les Buleli Points (BP) sont…",
        promptEn: "Buleli Points (BP) are…",
        optionsFr: [
          "Des récompenses utilitaires dans l'app",
          "De l'USDT on-chain garanti",
          "Une crypto cotée en bourse",
          "Un prêt automatique",
        ],
        optionsEn: [
          "In-app utility rewards",
          "Guaranteed on-chain USDT",
          "A listed cryptocurrency",
          "An automatic loan",
        ],
        correctIndex: 0,
      },
      {
        sortOrder: 3,
        promptFr: "Pour rejoindre une formation payante future, le paiement se fera via…",
        promptEn: "Future paid courses will be paid via…",
        optionsFr: [
          "Le solde USDT du wallet McBuleli",
          "Google Pay uniquement",
          "Espèces au guichet sans compte",
          "Carte bancaire Visa obligatoire",
        ],
        optionsEn: [
          "McBuleli wallet USDT balance",
          "Google Pay only",
          "Cash at desk without account",
          "Mandatory Visa card",
        ],
        correctIndex: 0,
      },
    ];

    for (const q of questions) {
      await db.insert(academyQuizQuestions).values({
        quizId: quiz.id,
        sortOrder: q.sortOrder,
        promptFr: q.promptFr,
        promptEn: q.promptEn,
        optionsFr: q.optionsFr,
        optionsEn: q.optionsEn,
        correctIndex: q.correctIndex,
      });
    }

    await seedProProgram(db);
    await ensureAcademyKnowledgeSeeded();
    await ensureAcademyTestLiveSession(db);
    await ensureAllEditionEventsSynced();
  })();
  }
  await seedPromise;
  if (isAcademyTestLiveEnabled()) {
    await ensureAcademyTestLiveSession(getDb());
  }
  await ensureAllEditionEventsSynced();
}

/** Live de test — toujours dans la fenêtre « en direct » pour valider le flux McBuleli Meet. */
async function ensureAcademyTestLiveSession(
  db: ReturnType<typeof getDb>,
): Promise<void> {
  const [row] = await db
    .select({
      editionId: academyEditions.id,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyPrograms.slug, ACADEMY_PROGRAM_LAUNCH),
        eq(academyEditions.slug, ACADEMY_EDITION_JUNE_2026),
      ),
    )
    .limit(1);
  if (!row) return;

  const now = Date.now();
  const startsAt = new Date(now - 15 * 60 * 1000);
  const endsAt = new Date(now + 4 * 60 * 60 * 1000);
  const graceMs = 5 * 60 * 1000;

  const [existing] = await db
    .select({
      id: academySessions.id,
      endsAt: academySessions.endsAt,
    })
    .from(academySessions)
    .where(
      and(
        eq(academySessions.editionId, row.editionId),
        eq(academySessions.slug, ACADEMY_TEST_LIVE_SESSION),
      ),
    )
    .limit(1);

  if (existing) {
    const ended =
      !existing.endsAt || existing.endsAt.getTime() < now - graceMs;
    if (ended) {
      // Nouveau cycle test : fenêtre fraîche, gate host réinitialisée
      await db
        .update(academySessions)
        .set({ startsAt, endsAt, liveStartedAt: null })
        .where(eq(academySessions.id, existing.id));
    } else {
      // Fenêtre active : prolonger la fin seulement — ne pas effacer live_started_at
      const currentEnd = existing.endsAt!.getTime();
      if (endsAt.getTime() > currentEnd) {
        await db
          .update(academySessions)
          .set({ endsAt })
          .where(eq(academySessions.id, existing.id));
      }
    }
    return;
  }

  await db.insert(academySessions).values({
    editionId: row.editionId,
    slug: ACADEMY_TEST_LIVE_SESSION,
    titleFr: "Test live McBuleli Live",
    titleEn: "McBuleli Live test",
    kind: "live",
    startsAt,
    endsAt,
    sortOrder: 99,
  });
}

async function seedProProgram(
  db: ReturnType<typeof import("@/db").getDb>,
): Promise<void> {
  const [existing] = await db
    .select({ id: academyPrograms.id })
    .from(academyPrograms)
    .where(eq(academyPrograms.slug, ACADEMY_PROGRAM_PRO))
    .limit(1);
  if (existing) {
    await db
      .update(academyEditions)
      .set({ status: "open" })
      .where(eq(academyEditions.slug, ACADEMY_EDITION_PRO_Q3));
    return;
  }

  const [program] = await db
    .insert(academyPrograms)
    .values({
      slug: ACADEMY_PROGRAM_PRO,
      level: "pro",
      priceUsdt: fmtWalletAmount(49),
      titleFr: "Crypto & Trading — niveau Pro",
      titleEn: "Crypto & Trading — Pro level",
      summaryFr:
        "Formation approfondie payante en USDT (wallet McBuleli). KYC requis.",
      summaryEn:
        "In-depth paid training in USDT (McBuleli wallet). KYC required.",
      topics: ["crypto", "trading", "ia"],
      requiresKyc: true,
      sortOrder: 10,
      published: true,
    })
    .returning({ id: academyPrograms.id });

  const [edition] = await db
    .insert(academyEditions)
    .values({
      programId: program.id,
      slug: ACADEMY_EDITION_PRO_Q3,
      titleFr: "Cohorte Pro Q3 2026",
      titleEn: "Pro cohort Q3 2026",
      deliveryMode: "online",
      status: "open",
      startsAt: new Date("2026-09-01T17:30:00.000Z"),
      endsAt: new Date("2026-09-30T21:00:00.000Z"),
      tutorEnabled: true,
    })
    .returning({ id: academyEditions.id });

  const proSessions = [
    {
      slug: "pro-kickoff",
      titleFr: "Kick-off Pro",
      titleEn: "Pro kick-off",
      startsAt: new Date("2026-09-06T17:30:00.000Z"),
      endsAt: new Date("2026-09-06T19:00:00.000Z"),
      sortOrder: 0,
    },
    {
      slug: "pro-trading-lab",
      titleFr: "Lab trading",
      titleEn: "Trading lab",
      startsAt: new Date("2026-09-20T17:30:00.000Z"),
      endsAt: new Date("2026-09-20T19:00:00.000Z"),
      sortOrder: 1,
    },
  ];
  for (const s of proSessions) {
    await db.insert(academySessions).values({
      editionId: edition.id,
      slug: s.slug,
      titleFr: s.titleFr,
      titleEn: s.titleEn,
      kind: "live",
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      sortOrder: s.sortOrder,
    });
  }
}
