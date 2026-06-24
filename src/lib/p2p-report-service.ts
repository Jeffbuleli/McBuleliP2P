import { desc, eq } from "drizzle-orm";
import { getDb, p2pUserReports, users } from "@/db";
import { maskTraderEmail } from "@/lib/p2p-display";

export type P2pReportReason = "scam" | "abuse" | "no_payment" | "no_release" | "other";

const REASONS = new Set<P2pReportReason>([
  "scam",
  "abuse",
  "no_payment",
  "no_release",
  "other",
]);

export function isP2pReportReason(s: string): s is P2pReportReason {
  return REASONS.has(s as P2pReportReason);
}

export async function submitP2pUserReport(args: {
  reporterId: string;
  reportedUserId: string;
  orderId?: string | null;
  reason: P2pReportReason;
  details?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  if (args.reporterId === args.reportedUserId) {
    return { ok: false, message: "p2p_report_self" };
  }
  const details = args.details?.trim() || null;
  if (details && details.length > 500) {
    return { ok: false, message: "p2p_report_details_long" };
  }

  const db = getDb();
  await db.insert(p2pUserReports).values({
    reporterId: args.reporterId,
    reportedUserId: args.reportedUserId,
    orderId: args.orderId ?? null,
    reason: args.reason,
    details,
  });
  return { ok: true };
}

export async function listOpenP2pUserReports() {
  const db = getDb();
  const rows = await db
    .select({
      id: p2pUserReports.id,
      reason: p2pUserReports.reason,
      details: p2pUserReports.details,
      orderId: p2pUserReports.orderId,
      createdAt: p2pUserReports.createdAt,
      reporterEmail: users.email,
    })
    .from(p2pUserReports)
    .innerJoin(users, eq(p2pUserReports.reporterId, users.id))
    .where(eq(p2pUserReports.status, "open"))
    .orderBy(desc(p2pUserReports.createdAt))
    .limit(100);

  return rows.map((r) => ({
    id: r.id,
    reason: r.reason,
    details: r.details,
    orderId: r.orderId,
    createdAt: r.createdAt.toISOString(),
    reporterMasked: maskTraderEmail(r.reporterEmail),
  }));
}

export async function resolveP2pUserReport(args: {
  reportId: string;
  status: "resolved" | "dismissed";
}): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getDb();
  const updated = await db
    .update(p2pUserReports)
    .set({ status: args.status })
    .where(eq(p2pUserReports.id, args.reportId))
    .returning({ id: p2pUserReports.id });
  if (updated.length === 0) return { ok: false, message: "p2p_report_not_found" };
  return { ok: true };
}
