import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/session";
import { listGroupAuditLog, listGroupLedger } from "@/lib/group-savings-service";
import { listGroupMessages } from "@/lib/group-savings-messaging";
import { getMyMembershipOrNull } from "@/lib/group-savings-permissions";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const userId = await getSessionUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await ctx.params;

  const m = await getMyMembershipOrNull({ groupId: id, userId });
  if (!m || m.status !== "approved") {
    return NextResponse.json({ error: "group_forbidden" }, { status: 403 });
  }

  const [ledger, messages] = await Promise.all([
    listGroupLedger({ groupId: id, userId, limit: 50 }),
    listGroupMessages({ groupId: id, userId, limit: 30 }),
  ]);

  const canAudit = m.role === "admin" || m.role === "co_admin";
  const audit = canAudit ? await listGroupAuditLog({ groupId: id, userId, limit: 40 }) : null;

  const proofs = (messages.ok ? messages.messages : []).filter(
    (x) => x.messageType === "proof" || x.attachmentUrl,
  );

  return NextResponse.json({
    ledger: ledger.ok ? ledger.entries : [],
    proofs,
    audit: audit?.ok ? audit.audit : [],
    role: m.role,
  });
}
