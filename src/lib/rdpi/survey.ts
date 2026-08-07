import { desc, eq, sql } from "drizzle-orm";
import { getDb, rdpiSurveyResponses } from "@/db";
import {
  ACTIVITY_OPTIONS,
  AGE_OPTIONS,
  IMPACT_ORG_OPTIONS,
  LIKERT_ITEMS,
  OBSTACLE_ITEMS,
  OBSTACLE_LEVELS,
  REFORM_ITEMS,
  RDPI_SURVEY_SLUG,
  SEX_OPTIONS,
  YES_NO,
  YES_NO_UNCERTAIN,
  type RdpiSurveyAnswers,
  emptyRdpiAnswers,
} from "./survey-questions";

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

export function validateRdpiAnswers(
  raw: unknown,
): { ok: true; answers: RdpiSurveyAnswers } | { ok: false; error: string } {
  if (!raw || typeof raw !== "object") {
    return { ok: false, error: "invalid_body" };
  }
  const a = { ...emptyRdpiAnswers(), ...(raw as Partial<RdpiSurveyAnswers>) };

  if (!isNonEmpty(a.fullName) || a.fullName.trim().length < 2) {
    return { ok: false, error: "fullName_required" };
  }
  if (!(SEX_OPTIONS as readonly string[]).includes(a.sex)) {
    return { ok: false, error: "sex_required" };
  }
  if (!(AGE_OPTIONS as readonly string[]).includes(a.age)) {
    return { ok: false, error: "age_required" };
  }
  if (!isNonEmpty(a.province)) {
    return { ok: false, error: "province_required" };
  }
  if (!(ACTIVITY_OPTIONS as readonly string[]).includes(a.activity)) {
    return { ok: false, error: "activity_required" };
  }
  if (a.activity === "Autre" && !isNonEmpty(a.activityOther)) {
    return { ok: false, error: "activityOther_required" };
  }
  if (!a.yearsActive || !a.employees) {
    return { ok: false, error: "profile_incomplete" };
  }

  for (const item of LIKERT_ITEMS) {
    const v = Number(a.likert?.[item.key] ?? 0);
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return { ok: false, error: `likert_${item.key}` };
    }
    a.likert[item.key] = v;
  }

  if (!(IMPACT_ORG_OPTIONS as readonly string[]).includes(a.impactOrg)) {
    return { ok: false, error: "impactOrg_required" };
  }
  if (!Array.isArray(a.impactDomain) || a.impactDomain.length === 0) {
    return { ok: false, error: "impactDomain_required" };
  }
  if (!Array.isArray(a.actions) || a.actions.length === 0) {
    return { ok: false, error: "actions_required" };
  }
  if (!(YES_NO_UNCERTAIN as readonly string[]).includes(a.consumerCost)) {
    return { ok: false, error: "consumerCost_required" };
  }

  for (const item of OBSTACLE_ITEMS) {
    const v = Number(a.obstacles?.[item.key] ?? 0);
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      return { ok: false, error: `obstacle_${item.key}` };
    }
    a.obstacles[item.key] = v;
  }

  if (!(YES_NO as readonly string[]).includes(a.opportunityRegulation)) {
    return { ok: false, error: "opportunityRegulation_required" };
  }
  if (!(YES_NO as readonly string[]).includes(a.threeRegimes)) {
    return { ok: false, error: "threeRegimes_required" };
  }

  const ranks = REFORM_ITEMS.map((r) => Number(a.reformRanks?.[r.key] ?? 0));
  if (ranks.some((r) => !Number.isInteger(r) || r < 1 || r > 7)) {
    return { ok: false, error: "reformRanks_incomplete" };
  }
  for (const item of REFORM_ITEMS) {
    a.reformRanks[item.key] = Number(a.reformRanks[item.key]);
  }

  if (!(YES_NO as readonly string[]).includes(a.digitizePerception)) {
    return { ok: false, error: "digitizePerception_required" };
  }

  a.fullName = a.fullName.trim().slice(0, 200);
  a.province = a.province.trim().slice(0, 120);
  a.activityOther = (a.activityOther ?? "").trim().slice(0, 200);
  a.foreignInvestors = (a.foreignInvestors ?? "").trim().slice(0, 2000);
  a.concernDisposition = (a.concernDisposition ?? "").trim().slice(0, 4000);
  a.innovationEffects = (a.innovationEffects ?? "").trim().slice(0, 4000);
  a.startupMeasures = (a.startupMeasures ?? "").trim().slice(0, 4000);
  a.reconcileFiscal = (a.reconcileFiscal ?? "").trim().slice(0, 4000);
  a.extraObservations = (a.extraObservations ?? "").trim().slice(0, 4000);

  return { ok: true, answers: a };
}

