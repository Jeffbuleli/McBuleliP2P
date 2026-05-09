import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPlatformExpenseForStaff,
  rejectPlatformExpense,
  canAccessPlatformExpensesModule,
} from "@/lib/platform-expenses";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  reason: z.string().min(2).max(2000),
});

export async function POST(
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

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "invalid_body" }, { status: 400 });
  }

  const { id } = await ctx.params;
  const res = await rejectPlatformExpense(u, id, parsed.data.reason);
  if (!res.ok) {
    const status =
      res.message === "not_found"
        ? 404
        : res.message === "forbidden" || res.message === "cannot_reject_own"
          ? 403
          : 400;
    return NextResponse.json({ message: res.message }, { status });
  }
  const row = await getPlatformExpenseForStaff(u, id);
  return NextResponse.json({ ok: true, expense: row });
}
