import { and, asc, eq } from "drizzle-orm";
import {
  academyEditions,
  academyModuleProgress,
  academyModules,
  academyPrograms,
  getDb,
} from "@/db";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_EDITION_PRO_Q3,
  ACADEMY_PROGRAM_LAUNCH,
  ACADEMY_PROGRAM_PRO,
} from "@/lib/academy-config";
import { assertEnrolledInEdition } from "@/lib/academy-cohort-messaging";
import { logAcademyLearningEvent } from "@/lib/academy-learning-events";
import type { Locale } from "@/i18n/locale";
import { ensureAcademyLaunchSeed } from "@/lib/academy-seed";

export type AcademyModuleView = {
  id: string;
  slug: string;
  sortOrder: number;
  title: string;
  summary: string;
  body: string;
  visualKey: string;
  ecosystemHref: string | null;
  unlocked: boolean;
  completed: boolean;
};

function pickLocale<T extends { titleFr: string; titleEn: string }>(
  row: T & { summaryFr: string; summaryEn: string; bodyFr: string; bodyEn: string },
  locale: Locale,
): { title: string; summary: string; body: string } {
  return locale === "fr"
    ? { title: row.titleFr, summary: row.summaryFr, body: row.bodyFr }
    : { title: row.titleEn, summary: row.summaryEn, body: row.bodyEn };
}

export async function ensureAcademyModulesSeed(): Promise<void> {
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyEditions.slug, ACADEMY_EDITION_JUNE_2026),
        eq(academyPrograms.slug, ACADEMY_PROGRAM_LAUNCH),
      ),
    )
    .limit(1);
  if (!edition) return;

  const [existing] = await db
    .select({ id: academyModules.id })
    .from(academyModules)
    .where(eq(academyModules.editionId, edition.id))
    .limit(1);
  if (existing) return;

  const modules = [
    {
      slug: "crypto",
      sortOrder: 0,
      titleFr: "Crypto & wallet",
      titleEn: "Crypto & wallet",
      summaryFr: "USDT stable, wallet McBuleli, dépôt/retrait.",
      summaryEn: "Stable USDT, McBuleli wallet, deposit & withdraw.",
      bodyFr:
        "Le crypto utile commence par **USDT** (≈ 1 $). Sur McBuleli : adresse perso, frais visibles, alertes email. Pas de Bitcoin roulette — on apprend à **sécuriser** et **tester petit**.",
      bodyEn:
        "Useful crypto starts with **USDT** (≈ $1). On McBuleli: your address, clear fees, email alerts. Skip Bitcoin roulette — learn to **secure** and **start small**.",
      visualKey: "crypto",
      unlockAfterSlug: null as string | null,
      ecosystemHref: "/app/wallet",
    },
    {
      slug: "trading",
      sortOrder: 1,
      titleFr: "Bases trading",
      titleEn: "Trading basics",
      summaryFr: "Lire un graphique, gérer le risque.",
      summaryEn: "Read a chart, manage risk.",
      bodyFr:
        "Trader ≠ parier. Règles : **taille de position**, stop mental, journal simple. McBuleli propose démo/bots plus tard — d'abord comprendre pourquoi les prix bougent.",
      bodyEn:
        "Trading ≠ gambling. Rules: **position size**, mental stop, simple journal. McBuleli offers demo/bots later — first understand why prices move.",
      visualKey: "trading",
      unlockAfterSlug: "crypto",
      ecosystemHref: "/app/trade",
    },
    {
      slug: "ia",
      sortOrder: 2,
      titleFr: "IA pratique",
      titleEn: "Practical AI",
      summaryFr: "Outils IA + tuteur Academy.",
      summaryEn: "AI tools + Academy tutor.",
      bodyFr:
        "L'IA aide à **résumer** et **expliquer**, pas à garantir des gains. Utilise le tuteur cohorte (syllabus only) et l'assistant McBuleli pour des questions ciblées.",
      bodyEn:
        "AI helps **summarize** and **explain**, not guarantee profits. Use the cohort tutor (syllabus only) and McBuleli assistant for focused questions.",
      visualKey: "ia",
      unlockAfterSlug: "trading",
      ecosystemHref: "/app/academy",
    },
    {
      slug: "p2p",
      sortOrder: 3,
      titleFr: "P2P protégé",
      titleEn: "Protected P2P",
      summaryFr: "Escrow, Mobile Money, bonnes pratiques.",
      summaryEn: "Escrow, mobile money, best practices.",
      bodyFr:
        "En P2P McBuleli les fonds restent en **séquestre** jusqu'à confirmation. Ne payez jamais hors plateforme. Vérifiez contrepartie et limites KYC.",
      bodyEn:
        "On McBuleli P2P funds stay in **escrow** until confirmed. Never pay off-platform. Check counterparty and KYC limits.",
      visualKey: "p2p",
      unlockAfterSlug: "ia",
      ecosystemHref: "/app/p2p",
    },
  ];

  for (const m of modules) {
    await db.insert(academyModules).values({
      editionId: edition.id,
      slug: m.slug,
      sortOrder: m.sortOrder,
      titleFr: m.titleFr,
      titleEn: m.titleEn,
      summaryFr: m.summaryFr,
      summaryEn: m.summaryEn,
      bodyFr: m.bodyFr,
      bodyEn: m.bodyEn,
      visualKey: m.visualKey,
      unlockAfterSlug: m.unlockAfterSlug,
      ecosystemHref: m.ecosystemHref,
    });
  }
}

