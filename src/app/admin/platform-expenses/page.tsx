import { redirect } from "next/navigation";
import {
  canAccessPlatformExpensesModule,
  canApprovePlatformExpenses,
  canSubmitPlatformExpenses,
  listPlatformExpensesForStaff,
  PLATFORM_EXPENSE_STATUSES,
  type PlatformExpenseStatus,
} from "@/lib/platform-expenses";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import { PlatformExpensesClient, type ExpenseListItem } from "./platform-expenses-client";

export const dynamic = "force-dynamic";

export default async function AdminPlatformExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const u = await getSessionUser();
  if (!u || (u.role !== UserRole.AGENT && u.role !== UserRole.SUPER_ADMIN)) {
    redirect("/login");
  }
  if (!canAccessPlatformExpensesModule(u)) {
    redirect("/admin");
  }

  const sp = await searchParams;
  const raw = sp.status;
  const status: PlatformExpenseStatus | null =
    raw && (PLATFORM_EXPENSE_STATUSES as readonly string[]).includes(raw)
      ? (raw as PlatformExpenseStatus)
      : null;

  const rows = await listPlatformExpensesForStaff(u, status);

  const list: ExpenseListItem[] = rows.map((r) => ({
    id: r.id,
    amount: String(r.amount),
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
  }));

  return (
    <PlatformExpensesClient
      key={raw ?? "all"}
      initialExpenses={list}
      meId={u.id}
      canSubmit={canSubmitPlatformExpenses(u)}
      canApprove={canApprovePlatformExpenses(u)}
      isSuperAdmin={u.role === UserRole.SUPER_ADMIN}
      initialStatus={raw ?? "all"}
    />
  );
}
