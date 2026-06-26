import { financialAuditLog, getDb } from "@/db";
import { clientIpFromRequest } from "@/lib/rate-limit";

export type FinancialAuditAction =
  | "withdrawal_create"
  | "fiat_withdraw_create"
  | "wallet_transfer"
  | "p2p_order_create"
  | "p2p_order_release"
  | "p2p_order_mark_paid"
  | "p2p_order_dispute"
  | "p2p_order_cancel"
  | "trade_futures_open"
  | "trade_options_open"
  | "staking_create";

function userAgent(req: Request): string | null {
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 512) : null;
}

/** Append-only financial action log (IP, UA, amount). Fire-and-forget. */
export function recordFinancialAudit(args: {
  userId: string;
  action: FinancialAuditAction;
  req: Request;
  resourceType?: string;
  resourceId?: string;
  asset?: string;
  amount?: string;
  meta?: Record<string, unknown>;
}): void {
  const db = getDb();
  void db
    .insert(financialAuditLog)
    .values({
      userId: args.userId,
      action: args.action,
      resourceType: args.resourceType ?? null,
      resourceId: args.resourceId ?? null,
      asset: args.asset ?? null,
      amount: args.amount ?? null,
      ipAddress: clientIpFromRequest(args.req),
      userAgent: userAgent(args.req),
      meta: args.meta ?? null,
    })
    .catch((err) => {
      console.warn("[financial-audit]", args.action, err);
    });
}
