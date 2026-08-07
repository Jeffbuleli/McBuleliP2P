/**
 * Lead import preview + commit (dedup, hygiene, already-registered checks).
 * No emails sent here.
 */

import { and, eq, inArray, sql } from "drizzle-orm";
import {
  getDb,
  hackathonCampaignEvents,
  hackathonLeads,
  hackathonRegistrations,
  hackathonSuppressionList,
} from "@/db";
import { canonicalEmailForDedup } from "@/lib/auth/email-normalize";
import {
  draftFromRawRow,
  type LeadImportRawRow,
  type NormalizedLeadDraft,
} from "./lead-normalize";
import { parseSpreadsheetBuffer } from "./parse-spreadsheet";

export type LeadImportRowStatus =
  | "new"
  | "duplicate_in_file"
  | "existing_lead"
  | "already_registered"
  | "suppressed"
  | "invalid_email"
  | "already_contacted";

export type LeadImportPreviewRow = {
  rowIndex: number;
  status: LeadImportRowStatus;
  draft: NormalizedLeadDraft;
  existingLeadId?: string;
  matchedRegistrationId?: string;
  issues: string[];
};

export type LeadImportSummary = {
  totalRows: number;
  valid: number;
  newProspects: number;
  duplicatesInFile: number;
  existingLeads: number;
  alreadyRegistered: number;
  suppressed: number;
  invalidEmail: number;
  alreadyContacted: number;
  errors: string[];
  format: "csv" | "xlsx";
  headers: string[];
};

export type LeadImportPreviewResult = {
  summary: LeadImportSummary;
  rows: LeadImportPreviewRow[];
};

function classifyBase(draft: NormalizedLeadDraft): {
  status: LeadImportRowStatus | null;
  issues: string[];
} {
  const issues: string[] = [];
  if (!draft.emailValid || !draft.email) {
    issues.push("invalid_email");
    return { status: "invalid_email", issues };
  }
  if (draft.typoFixed) issues.push("email_typo_fixed");
  if (!draft.firstName) issues.push("missing_first_name");
  return { status: null, issues };
}

export async function buildLeadImportPreview(args: {
  editionId: string;
  rawRows: LeadImportRawRow[];
  defaultSource?: string;
  format?: "csv" | "xlsx";
  headers?: string[];
  parseErrors?: string[];
}): Promise<LeadImportPreviewResult> {
  const db = getDb();
  const defaultSource = args.defaultSource ?? "csv";
  const drafts = args.rawRows.map((raw) =>
    draftFromRawRow(raw, defaultSource),
  );

  const seenInFile = new Map<string, number>();
  const canonicals = [
    ...new Set(
      drafts
        .filter((d) => d.emailValid && d.emailCanonical)
        .map((d) => d.emailCanonical),
    ),
  ];

  const existingLeads =
    canonicals.length === 0
      ? []
      : await db
          .select({
            id: hackathonLeads.id,
            emailCanonical: hackathonLeads.emailCanonical,
            contactCount: hackathonLeads.contactCount,
            lastContactedAt: hackathonLeads.lastContactedAt,
            matchedRegistrationId: hackathonLeads.matchedRegistrationId,
            alreadyRegistered: hackathonLeads.alreadyRegistered,
            suppressed: hackathonLeads.suppressed,
          })
          .from(hackathonLeads)
          .where(
            and(
              eq(hackathonLeads.editionId, args.editionId),
              inArray(hackathonLeads.emailCanonical, canonicals),
            ),
          );

  const leadByCanon = new Map(
    existingLeads.map((l) => [l.emailCanonical, l] as const),
  );

  const regs =
    canonicals.length === 0
      ? []
      : await db
          .select({
            id: hackathonRegistrations.id,
            email: hackathonRegistrations.email,
          })
          .from(hackathonRegistrations)
          .where(eq(hackathonRegistrations.editionId, args.editionId));

  const regByCanon = new Map<string, string>();
  for (const r of regs) {
    const c = canonicalEmailForDedup(r.email);
    if (canonicals.includes(c)) regByCanon.set(c, r.id);
  }

  const suppressedRows =
    canonicals.length === 0
      ? []
      : await db
          .select({
            emailCanonical: hackathonSuppressionList.emailCanonical,
          })
          .from(hackathonSuppressionList)
          .where(inArray(hackathonSuppressionList.emailCanonical, canonicals));

  const suppressedSet = new Set(suppressedRows.map((s) => s.emailCanonical));

  const rows: LeadImportPreviewRow[] = [];
  const summary: LeadImportSummary = {
    totalRows: drafts.length,
    valid: 0,
    newProspects: 0,
    duplicatesInFile: 0,
    existingLeads: 0,
    alreadyRegistered: 0,
    suppressed: 0,
    invalidEmail: 0,
    alreadyContacted: 0,
    errors: [...(args.parseErrors ?? [])],
    format: args.format ?? "csv",
    headers: args.headers ?? [],
  };

  for (let i = 0; i < drafts.length; i++) {
    const draft = drafts[i]!;
    const base = classifyBase(draft);
    const issues = [...base.issues];
    let status: LeadImportRowStatus = base.status ?? "new";
    let existingLeadId: string | undefined;
    let matchedRegistrationId: string | undefined;

    if (status === "invalid_email") {
      summary.invalidEmail += 1;
      rows.push({ rowIndex: i + 2, status, draft, issues });
      continue;
    }

    const canon = draft.emailCanonical;
    const firstIdx = seenInFile.get(canon);
    if (firstIdx != null) {
      status = "duplicate_in_file";
      issues.push(`duplicate_of_row_${firstIdx}`);
      summary.duplicatesInFile += 1;
      rows.push({ rowIndex: i + 2, status, draft, issues });
      continue;
    }
    seenInFile.set(canon, i + 2);

    if (suppressedSet.has(canon)) {
      status = "suppressed";
      issues.push("on_suppression_list");
      summary.suppressed += 1;
      rows.push({ rowIndex: i + 2, status, draft, issues });
      continue;
    }

    const regId = regByCanon.get(canon);
    if (regId) {
      status = "already_registered";
      matchedRegistrationId = regId;
      issues.push("already_hackathon_participant");
      summary.alreadyRegistered += 1;
      // Still count as "known" — import can link flag without campaign eligibility
      rows.push({
        rowIndex: i + 2,
        status,
        draft,
        matchedRegistrationId,
        issues,
      });
      continue;
    }

    const existing = leadByCanon.get(canon);
    if (existing) {
      existingLeadId = existing.id;
      if (
        existing.contactCount > 0 ||
        existing.lastContactedAt != null
      ) {
        status = "already_contacted";
        issues.push("previously_contacted");
        summary.alreadyContacted += 1;
      } else {
        status = "existing_lead";
        issues.push("already_in_leads");
        summary.existingLeads += 1;
      }
      if (existing.matchedRegistrationId) {
        matchedRegistrationId = existing.matchedRegistrationId;
      }
      if (existing.suppressed || existing.alreadyRegistered) {
        issues.push("existing_flags");
      }
      rows.push({
        rowIndex: i + 2,
        status,
        draft,
        existingLeadId,
        matchedRegistrationId,
        issues,
      });
      continue;
    }

    status = "new";
    summary.newProspects += 1;
    summary.valid += 1;
    rows.push({ rowIndex: i + 2, status, draft, issues });
  }

  return { summary, rows };
}

