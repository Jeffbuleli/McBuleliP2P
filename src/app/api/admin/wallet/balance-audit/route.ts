import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session-user";
import { UserRole } from "@/lib/roles";
import {
  findFiatDepositsWithoutCompletedTx,
  runFiatIntegrityReconcile,
  traceUserBalanceProvenance,
  traceUsersWithUntrustedFunds,
} from "@/lib/wallet-balance-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function requireSuperAdmin() {
  const me = await getSessionUser();
  if (!me || me.role !== UserRole.SUPER_ADMIN) return null;
  return me;
}

export async function GET(req: Request) {
  if (!(await requireSuperAdmin())) return forbidden();

  const url = new URL(req.url);
  const userId = url.searchParams.get("userId")?.trim();

  if (userId) {
    const provenance = await traceUserBalanceProvenance(userId);
    return NextResponse.json({ ok: true, provenance });
  }

  const untrusted = await traceUsersWithUntrustedFunds();
  const orphanFiat = await findFiatDepositsWithoutCompletedTx();
  return NextResponse.json({
    ok: true,
    untrustedUsers: untrusted,
    orphanFiatLedgerRows: orphanFiat.length,
    orphanFiat,
  });
}

export async function POST(req: Request) {
  if (!(await requireSuperAdmin())) return forbidden();

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";
  const hoursRaw = url.searchParams.get("hours");
  const sinceHours = hoursRaw != null ? Number(hoursRaw) : undefined;

  const report = await runFiatIntegrityReconcile({
    dryRun,
    sinceHours: Number.isFinite(sinceHours) && sinceHours! > 0 ? sinceHours : undefined,
  });

  const orphanFiat = await findFiatDepositsWithoutCompletedTx();

  return NextResponse.json({
    ok: true,
    dryRun,
    sinceHours: sinceHours ?? null,
    ...report,
    orphanFiatLedgerRowsAfter: orphanFiat.length,
  });
}
