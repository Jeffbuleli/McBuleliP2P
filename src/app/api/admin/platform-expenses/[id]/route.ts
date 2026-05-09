import { NextResponse } from "next/server";
import { z } from "zod";
import { PLATFORM_EXPENSE_CATEGORIES } from "@/lib/platform-expenses-constants";
import {
  getPlatformExpenseForStaff,
  isPlatformExpenseCategory,
  updatePlatformExpenseDraft,
  canAccessPlatformExpensesModule,
  type UpdatePlatformExpenseDraftInput,
} from "@/lib/platform-expenses";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const patchBody = z
  .object({
    amount: z.number().positive().optional(),
    currency: z.string().max(8).optional(),
    category: z.enum([...PLATFORM_EXPENSE_CATEGORIES] as [string, ...string[]]).optional(),
    description: z.string().min(2).max(4000).optional(),
    vendor: z.string().max(500).nullable().optional(),
    attachmentUrl: z.string().url().max(2000).nullable().optional(),
    expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  })
  .strict();

function jsonRow(
  r: NonNullable<Awaited<ReturnType<typeof getPlatformExpenseForStaff>>>,
) {
  return {
    id: r.id,
    amount: r.amount,
    currency: r.currency,
    category: r.category,
    description: r.description,
    vendor: r.vendor,
    attachmentUrl: r.attachmentUrl,
    expenseDate: r.expenseDate,
    status: r.status,
    createdByUserId: r.createdByUserId,
    creatorEmail: r.creatorEmail,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    approvedAt: r.approvedAt?.toISOString() ?? null,
    rejectedAt: r.rejectedAt?.toISOString() ?? null,
    rejectionReason: r.rejectionReason,
    paidAt: r.paidAt?.toISOString() ?? null,
    paidNote: r.paidNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const u = await getSessionUser();
  if (!u || (u.role !== UserRole.AGENT && u.role !== UserRole.SUPER_ADMIN)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!canAccessPlatformExpensesModule(u)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const row = await getPlatformExpenseForStaff(u, id);
  if (!row) return NextResponse.json({ message: "not_found" }, { status: 404 });
  return NextResponse.json({ expense: jsonRow(row) });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const u = await getSessionUser();
  if (!u || (u.role !== UserRole.AGENT && u.role !== UserRole.SUPER_ADMIN)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!canAccessPlatformExpensesModule(u)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchBody.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid_body" }, { status: 400 });
  }
  const patch = parsed.data;
  if (patch.category != null && !isPlatformExpenseCategory(patch.category)) {
    return NextResponse.json({ message: "invalid_category" }, { status: 400 });
  }

  const res = await updatePlatformExpenseDraft(
    u,
    id,
    patch as UpdatePlatformExpenseDraftInput,
  );
  if (!res.ok) {
    const status =
      res.message === "not_found" ? 404 : res.message === "forbidden" ? 403 : 400;
    return NextResponse.json({ message: res.message }, { status });
  }
  const row = await getPlatformExpenseForStaff(u, id);
  return NextResponse.json({ ok: true, expense: row ? jsonRow(row) : null });
}
