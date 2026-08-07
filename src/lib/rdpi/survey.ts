import { desc, eq } from "drizzle-orm";
import { getDb, rdpiSurveyResponses } from "@/db";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import {
  ACTIVITY_OPTIONS,
  AGE_OPTIONS,
  canonicalizeProvince,
  DRC_PROVINCES,
  EMPLOYEES_OPTIONS,
  IMPACT_DOMAIN_OPTIONS,
  IMPACT_ORG_COLORS,
  IMPACT_ORG_OPTIONS,
  ACTION_OPTIONS,
  LIKERT_ITEMS,
  OBSTACLE_ITEMS,
  OBSTACLE_LEVELS,
  OPEN_TEXT_FIELDS,
  REFORM_ITEMS,
  RDPI_SURVEY_SLUG,
  SEX_OPTIONS,
  YEARS_OPTIONS,
  YES_NO,
  YES_NO_UNCERTAIN,
  type RdpiSurveyAnswers,
  emptyRdpiAnswers,
} from "./survey-questions";

function isNonEmpty(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

  const email = (a.email ?? "").trim().toLowerCase();
  if (!email || !isValidEmail(email)) {
    return { ok: false, error: "email_required" };
  }
  a.email = email.slice(0, 200);

  const phoneRaw = (a.phone ?? "").trim();
  if (!phoneRaw) {
    return { ok: false, error: "phone_required" };
  }
  const phoneNorm = normalizeCodPhoneNumber(phoneRaw);
  if (!isValidCodMsisdn(phoneNorm)) {
    return { ok: false, error: "phone_invalid" };
  }
  a.phone = phoneNorm;
  a.mcbuleliContactOptIn = Boolean(a.mcbuleliContactOptIn);

  if (!(SEX_OPTIONS as readonly string[]).includes(a.sex)) {
    return { ok: false, error: "sex_required" };
  }
  if (!(AGE_OPTIONS as readonly string[]).includes(a.age)) {
    return { ok: false, error: "age_required" };
  }
  if (!isNonEmpty(a.province)) {
    return { ok: false, error: "province_required" };
  }
  const provinceCanon = canonicalizeProvince(a.province);
  if (!provinceCanon) {
    return { ok: false, error: "province_invalid" };
  }
  a.province = provinceCanon;
  if (!(ACTIVITY_OPTIONS as readonly string[]).includes(a.activity)) {
    return { ok: false, error: "activity_required" };
  }
  if (a.activity === "Autre" && !isNonEmpty(a.activityOther)) {
    return { ok: false, error: "activityOther_required" };
  }
  if (!(YEARS_OPTIONS as readonly string[]).includes(a.yearsActive)) {
    return { ok: false, error: "yearsActive_required" };
  }
  if (!(EMPLOYEES_OPTIONS as readonly string[]).includes(a.employees)) {
    return { ok: false, error: "employees_required" };
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
  a.impactDomain = a.impactDomain.filter((x) =>
    (IMPACT_DOMAIN_OPTIONS as readonly string[]).includes(x),
  );
  if (a.impactDomain.length === 0) {
    return { ok: false, error: "impactDomain_required" };
  }
  if (!Array.isArray(a.actions) || a.actions.length === 0) {
    return { ok: false, error: "actions_required" };
  }
  a.actions = a.actions.filter((x) =>
    (ACTION_OPTIONS as readonly string[]).includes(x),
  );
  if (a.actions.length === 0) {
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
  if (new Set(ranks).size !== REFORM_ITEMS.length) {
    return { ok: false, error: "reformRanks_duplicate" };
  }
  for (const item of REFORM_ITEMS) {
    a.reformRanks[item.key] = Number(a.reformRanks[item.key]);
  }

  if (!(YES_NO as readonly string[]).includes(a.digitizePerception)) {
    return { ok: false, error: "digitizePerception_required" };
  }

  a.fullName = a.fullName.trim().slice(0, 200);
  a.activityOther = (a.activityOther ?? "").trim().slice(0, 200);
  a.foreignInvestors = (a.foreignInvestors ?? "").trim().slice(0, 2000);
  a.concernDisposition = (a.concernDisposition ?? "").trim().slice(0, 4000);
  a.innovationEffects = (a.innovationEffects ?? "").trim().slice(0, 4000);
  a.startupMeasures = (a.startupMeasures ?? "").trim().slice(0, 4000);
  a.reconcileFiscal = (a.reconcileFiscal ?? "").trim().slice(0, 4000);
  a.extraObservations = (a.extraObservations ?? "").trim().slice(0, 4000);

  if (!isNonEmpty(a.foreignInvestors) || a.foreignInvestors.length < 3) {
    return { ok: false, error: "foreignInvestors_required" };
  }
  if (!isNonEmpty(a.concernDisposition) || a.concernDisposition.length < 3) {
    return { ok: false, error: "concernDisposition_required" };
  }
  if (!isNonEmpty(a.innovationEffects) || a.innovationEffects.length < 3) {
    return { ok: false, error: "innovationEffects_required" };
  }
  if (!isNonEmpty(a.startupMeasures) || a.startupMeasures.length < 3) {
    return { ok: false, error: "startupMeasures_required" };
  }
  if (!isNonEmpty(a.reconcileFiscal) || a.reconcileFiscal.length < 3) {
    return { ok: false, error: "reconcileFiscal_required" };
  }
  if (!isNonEmpty(a.extraObservations) || a.extraObservations.length < 3) {
    return { ok: false, error: "extraObservations_required" };
  }

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

export type CountBucket = {
  label: string;
  value: number;
  color?: string;
};

function countField(
  rows: Array<{ answers: RdpiSurveyAnswers; province?: string | null }>,
  pick: (a: RdpiSurveyAnswers, row: { province?: string | null }) =>
    | string
    | null
    | undefined,
): CountBucket[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const v = pick(row.answers, row);
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

/** Keep canonical option order (include zeros). */
function orderedCount(
  rows: Array<{ answers: RdpiSurveyAnswers }>,
  pick: (a: RdpiSurveyAnswers) => string | null | undefined,
  order: readonly string[],
  colors?: Record<string, string>,
): CountBucket[] {
  const map = new Map<string, number>();
  for (const label of order) map.set(label, 0);
  for (const row of rows) {
    const v = pick(row.answers);
    if (!v || !map.has(v)) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }
  return order.map((label) => ({
    label,
    value: map.get(label) ?? 0,
    ...(colors?.[label] ? { color: colors[label] } : {}),
  }));
}

function resolveProvinceLabel(
  answers: RdpiSurveyAnswers,
  columnProvince?: string | null,
): string {
  const raw = (answers.province || columnProvince || "").trim();
  if (!raw) return "";
  return canonicalizeProvince(raw) ?? raw;
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

  const byProvince = countField(typed, (a, row) =>
    resolveProvinceLabel(a, row.province),
  );
  const provinceCoverage = byProvince.filter((b) =>
    (DRC_PROVINCES as readonly string[]).includes(b.label),
  ).length;

  return {
    total: typed.length,
    provinceCoverage,
    provinceTotal: DRC_PROVINCES.length,
    bySex: orderedCount(typed, (a) => a.sex, SEX_OPTIONS),
    byAge: orderedCount(typed, (a) => a.age, AGE_OPTIONS),
    byActivity: countField(typed, (a) =>
      a.activity === "Autre" && a.activityOther
        ? `Autre: ${a.activityOther}`
        : a.activity,
    ),
    byProvince,
    byImpactOrg: orderedCount(
      typed,
      (a) => a.impactOrg,
      IMPACT_ORG_OPTIONS,
      IMPACT_ORG_COLORS,
    ),
    byConsumerCost: orderedCount(
      typed,
      (a) => a.consumerCost,
      YES_NO_UNCERTAIN,
    ),
    byOpportunity: orderedCount(
      typed,
      (a) => a.opportunityRegulation,
      YES_NO,
    ),
    byThreeRegimes: orderedCount(typed, (a) => a.threeRegimes, YES_NO),
    byDigitize: orderedCount(typed, (a) => a.digitizePerception, YES_NO),
    likertAvg: avgLikert(typed),
    obstaclesAvg: avgObstacles(typed),
    reformPriority: reformPriority(typed),
    recent: typed.map((r) => {
      const province = resolveProvinceLabel(r.answers, r.province) || null;
      return {
        id: r.id,
        fullName: r.fullName,
        province,
        activity: r.activity,
        createdAt: r.createdAt.toISOString(),
        impactOrg: r.answers.impactOrg,
        impactOrgColor:
          IMPACT_ORG_COLORS[
            r.answers.impactOrg as keyof typeof IMPACT_ORG_COLORS
          ] ?? null,
        email: r.answers.email ?? "",
        phone: r.answers.phone ?? "",
        mcbuleliContactOptIn: Boolean(r.answers.mcbuleliContactOptIn),
        foreignInvestors: (r.answers.foreignInvestors ?? "").trim(),
        concernDisposition: (r.answers.concernDisposition ?? "").trim(),
        innovationEffects: (r.answers.innovationEffects ?? "").trim(),
        startupMeasures: (r.answers.startupMeasures ?? "").trim(),
        reconcileFiscal: (r.answers.reconcileFiscal ?? "").trim(),
        extraObservations: (r.answers.extraObservations ?? "").trim(),
      };
    }),
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
    "ID",
    "Date de soumission",
    "Nom complet",
    "Email",
    "Téléphone / WhatsApp",
    "Opt-in contact McBuleli",
    "Sexe",
    "Âge",
    "Province d'exercice principal",
    "Activité principale",
    "Activité (précision)",
    "Ancienneté",
    "Effectif",
    ...LIKERT_ITEMS.map((i) => i.label),
    "D1. Impact sur l'organisation",
    "D2. Domaine(s) le(s) plus affecté(s)",
    "D3. Actions envisagées",
    "D4. Coût pour les consommateurs",
    ...OPEN_TEXT_FIELDS.filter((f) => f.key === "foreignInvestors").map(
      (f) => f.csvHeader,
    ),
    ...OBSTACLE_ITEMS.map((i) => `Obstacle - ${i.label}`),
    "Opportunité réglementaire (Oui/Non)",
    "Trois régimes (Oui/Non)",
    ...REFORM_ITEMS.map((i) => `Priorité réforme - ${i.label}`),
    ...OPEN_TEXT_FIELDS.filter(
      (f) =>
        f.key === "concernDisposition" ||
        f.key === "innovationEffects" ||
        f.key === "startupMeasures" ||
        f.key === "reconcileFiscal",
    ).map((f) => f.csvHeader),
    "G5. Perception numérisée nécessaire (Oui/Non)",
    ...OPEN_TEXT_FIELDS.filter((f) => f.key === "extraObservations").map(
      (f) => f.csvHeader,
    ),
  ];

  const lines = [headers.join(",")];
  for (const row of rows) {
    const a = row.answers as RdpiSurveyAnswers;
    const vals = [
      row.id,
      row.createdAt.toISOString(),
      a.fullName,
      a.email ?? "",
      a.phone ?? "",
      a.mcbuleliContactOptIn ? "Oui" : "Non",
      a.sex,
      a.age,
      canonicalizeProvince(a.province) ?? a.province,
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
        (i) =>
          OBSTACLE_LEVELS[(a.obstacles?.[i.key] ?? 1) - 1] ??
          a.obstacles?.[i.key],
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
  return `\uFEFF${lines.join("\n")}`;
}
