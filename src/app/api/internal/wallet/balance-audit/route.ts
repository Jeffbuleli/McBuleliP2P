import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/pool-env";
import {
  findFiatDepositsWithoutCompletedTx,
  runFiatIntegrityReconcile,
} from "@/lib/wallet-balance-audit";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Reconcile orphan wallet balances (stored > auditable ledger/deposits). */
export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (secret !== getCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") === "1";

  const [report, orphanFiat] = await Promise.all([
    runFiatIntegrityReconcile({ dryRun }),
    findFiatDepositsWithoutCompletedTx(),
  ]);

  return NextResponse.json({
    ok: true,
    dryRun,
    ...report,
    orphanFiatLedgerRowsAfter: orphanFiat.length,
  });
}