/** Pro cohort micro-lessons (P3). */
export async function ensureAcademyProModulesSeed(): Promise<void> {
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyEditions.slug, ACADEMY_EDITION_PRO_Q3),
        eq(academyPrograms.slug, ACADEMY_PROGRAM_PRO),
      ),
    )
    .limit(1);
  if (!edition) return;

  const [existing] = await db
    .select({ id: academyModules.id })
    .from(academyModules)
    .where(eq(academyModules.editionId, edition.id))
    .limit(1);
  if (existing) return;

  const modules = [
    {
      slug: "risk",
      sortOrder: 0,
      titleFr: "Gestion du risque",
      titleEn: "Risk management",
      summaryFr: "Taille de position, drawdown, journal.",
      summaryEn: "Position size, drawdown, trading journal.",
      bodyFr:
        "En Pro on formalise : **1–2 %** du capital par trade, stop-loss planifié, pas de revenge trading. Le wallet McBuleli sert à **capitaliser** — pas à doubler en une nuit.",
      bodyEn:
        "Pro level means rules: **1–2 %** per trade, planned stop-loss, no revenge trading. McBuleli wallet is for **building capital** — not doubling overnight.",
      visualKey: "trading",
      unlockAfterSlug: null as string | null,
      ecosystemHref: "/app/trade",
    },
    {
      slug: "strategies",
      sortOrder: 1,
      titleFr: "Stratégies & bots",
      titleEn: "Strategies & bots",
      summaryFr: "Signaux, backtest léger, bots McBuleli.",
      summaryEn: "Signals, light backtest, McBuleli bots.",
      bodyFr:
        "Comprendre **pourquoi** une stratégie marche avant d'automatiser. Bots = discipline, pas magie. Tester en petit sur démo ou micro-montants.",
      bodyEn:
        "Understand **why** a strategy works before automating. Bots = discipline, not magic. Test small on demo or micro size.",
      visualKey: "ia",
      unlockAfterSlug: "risk",
      ecosystemHref: "/app/trade/bots",
    },
    {
      slug: "pro-p2p",
      sortOrder: 2,
      titleFr: "P2P volume & conformité",
      titleEn: "P2P volume & compliance",
      summaryFr: "Limites KYC, escrow, litiges.",
      summaryEn: "KYC limits, escrow, disputes.",
      bodyFr:
        "Volume P2P = **KYC** et réputation. Toujours escrow McBuleli, preuves claires, pas de hors-plateforme. En cas de litige : support + chat cohorte.",
      bodyEn:
        "P2P volume needs **KYC** and reputation. Always McBuleli escrow, clear proof, never off-platform. Disputes: support + cohort chat.",
      visualKey: "p2p",
      unlockAfterSlug: "strategies",
      ecosystemHref: "/app/p2p",
    },
  ];

  for (const m of modules) {
    await db.insert(academyModules).values({
      editionId: edition.id,
      slug: m.slug,
      sortOrder: m.sortOrder,
      titleFr: m.titleFr,
      titleEn: m.titleEn,
      summaryFr: m.summaryFr,
      summaryEn: m.summaryEn,
      bodyFr: m.bodyFr,
      bodyEn: m.bodyEn,
      visualKey: m.visualKey,
      unlockAfterSlug: m.unlockAfterSlug,
      ecosystemHref: m.ecosystemHref,
    });
  }
}

