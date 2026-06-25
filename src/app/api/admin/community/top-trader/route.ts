import { NextResponse } from "next/server";
import {
  getCompletedWeekForPayout,
  getTopTraderProgramInfo,
} from "@/lib/community/top-trader-competition";
import {
  listAdminTopTraderPayouts,
  runTopTraderWeeklyPayout,
} from "@/lib/community/top-trader-payout-service";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const [payouts, program] = await Promise.all([
    listAdminTopTraderPayouts(),
    Promise.resolve(getTopTraderProgramInfo()),
  ]);

  const pendingWeek = getCompletedWeekForPayout();
  const pendingSettled = pendingWeek
    ? payouts.some(
        (p) => p.weekStartAt === pendingWeek.weekStartAt.toISOString(),
      )
    : false;

  return NextResponse.json({
    ok: true,
    payouts,
    program,
    pendingWeek: pendingWeek
      ? {
          weekLabel: pendingWeek.weekLabel,
          weekStartAt: pendingWeek.weekStartAt.toISOString(),
          weekEndAt: pendingWeek.weekEndAt.toISOString(),
          settled: pendingSettled,
        }
      : null,
  });
}

export async function POST() {
  try {
    await requireSuperAdmin();
  } catch (e) {
    const msg = e instanceof StaffAuthError ? e.message : "Forbidden";
    return NextResponse.json({ message: msg }, { status: 403 });
  }

  const result = await runTopTraderWeeklyPayout();
  return NextResponse.json(result);
}