export async function previewLeadImportFromFile(args: {
  editionId: string;
  filename: string;
  buffer: Buffer;
  defaultSource?: string;
}): Promise<LeadImportPreviewResult> {
  const parsed = await parseSpreadsheetBuffer({
    filename: args.filename,
    buffer: args.buffer,
  });
  const source =
    args.defaultSource ??
    (parsed.format === "xlsx" ? "xlsx" : "csv");
  return buildLeadImportPreview({
    editionId: args.editionId,
    rawRows: parsed.rows,
    defaultSource: source,
    format: parsed.format,
    headers: parsed.headers,
    parseErrors: parsed.errors,
  });
}

export type LeadImportCommitOptions = {
  editionId: string;
  filename: string;
  buffer: Buffer;
  createdByUserId?: string | null;
  /** Insert new only (default). Optionally upsert profile fields on existing. */
  updateExisting?: boolean;
  /** Also insert rows flagged already_registered (marked alreadyRegistered=true). */
  includeAlreadyRegistered?: boolean;
  defaultSource?: string;
};

export type LeadImportCommitResult = {
  inserted: number;
  updated: number;
  skipped: number;
  qualified: number;
  summary: LeadImportSummary;
  leadIds: string[];
};

export async function commitLeadImportFromFile(
  args: LeadImportCommitOptions,
): Promise<LeadImportCommitResult> {
  const preview = await previewLeadImportFromFile({
    editionId: args.editionId,
    filename: args.filename,
    buffer: args.buffer,
    defaultSource: args.defaultSource,
  });

  if (preview.summary.errors.includes("missing_email_column")) {
    return {
      inserted: 0,
      updated: 0,
      skipped: preview.rows.length,
      qualified: 0,
      summary: preview.summary,
      leadIds: [],
    };
  }
  if (preview.summary.errors.includes("xlsx_package_missing")) {
    return {
      inserted: 0,
      updated: 0,
      skipped: preview.rows.length,
      qualified: 0,
      summary: preview.summary,
      leadIds: [],
    };
  }

  const db = getDb();
  const updateExisting = args.updateExisting === true;
  const includeRegistered = args.includeAlreadyRegistered === true;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  const leadIds: string[] = [];
  const now = new Date();

  for (const row of preview.rows) {
    const { status, draft } = row;

    if (status === "invalid_email" || status === "duplicate_in_file") {
      skipped += 1;
      continue;
    }
    if (status === "suppressed") {
      skipped += 1;
      continue;
    }
    if (status === "already_registered" && !includeRegistered) {
      skipped += 1;
      continue;
    }
    if (
      (status === "existing_lead" || status === "already_contacted") &&
      !updateExisting
    ) {
      skipped += 1;
      continue;
    }

    if (
      (status === "existing_lead" || status === "already_contacted") &&
      updateExisting &&
      row.existingLeadId
    ) {
      await db
        .update(hackathonLeads)
        .set({
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
          phone: draft.phone,
          linkedinUrl: draft.linkedinUrl,
          company: draft.company,
          jobTitle: draft.jobTitle,
          location: draft.location,
          skills: draft.skills,
          experienceYears: draft.experienceYears,
          notes: draft.notes,
          source: draft.source,
          emailValid: draft.emailValid,
          alreadyRegistered: Boolean(row.matchedRegistrationId),
          matchedRegistrationId: row.matchedRegistrationId ?? null,
          consentAt:
            draft.consent === true
              ? now
              : draft.consent === false
                ? null
                : undefined,
          consentSource:
            draft.consent === true ? `import:${args.filename}` : undefined,
          updatedAt: now,
        })
        .where(eq(hackathonLeads.id, row.existingLeadId));
      leadIds.push(row.existingLeadId);
      updated += 1;
      continue;
    }

    if (status === "new" || (status === "already_registered" && includeRegistered)) {
      const [created] = await db
        .insert(hackathonLeads)
        .values({
          editionId: args.editionId,
          firstName: draft.firstName,
          lastName: draft.lastName,
          email: draft.email,
          emailCanonical: draft.emailCanonical,
          phone: draft.phone,
          linkedinUrl: draft.linkedinUrl,
          company: draft.company,
          jobTitle: draft.jobTitle,
          location: draft.location,
          skills: draft.skills,
          experienceYears: draft.experienceYears,
          notes: draft.notes,
          source: draft.source,
          emailValid: true,
          alreadyRegistered: status === "already_registered",
          matchedRegistrationId: row.matchedRegistrationId ?? null,
          lifecycle: status === "already_registered" ? "REGISTERED" : "LEAD",
          consentAt: draft.consent === true ? now : null,
          consentSource:
            draft.consent === true ? `import:${args.filename}` : null,
          createdByUserId: args.createdByUserId ?? null,
        })
        .onConflictDoNothing({
          target: [hackathonLeads.editionId, hackathonLeads.emailCanonical],
        })
        .returning({ id: hackathonLeads.id });

      if (created?.id) {
        leadIds.push(created.id);
        inserted += 1;
      } else {
        skipped += 1;
      }
      continue;
    }

    skipped += 1;
  }

  if (inserted + updated > 0) {
    await db.insert(hackathonCampaignEvents).values({
      type: "IMPORTED",
      meta: {
        editionId: args.editionId,
        filename: args.filename,
        inserted,
        updated,
        skipped,
        total: preview.summary.totalRows,
        leadIdsSample: leadIds.slice(0, 20),
        leadCount: leadIds.length,
      },
    });
  }

  // Auto qualify newly touched leads (score + segment).
  let qualified = 0;
  if (leadIds.length > 0) {
    const { qualifyHackathonLeads } = await import("./lead-qualify");
    const q = await qualifyHackathonLeads({
      editionId: args.editionId,
      leadIds,
    });
    qualified = q.updated;
  }

  return {
    inserted,
    updated,
    skipped,
    qualified,
    summary: preview.summary,
    leadIds,
  };
}