export async function listEditionModules(args: {
  userId: string;
  editionSlug: string;
  programSlug?: string;
  locale: Locale;
}): Promise<
  | { ok: true; modules: AcademyModuleView[] }
  | { ok: false; code: string }
> {
  await ensureAcademyModulesSeed();
  const db = getDb();

  const [row] = await db
    .select({ editionId: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.programSlug
        ? and(
            eq(academyEditions.slug, args.editionSlug),
            eq(academyPrograms.slug, args.programSlug),
          )
        : eq(academyEditions.slug, args.editionSlug),
    )
    .limit(1);
  if (!row) return { ok: false, code: "academy_edition_not_found" };

  const enrolled = await assertEnrolledInEdition({
    userId: args.userId,
    editionId: row.editionId,
  });
  if (!enrolled) return { ok: false, code: "academy_not_enrolled" };

  const rows = await db
    .select()
    .from(academyModules)
    .where(eq(academyModules.editionId, row.editionId))
    .orderBy(asc(academyModules.sortOrder));

  const progress = await db
    .select({ moduleId: academyModuleProgress.moduleId })
    .from(academyModuleProgress)
    .where(eq(academyModuleProgress.userId, args.userId));

  const completedSet = new Set(progress.map((p) => p.moduleId));
  const completedSlug = new Set(
    rows.filter((r) => completedSet.has(r.id)).map((r) => r.slug),
  );

  const modules: AcademyModuleView[] = rows.map((r) => {
    const loc = pickLocale(r, args.locale);
    const unlocked =
      !r.unlockAfterSlug || completedSlug.has(r.unlockAfterSlug);
    return {
      id: r.id,
      slug: r.slug,
      sortOrder: r.sortOrder,
      title: loc.title,
      summary: loc.summary,
      body: loc.body,
      visualKey: r.visualKey,
      ecosystemHref: r.ecosystemHref,
      unlocked,
      completed: completedSet.has(r.id),
    };
  });

  return { ok: true, modules };
}

export async function getEditionModule(args: {
  userId: string;
  editionSlug: string;
  moduleSlug: string;
  programSlug?: string;
  locale: Locale;
}): Promise<
  | { ok: true; module: AcademyModuleView; editionId: string; programSlug: string }
  | { ok: false; code: string }
> {
  const list = await listEditionModules({
    userId: args.userId,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
    locale: args.locale,
  });
  if (!list.ok) return list;
  const mod = list.modules.find((m) => m.slug === args.moduleSlug);
  if (!mod) return { ok: false, code: "academy_module_not_found" };
  if (!mod.unlocked) return { ok: false, code: "academy_module_locked" };

  const db = getDb();
  const [row] = await db
    .select({ editionId: academyEditions.id, programSlug: academyPrograms.slug })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.programSlug
        ? and(
            eq(academyEditions.slug, args.editionSlug),
            eq(academyPrograms.slug, args.programSlug),
          )
        : eq(academyEditions.slug, args.editionSlug),
    )
    .limit(1);
  if (!row) return { ok: false, code: "academy_edition_not_found" };

  return {
    ok: true,
    module: mod,
    editionId: row.editionId,
    programSlug: row.programSlug,
  };
}

export async function completeEditionModule(args: {
  userId: string;
  editionSlug: string;
  moduleSlug: string;
  programSlug?: string;
}): Promise<{ ok: true; alreadyDone: boolean } | { ok: false; code: string }> {
  const db = getDb();
  const got = await getEditionModule({
    userId: args.userId,
    editionSlug: args.editionSlug,
    moduleSlug: args.moduleSlug,
    programSlug: args.programSlug,
    locale: "fr",
  });
  if (!got.ok) return got;

  const [existing] = await db
    .select({ id: academyModuleProgress.id })
    .from(academyModuleProgress)
    .where(
      and(
        eq(academyModuleProgress.userId, args.userId),
        eq(academyModuleProgress.moduleId, got.module.id),
      ),
    )
    .limit(1);
  if (existing) return { ok: true, alreadyDone: true };

  await db.insert(academyModuleProgress).values({
    userId: args.userId,
    moduleId: got.module.id,
  });

  await logAcademyLearningEvent({
    userId: args.userId,
    editionId: got.editionId,
    verb: "module_completed",
    objectType: "module",
    objectId: args.moduleSlug,
  });

  return { ok: true, alreadyDone: false };
}
