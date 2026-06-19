import { NextResponse } from "next/server";
import { getCronSecret } from "@/lib/pool-env";
import {
  findFiatDepositsWithoutCompletedTx,
  reconcileAllOrphanBalances,
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

  const [reconcile, orphanFiat] = await Promise.all([
    reconcileAllOrphanBalances({ dryRun }),
    findFiatDepositsWithoutCompletedTx(),
  ]);

  return NextResponse.json({
    ok: true,
    dryRun,
    reconcile,
    orphanFiatLedgerRows: orphanFiat.length,
    orphanFiat,
  });
}
