import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";
import { getDb, loanCollaterals, loanEvents, loans, users } from "@/db";
import { StaffAuthError, requireSuperAdmin } from "@/lib/session-user";

export async function GET(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const { searchParams } = new URL(req.url);
  const statusRaw = (searchParams.get("status") ?? "open").trim().toLowerCase();
  const status =
    statusRaw === "all"
      ? (["open", "repaid", "defaulted"] as const)
      : statusRaw === "open"
        ? (["open"] as const)
        : statusRaw === "repaid"
          ? (["repaid"] as const)
          : statusRaw === "defaulted"
            ? (["defaulted"] as const)
            : (["open"] as const);

  const db = getDb();
  const list = await db
    .select({
      id: loans.id,
      userId: loans.userId,
      email: users.email,
      principalUsdt: loans.principalUsdt,
      outstandingUsdt: loans.outstandingUsdt,
      status: loans.status,
      aprAnnual: loans.aprAnnual,
      createdAt: loans.createdAt,
      updatedAt: loans.updatedAt,
    })
    .from(loans)
    .innerJoin(users, eq(loans.userId, users.id))
    .where(inArray(loans.status, [...status]))
    .orderBy(desc(loans.createdAt))
    .limit(200);

  return NextResponse.json({ loans: list });
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
  } catch (e) {
    if (e instanceof StaffAuthError) {
      return NextResponse.json({ message: e.message }, { status: 403 });
    }
    throw e;
  }

  const body = (await req.json().catch(() => null)) as
    | null
    | { action?: string; loanId?: string };
  const action = (body?.action ?? "").trim();
  const loanId = (body?.loanId ?? "").trim();
  if (!loanId) return NextResponse.json({ ok: false, message: "loan_not_found" }, { status: 400 });

  const db = getDb();
  if (action === "mark_defaulted") {
    await db
      .update(loans)
      .set({ status: "defaulted", updatedAt: new Date() })
      .where(eq(loans.id, loanId));
    return NextResponse.json({ ok: true });
  }

  if (action === "mark_repaid") {
    await db
      .update(loans)
      .set({ status: "repaid", outstandingUsdt: "0", updatedAt: new Date() })
      .where(eq(loans.id, loanId));
    return NextResponse.json({ ok: true });
  }

  if (action === "details") {
    const [loan] = await db
      .select()
      .from(loans)
      .where(eq(loans.id, loanId))
      .limit(1);
    if (!loan) return NextResponse.json({ ok: false, message: "loan_not_found" }, { status: 404 });

    const events = await db
      .select()
      .from(loanEvents)
      .where(eq(loanEvents.loanId, loanId))
      .orderBy(desc(loanEvents.createdAt))
      .limit(200);

    const collats = await db
      .select()
      .from(loanCollaterals)
      .where(eq(loanCollaterals.loanId, loanId))
      .limit(200);

    return NextResponse.json({ ok: true, loan, events, collaterals: collats });
  }

  return NextResponse.json({ ok: false, message: "invalid_action" }, { status: 400 });
}

