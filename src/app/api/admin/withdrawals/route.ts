import { NextResponse } from "next/server";
import { and, desc, eq, inArray, isNull, lte } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, users, withdrawals } from "@/db";
import { StaffAuthError, requireStaffScope } from "@/lib/session-user";
import { withdrawalSlaHours } from "@/lib/manual-ops-sla";
import { WithdrawalStatus } from "@/lib/status";

export async function GET(req: Request) {
  let staff;
  try {
    staff = await requireStaffScope("withdrawals");
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const statusParam =
    searchParams.get("status") ?? WithdrawalStatus.PENDING_AGENT;

  const assignFilter = searchParams.get("assignFilter") ?? "all";
  const slaBreachedOnly = searchParams.get("slaBreached") === "1";
  const slaH = withdrawalSlaHours();
  const slaCutoff = new Date(Date.now() - slaH * 60 * 60 * 1000);

  const assignee = alias(users, "withdrawal_assignee");

  const statusCond = slaBreachedOnly
    ? inArray(withdrawals.status, [
        WithdrawalStatus.PENDING_AGENT,
        WithdrawalStatus.PROCESSING,
      ])
    : statusParam === "active"
      ? inArray(withdrawals.status, [
          WithdrawalStatus.PENDING_AGENT,
          WithdrawalStatus.PROCESSING,
        ])
      : eq(withdrawals.status, statusParam);

  const conditions = [statusCond];

  if (assignFilter === "unassigned") {
    conditions.push(isNull(withdrawals.assignedToUserId));
  } else if (assignFilter === "mine") {
    conditions.push(eq(withdrawals.assignedToUserId, staff.id));
  }

  if (slaBreachedOnly) {
    conditions.push(lte(withdrawals.createdAt, slaCutoff));
  }

  const db = getDb();
  const rows = await db
    .select({
      id: withdrawals.id,
      userId: withdrawals.userId,
      userEmail: users.email,
      asset: withdrawals.asset,
      networkCanonical: withdrawals.networkCanonical,
      networkCex: withdrawals.networkCex,
      toAddress: withdrawals.toAddress,
      memoTo: withdrawals.memoTo,
      amount: withdrawals.amount,
      fee: withdrawals.fee,
      providerFee: withdrawals.providerFee,
      platformFee: withdrawals.platformFee,
      status: withdrawals.status,
      txid: withdrawals.txid,
      assignedToUserId: withdrawals.assignedToUserId,
      assigneeEmail: assignee.email,
      createdAt: withdrawals.createdAt,
      completedAt: withdrawals.completedAt,
    })
    .from(withdrawals)
    .innerJoin(users, eq(withdrawals.userId, users.id))
    .leftJoin(assignee, eq(withdrawals.assignedToUserId, assignee.id))
    .where(and(...conditions))
    .orderBy(desc(withdrawals.createdAt))
    .limit(100);

  return NextResponse.json({
    withdrawals: rows,
    slaHoursWithdrawal: slaH,
  });
}