export async function listHackathonLeads(args: {
  editionId: string;
  limit?: number;
  offset?: number;
  category?: string;
  segment?: string;
  q?: string;
}) {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
  const offset = Math.max(args.offset ?? 0, 0);

  const conditions = [eq(hackathonLeads.editionId, args.editionId)];
  if (args.category) {
    conditions.push(eq(hackathonLeads.category, args.category));
  }
  if (args.segment) {
    conditions.push(eq(hackathonLeads.segment, args.segment));
  }

  const rows = await db
    .select({
      id: hackathonLeads.id,
      firstName: hackathonLeads.firstName,
      lastName: hackathonLeads.lastName,
      email: hackathonLeads.email,
      phone: hackathonLeads.phone,
      company: hackathonLeads.company,
      jobTitle: hackathonLeads.jobTitle,
      location: hackathonLeads.location,
      source: hackathonLeads.source,
      score: hackathonLeads.score,
      category: hackathonLeads.category,
      segment: hackathonLeads.segment,
      priority: hackathonLeads.priority,
      qualificationReason: hackathonLeads.qualificationReason,
      recommendedProfile: hackathonLeads.recommendedProfile,
      scoreBreakdown: hackathonLeads.scoreBreakdown,
      lifecycle: hackathonLeads.lifecycle,
      emailValid: hackathonLeads.emailValid,
      suppressed: hackathonLeads.suppressed,
      alreadyRegistered: hackathonLeads.alreadyRegistered,
      contactCount: hackathonLeads.contactCount,
      lastContactedAt: hackathonLeads.lastContactedAt,
      createdAt: hackathonLeads.createdAt,
    })
    .from(hackathonLeads)
    .where(and(...conditions))
    .orderBy(sql`${hackathonLeads.score} DESC, ${hackathonLeads.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const filtered = args.q
    ? rows.filter((r) => {
        const q = args.q!.toLowerCase();
        return (
          r.email.toLowerCase().includes(q) ||
          r.firstName.toLowerCase().includes(q) ||
          r.lastName.toLowerCase().includes(q) ||
          (r.company ?? "").toLowerCase().includes(q)
        );
      })
    : rows;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(hackathonLeads)
    .where(eq(hackathonLeads.editionId, args.editionId));

  return { leads: filtered, total: count };
}

function csvEscape(v: unknown): string {
  const s = v == null ? "" : String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Full list for CSV export (filters applied; hard cap 20k). */
export async function listHackathonLeadsForExport(args: {
  editionId: string;
  category?: string;
  segment?: string;
  q?: string;
}) {
  const db = getDb();
  const conditions = [eq(hackathonLeads.editionId, args.editionId)];
  if (args.category) {
    conditions.push(eq(hackathonLeads.category, args.category));
  }
  if (args.segment) {
    conditions.push(eq(hackathonLeads.segment, args.segment));
  }

  const rows = await db
    .select({
      id: hackathonLeads.id,
      firstName: hackathonLeads.firstName,
      lastName: hackathonLeads.lastName,
      email: hackathonLeads.email,
      phone: hackathonLeads.phone,
      company: hackathonLeads.company,
      jobTitle: hackathonLeads.jobTitle,
      location: hackathonLeads.location,
      source: hackathonLeads.source,
      score: hackathonLeads.score,
      category: hackathonLeads.category,
      segment: hackathonLeads.segment,
      priority: hackathonLeads.priority,
      qualificationReason: hackathonLeads.qualificationReason,
      recommendedProfile: hackathonLeads.recommendedProfile,
      lifecycle: hackathonLeads.lifecycle,
      emailValid: hackathonLeads.emailValid,
      suppressed: hackathonLeads.suppressed,
      alreadyRegistered: hackathonLeads.alreadyRegistered,
      contactCount: hackathonLeads.contactCount,
      lastContactedAt: hackathonLeads.lastContactedAt,
      createdAt: hackathonLeads.createdAt,
    })
    .from(hackathonLeads)
    .where(and(...conditions))
    .orderBy(sql`${hackathonLeads.score} DESC, ${hackathonLeads.createdAt} DESC`)
    .limit(20_000);

  if (!args.q?.trim()) return rows;
  const q = args.q.trim().toLowerCase();
  return rows.filter(
    (r) =>
      r.email.toLowerCase().includes(q) ||
      r.firstName.toLowerCase().includes(q) ||
      r.lastName.toLowerCase().includes(q) ||
      (r.company ?? "").toLowerCase().includes(q),
  );
}

export function hackathonLeadsToCsv(
  rows: Awaited<ReturnType<typeof listHackathonLeadsForExport>>,
): string {
  const headers = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "company",
    "jobTitle",
    "location",
    "source",
    "score",
    "category",
    "segment",
    "priority",
    "lifecycle",
    "emailValid",
    "suppressed",
    "alreadyRegistered",
    "contactCount",
    "lastContactedAt",
    "qualificationReason",
    "recommendedProfile",
    "createdAt",
    "id",
  ] as const;

  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.firstName,
        r.lastName,
        r.email,
        r.phone,
        r.company,
        r.jobTitle,
        r.location,
        r.source,
        r.score,
        r.category,
        r.segment,
        r.priority,
        r.lifecycle,
        r.emailValid,
        r.suppressed,
        r.alreadyRegistered,
        r.contactCount,
        r.lastContactedAt
          ? new Date(r.lastContactedAt).toISOString()
          : "",
        r.qualificationReason,
        r.recommendedProfile,
        r.createdAt ? new Date(r.createdAt).toISOString() : "",
        r.id,
      ]
        .map(csvEscape)
        .join(","),
    );
  }
  return `\uFEFF${lines.join("\n")}\n`;
}