export async function submitRdpiSurvey(args: {
  answers: RdpiSurveyAnswers;
  meta?: {
    userAgent?: string | null;
    ipHash?: string | null;
    locale?: string | null;
  };
}) {
  const db = getDb();
  const [row] = await db
    .insert(rdpiSurveyResponses)
    .values({
      surveySlug: RDPI_SURVEY_SLUG,
      answers: args.answers,
      fullName: args.answers.fullName,
      province: args.answers.province,
      activity: args.answers.activity,
      locale: args.meta?.locale ?? "fr",
      userAgent: args.meta?.userAgent?.slice(0, 400) ?? null,
      ipHash: args.meta?.ipHash?.slice(0, 64) ?? null,
    })
    .returning({ id: rdpiSurveyResponses.id });
  return row;
}

export type CountBucket = { label: string; value: number };

function countField(
  rows: Array<{ answers: RdpiSurveyAnswers }>,
  pick: (a: RdpiSurveyAnswers) => string | null | undefined,
): CountBucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const v = pick(row.answers);
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

function avgLikert(
  rows: Array<{ answers: RdpiSurveyAnswers }>,
): Array<{ key: string; label: string; avg: number }> {
  return LIKERT_ITEMS.map((item) => {
    let sum = 0;
    let n = 0;
    for (const row of rows) {
      const v = Number(row.answers.likert?.[item.key] ?? 0);
      if (v >= 1 && v <= 5) {
        sum += v;
        n += 1;
      }
    }
    return {
      key: item.key,
      label: item.label,
      avg: n > 0 ? Math.round((sum / n) * 10) / 10 : 0,
    };
  });
}

function avgObstacles(
  rows: Array<{ answers: RdpiSurveyAnswers }>,
): Array<{ key: string; label: string; avg: number }> {
  return OBSTACLE_ITEMS.map((item) => {
    let sum = 0;
    let n = 0;
    for (const row of rows) {
      const v = Number(row.answers.obstacles?.[item.key] ?? 0);
      if (v >= 1 && v <= 5) {
        sum += v;
        n += 1;
      }
    }
    return {
      key: item.key,
      label: item.label,
      avg: n > 0 ? Math.round((sum / n) * 10) / 10 : 0,
    };
  }).sort((a, b) => b.avg - a.avg);
}

function reformPriority(
  rows: Array<{ answers: RdpiSurveyAnswers }>,
): Array<{ key: string; label: string; avgRank: number }> {
  return REFORM_ITEMS.map((item) => {
    let sum = 0;
    let n = 0;
    for (const row of rows) {
      const v = Number(row.answers.reformRanks?.[item.key] ?? 0);
      if (v >= 1 && v <= 7) {
        sum += v;
        n += 1;
      }
    }
    return {
      key: item.key,
      label: item.label,
      avgRank: n > 0 ? Math.round((sum / n) * 10) / 10 : 0,
    };
  }).sort((a, b) => a.avgRank - b.avgRank);
}

