import { and, desc, eq, type SQL } from "drizzle-orm";
import {
  getDb,
  platformExpenseEvents,
  platformExpenses,
  users,
} from "@/db";
import { PlatformAdminAuditAction, writePlatformAdminAudit } from "@/lib/admin-audit";
import type { SessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { agentHasScope } from "@/lib/staff-scopes";
import {
  PLATFORM_EXPENSE_STATUSES,
  type PlatformExpenseCategory,
  type PlatformExpenseStatus,
  isPlatformExpenseCategory,
} from "@/lib/platform-expenses-constants";

export {
  PLATFORM_EXPENSE_STATUSES,
  PLATFORM_EXPENSE_CATEGORIES,
  type PlatformExpenseCategory,
  type PlatformExpenseStatus,
  isPlatformExpenseCategory,
} from "@/lib/platform-expenses-constants";

export function canSeeAllPlatformExpenses(u: SessionUser): boolean {
  return u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "platform_expenses_approve");
}

export function canSubmitPlatformExpenses(u: SessionUser): boolean {
  return u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "platform_expenses");
}

export function canApprovePlatformExpenses(u: SessionUser): boolean {
  return u.role === UserRole.SUPER_ADMIN || agentHasScope(u, "platform_expenses_approve");
}

/** Agent must have submit and/or approve scope; super-admin always allowed. */
export function canAccessPlatformExpensesModule(u: SessionUser): boolean {
  if (u.role === UserRole.SUPER_ADMIN) return true;
  if (u.role !== UserRole.AGENT) return false;
  return canSubmitPlatformExpenses(u) || canApprovePlatformExpenses(u);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDate(s: string): string | null {
  if (!ISO_DATE.test(s)) return null;
  const d = new Date(`${s}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return s;
}

export type PlatformExpenseRow = typeof platformExpenses.$inferSelect;

async function appendExpenseEvent(args: {
  expenseId: string;
  actorUserId: string;
  action: string;
  meta?: Record<string, unknown> | null;
}) {
  const db = getDb();
  await db.insert(platformExpenseEvents).values({
    expenseId: args.expenseId,
    actorUserId: args.actorUserId,
    action: args.action,
    meta: args.meta ?? null,
  });
}

export async function listPlatformExpensesForStaff(
  u: SessionUser,
  status?: PlatformExpenseStatus | null,
): Promise<
  (PlatformExpenseRow & {
    creatorEmail: string;
  })[]
> {
  const db = getDb();
  const conds: SQL[] = [];
  if (status && PLATFORM_EXPENSE_STATUSES.includes(status)) {
    conds.push(eq(platformExpenses.status, status));
  }
  if (!canSeeAllPlatformExpenses(u)) {
    conds.push(eq(platformExpenses.createdByUserId, u.id));
  }
  const whereClause = conds.length === 0 ? undefined : conds.length === 1 ? conds[0] : and(...conds);

  const base = db
    .select({
      expense: platformExpenses,
      creatorEmail: users.email,
    })
    .from(platformExpenses)
    .innerJoin(users, eq(platformExpenses.createdByUserId, users.id));
  const rows = await (whereClause
    ? base.where(whereClause)
    : base
  )
    .orderBy(desc(platformExpenses.createdAt))
    .limit(500);

  return rows.map((r) => ({ ...r.expense, creatorEmail: r.creatorEmail }));
}

export async function getPlatformExpenseForStaff(
  u: SessionUser,
  id: string,
): Promise<(PlatformExpenseRow & { creatorEmail: string }) | null> {
  const db = getDb();
  const [row] = await db
    .select({
      expense: platformExpenses,
      creatorEmail: users.email,
    })
    .from(platformExpenses)
    .innerJoin(users, eq(platformExpenses.createdByUserId, users.id))
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return null;
  if (!canSeeAllPlatformExpenses(u) && row.expense.createdByUserId !== u.id) {
    return null;
  }
  return { ...row.expense, creatorEmail: row.creatorEmail };
}

export type CreatePlatformExpenseInput = {
  amount: number;
  currency: string;
  category: PlatformExpenseCategory;
  description: string;
  vendor: string | null;
  attachmentUrl: string | null;
  expenseDate: string;
};

export async function createPlatformExpense(
  u: SessionUser,
  input: CreatePlatformExpenseInput,
): Promise<{ ok: true; id: string } | { ok: false; message: string }> {
  if (!canSubmitPlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const dateOk = assertIsoDate(input.expenseDate);
  if (!dateOk) return { ok: false, message: "invalid_expense_date" };
  if (!Number.isFinite(input.amount) || input.amount <= 0) {
    return { ok: false, message: "invalid_amount" };
  }
  const cur = input.currency.trim().toUpperCase().slice(0, 8) || "USD";
  const desc = input.description.trim();
  if (desc.length < 2) return { ok: false, message: "invalid_description" };

  const db = getDb();
  const [ins] = await db
    .insert(platformExpenses)
    .values({
      amount: String(input.amount),
      currency: cur,
      category: input.category,
      description: desc,
      vendor: input.vendor?.trim() || null,
      attachmentUrl: input.attachmentUrl?.trim() || null,
      expenseDate: dateOk,
      status: "draft",
      createdByUserId: u.id,
    })
    .returning({ id: platformExpenses.id });

  if (!ins) return { ok: false, message: "insert_failed" };

  await appendExpenseEvent({
    expenseId: ins.id,
    actorUserId: u.id,
    action: "created",
    meta: { category: input.category, amount: input.amount, currency: cur },
  });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_CREATE,
    resourceType: "platform_expense",
    resourceId: ins.id,
    meta: { category: input.category },
  });

  return { ok: true, id: ins.id };
}

export type UpdatePlatformExpenseDraftInput = Partial<{
  amount: number;
  currency: string;
  category: PlatformExpenseCategory;
  description: string;
  vendor: string | null;
  attachmentUrl: string | null;
  expenseDate: string;
}>;

export async function updatePlatformExpenseDraft(
  u: SessionUser,
  id: string,
  patch: UpdatePlatformExpenseDraftInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!canSubmitPlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(platformExpenses)
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return { ok: false, message: "not_found" };
  if (row.status !== "draft") return { ok: false, message: "not_editable" };
  if (row.createdByUserId !== u.id && u.role !== UserRole.SUPER_ADMIN) {
    return { ok: false, message: "forbidden" };
  }

  const next: Record<string, unknown> = {
    updatedAt: new Date(),
  };
  if (patch.amount !== undefined) {
    if (!Number.isFinite(patch.amount) || patch.amount <= 0) {
      return { ok: false, message: "invalid_amount" };
    }
    next.amount = String(patch.amount);
  }
  if (patch.currency !== undefined) {
    next.currency = patch.currency.trim().toUpperCase().slice(0, 8) || "USD";
  }
  if (patch.category !== undefined) {
    if (!isPlatformExpenseCategory(patch.category)) {
      return { ok: false, message: "invalid_category" };
    }
    next.category = patch.category;
  }
  if (patch.description !== undefined) {
    const d = patch.description.trim();
    if (d.length < 2) return { ok: false, message: "invalid_description" };
    next.description = d;
  }
  if (patch.vendor !== undefined) next.vendor = patch.vendor?.trim() || null;
  if (patch.attachmentUrl !== undefined) {
    next.attachmentUrl = patch.attachmentUrl?.trim() || null;
  }
  if (patch.expenseDate !== undefined) {
    const d = assertIsoDate(patch.expenseDate);
    if (!d) return { ok: false, message: "invalid_expense_date" };
    next.expenseDate = d;
  }

  await db
    .update(platformExpenses)
    .set(next as Partial<typeof platformExpenses.$inferInsert>)
    .where(eq(platformExpenses.id, id));

  await appendExpenseEvent({
    expenseId: id,
    actorUserId: u.id,
    action: "updated",
    meta: { fields: Object.keys(patch) },
  });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_UPDATE,
    resourceType: "platform_expense",
    resourceId: id,
    meta: null,
  });

  return { ok: true };
}

export async function submitPlatformExpense(
  u: SessionUser,
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!canSubmitPlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(platformExpenses)
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return { ok: false, message: "not_found" };
  if (row.status !== "draft") return { ok: false, message: "invalid_status" };
  if (row.createdByUserId !== u.id && u.role !== UserRole.SUPER_ADMIN) {
    return { ok: false, message: "forbidden" };
  }

  const now = new Date();
  await db
    .update(platformExpenses)
    .set({
      status: "submitted",
      submittedAt: now,
      updatedAt: now,
    })
    .where(eq(platformExpenses.id, id));

  await appendExpenseEvent({ expenseId: id, actorUserId: u.id, action: "submitted" });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_SUBMIT,
    resourceType: "platform_expense",
    resourceId: id,
    meta: null,
  });

  return { ok: true };
}

export async function approvePlatformExpense(
  u: SessionUser,
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!canApprovePlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(platformExpenses)
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return { ok: false, message: "not_found" };
  if (row.status !== "submitted") return { ok: false, message: "invalid_status" };
  if (u.role !== UserRole.SUPER_ADMIN && row.createdByUserId === u.id) {
    return { ok: false, message: "cannot_approve_own" };
  }

  const now = new Date();
  await db
    .update(platformExpenses)
    .set({
      status: "approved",
      approvedByUserId: u.id,
      approvedAt: now,
      updatedAt: now,
      rejectedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
    })
    .where(eq(platformExpenses.id, id));

  await appendExpenseEvent({ expenseId: id, actorUserId: u.id, action: "approved" });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_APPROVE,
    resourceType: "platform_expense",
    resourceId: id,
    meta: null,
  });

  return { ok: true };
}

export async function rejectPlatformExpense(
  u: SessionUser,
  id: string,
  reason: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!canApprovePlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const r = reason.trim();
  if (r.length < 2) return { ok: false, message: "invalid_reason" };

  const db = getDb();
  const [row] = await db
    .select()
    .from(platformExpenses)
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return { ok: false, message: "not_found" };
  if (row.status !== "submitted") return { ok: false, message: "invalid_status" };
  if (u.role !== UserRole.SUPER_ADMIN && row.createdByUserId === u.id) {
    return { ok: false, message: "cannot_reject_own" };
  }

  const now = new Date();
  await db
    .update(platformExpenses)
    .set({
      status: "rejected",
      rejectedByUserId: u.id,
      rejectedAt: now,
      rejectionReason: r,
      updatedAt: now,
    })
    .where(eq(platformExpenses.id, id));

  await appendExpenseEvent({
    expenseId: id,
    actorUserId: u.id,
    action: "rejected",
    meta: { reason: r },
  });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_REJECT,
    resourceType: "platform_expense",
    resourceId: id,
    meta: { reason: r },
  });

  return { ok: true };
}

export async function markPaidPlatformExpense(
  u: SessionUser,
  id: string,
  note: string | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!canApprovePlatformExpenses(u)) {
    return { ok: false, message: "forbidden" };
  }
  const db = getDb();
  const [row] = await db
    .select()
    .from(platformExpenses)
    .where(eq(platformExpenses.id, id))
    .limit(1);
  if (!row) return { ok: false, message: "not_found" };
  if (row.status !== "approved") return { ok: false, message: "invalid_status" };

  const now = new Date();
  await db
    .update(platformExpenses)
    .set({
      status: "paid",
      paidAt: now,
      paidNote: note?.trim() || null,
      updatedAt: now,
    })
    .where(eq(platformExpenses.id, id));

  await appendExpenseEvent({
    expenseId: id,
    actorUserId: u.id,
    action: "paid",
    meta: note ? { note: note.trim() } : null,
  });
  await writePlatformAdminAudit({
    actorUserId: u.id,
    action: PlatformAdminAuditAction.PLATFORM_EXPENSE_PAID,
    resourceType: "platform_expense",
    resourceId: id,
    meta: null,
  });

  return { ok: true };
}
