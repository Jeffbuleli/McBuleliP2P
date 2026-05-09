import { NextResponse } from "next/server";
import { z } from "zod";
import { PLATFORM_EXPENSE_CATEGORIES } from "@/lib/platform-expenses-constants";
import {
  createPlatformExpense,
  isPlatformExpenseCategory,
  listPlatformExpensesForStaff,
  canAccessPlatformExpensesModule,
  type PlatformExpenseStatus,
} from "@/lib/platform-expenses";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const postBody = z.object({
  amount: z.number().positive(),
  currency: z.string().max(8).optional().default("USD"),
  category: z.enum([...PLATFORM_EXPENSE_CATEGORIES] as [string, ...string[]]),
  description: z.string().min(2).max(4000),
  vendor: z.string().max(500).nullable().optional(),
  attachmentUrl: z.string().url().max(2000).nullable().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(req: Request) {
  const u = await getSessionUser();
  if (!u || (u.role !== UserRole.AGENT && u.role !== UserRole.SUPER_ADMIN)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  if (!canAccessPlatformExpensesModule(u)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const statusRaw = searchParams.get("status");
  const status =
    statusRaw === "draft" ||
    statusRaw === "submitted" ||
    statusRaw === "approved" ||
    statusRaw === "rejected" ||
    statusRaw === "paid"
      ? (statusRaw as PlatformExpenseStatus)
      : null;

  const rows = await listPlatformExpensesForStaff(u, status);
  return NextResponse.json({
    expenses: rows.map((r) => ({
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
    })),
  });
}

export async function POST(req: Request) {
  const u = await getSessionUser();
  if (!u) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (!canAccessPlatformExpensesModule(u)) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = postBody.safeParse(json);
  if (!parsed.success || !isPlatformExpenseCategory(parsed.data.category)) {
    return NextResponse.json({ message: "invalid_body" }, { status: 400 });
  }

  const res = await createPlatformExpense(u, {
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    category: parsed.data.category,
    description: parsed.data.description,
    vendor: parsed.data.vendor ?? null,
    attachmentUrl: parsed.data.attachmentUrl ?? null,
    expenseDate: parsed.data.expenseDate,
  });

  if (!res.ok) {
    const st = res.message === "forbidden" ? 403 : 400;
    return NextResponse.json({ message: res.message }, { status: st });
  }
  return NextResponse.json({ ok: true, id: res.id });
}