export async function getRdpiSurveyStats() {
  const db = getDb();
  const rows = await db
    .select({
      id: rdpiSurveyResponses.id,
      answers: rdpiSurveyResponses.answers,
      createdAt: rdpiSurveyResponses.createdAt,
      fullName: rdpiSurveyResponses.fullName,
      province: rdpiSurveyResponses.province,
      activity: rdpiSurveyResponses.activity,
    })
    .from(rdpiSurveyResponses)
    .where(eq(rdpiSurveyResponses.surveySlug, RDPI_SURVEY_SLUG))
    .orderBy(desc(rdpiSurveyResponses.createdAt));

  const typed = rows.map((r) => ({
    ...r,
    answers: r.answers as RdpiSurveyAnswers,
  }));

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(rdpiSurveyResponses)
    .where(eq(rdpiSurveyResponses.surveySlug, RDPI_SURVEY_SLUG));

  return {
    total: count ?? typed.length,
    bySex: countField(typed, (a) => a.sex),
    byAge: countField(typed, (a) => a.age),
    byActivity: countField(typed, (a) =>
      a.activity === "Autre" && a.activityOther
        ? `Autre: ${a.activityOther}`
        : a.activity,
    ),
    byProvince: countField(typed, (a) => a.province),
    byImpactOrg: countField(typed, (a) => a.impactOrg),
    byConsumerCost: countField(typed, (a) => a.consumerCost),
    byOpportunity: countField(typed, (a) => a.opportunityRegulation),
    byThreeRegimes: countField(typed, (a) => a.threeRegimes),
    byDigitize: countField(typed, (a) => a.digitizePerception),
    likertAvg: avgLikert(typed),
    obstaclesAvg: avgObstacles(typed),
    reformPriority: reformPriority(typed),
    recent: typed.slice(0, 30).map((r) => ({
      id: r.id,
      fullName: r.fullName,
      province: r.province,
      activity: r.activity,
      createdAt: r.createdAt.toISOString(),
      impactOrg: r.answers.impactOrg,
    })),
  };
}

export async function listRdpiResponsesForExport() {
  const db = getDb();
  return db
    .select()
    .from(rdpiSurveyResponses)
    .where(eq(rdpiSurveyResponses.surveySlug, RDPI_SURVEY_SLUG))
    .orderBy(desc(rdpiSurveyResponses.createdAt));
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rdpiResponsesToCsv(
  rows: Awaited<ReturnType<typeof listRdpiResponsesForExport>>,
): string {
  const headers = [
    "id",
    "created_at",
    "full_name",
    "sex",
    "age",
    "province",
    "activity",
    "activity_other",
    "years_active",
    "employees",
    ...LIKERT_ITEMS.map((i) => `likert_${i.key}`),
    "impact_org",
    "impact_domain",
    "actions",
    "consumer_cost",
    "foreign_investors",
    ...OBSTACLE_ITEMS.map((i) => `obstacle_${i.key}`),
    "opportunity_regulation",
    "three_regimes",
    ...REFORM_ITEMS.map((i) => `reform_${i.key}`),
    "concern_disposition",
    "innovation_effects",
    "startup_measures",
    "reconcile_fiscal",
    "digitize_perception",
    "extra_observations",
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    const a = row.answers as RdpiSurveyAnswers;
    const vals = [
      row.id,
      row.createdAt.toISOString(),
      a.fullName,
      a.sex,
      a.age,
      a.province,
      a.activity,
      a.activityOther,
      a.yearsActive,
      a.employees,
      ...LIKERT_ITEMS.map((i) => a.likert?.[i.key] ?? ""),
      a.impactOrg,
      (a.impactDomain ?? []).join("; "),
      (a.actions ?? []).join("; "),
      a.consumerCost,
      a.foreignInvestors,
      ...OBSTACLE_ITEMS.map(
        (i) => OBSTACLE_LEVELS[(a.obstacles?.[i.key] ?? 1) - 1] ?? a.obstacles?.[i.key],
      ),
      a.opportunityRegulation,
      a.threeRegimes,
      ...REFORM_ITEMS.map((i) => a.reformRanks?.[i.key] ?? ""),
      a.concernDisposition,
      a.innovationEffects,
      a.startupMeasures,
      a.reconcileFiscal,
      a.digitizePerception,
      a.extraObservations,
    ];
    lines.push(vals.map(csvEscape).join(","));
  }
  return lines.join("\n");
}
