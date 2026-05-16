import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, deposits } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { adminRejectDepositSchema } from "@/lib/validation";
import { DepositStatus } from "@/lib/status";
import { markDepositFailed } from "@/lib/deposit-verify";
import {
  PlatformAdminAuditAction,
  writePlatformAdminAudit,
} from "@/lib/admin-audit";
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  let staff;
  try {
    staff = await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const parsed = adminRejectDepositSchema.safeParse(await req.json());
  if (!parsed.success) {
    const first =
      Object.values(parsed.error.flatten().fieldErrors).flat()[0] ??
      "Invalid payload";
    return NextResponse.json({ message: first }, { status: 400 });
  }

  const { id } = await ctx.params;
  const db = getDb();
  const [d] = await db.select().from(deposits).where(eq(deposits.id, id)).limit(1);

  if (!d) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  if (d.status !== DepositStatus.PENDING_VALIDATION) {
    return NextResponse.json(
      { message: "Only pending deposits can be rejected." },
      { status: 409 },
    );
  }

  await markDepositFailed(id, d.userId, parsed.data.reason);

  await writePlatformAdminAudit({
    actorUserId: staff.id,
    action: PlatformAdminAuditAction.DEPOSIT_REJECT,
    resourceType: "deposit",
    resourceId: id,
    meta: { reason: parsed.data.reason },
  });

  const [updated] = await db
    .select()
    .from(deposits)
    .where(eq(deposits.id, id))
    .limit(1);

  return NextResponse.json({ deposit: updated });
}
