import { NextResponse } from "next/server";
import {
  approvePlatformExpense,
  getPlatformExpenseForStaff,
  canAccessPlatformExpensesModule,
} from "@/lib/platform-expenses";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export async function POST(
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
  const res = await approvePlatformExpense(u, id);
  if (!res.ok) {
    const status =
      res.message === "not_found"
        ? 404
        : res.message === "forbidden" || res.message === "cannot_approve_own"
          ? 403
          : 400;
    return NextResponse.json({ message: res.message }, { status });
  }
  const row = await getPlatformExpenseForStaff(u, id);
  return NextResponse.json({ ok: true, expense: row });
}
