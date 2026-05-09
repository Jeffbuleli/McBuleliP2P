import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, piPlatformPayments, users } from "@/db";
import { getSessionUserId } from "@/lib/session";
import { UserRole } from "@/lib/roles";
import {
  PiNetworkApiKeyMissingError,
  PiNetworkTestApiKeyMissingError,
  getPiNetworkApiKeyForSandbox,
} from "@/lib/pi-network-env";
import {
  extractPaymentId,
  piCreateA2UPaymentPlatform,
} from "@/lib/pi-platform-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const bodyZ = z.object({
  userId: z.string().uuid(),
  amount: z.number().positive(),
  memo: z.string().min(1).max(140),
  metadata: z.record(z.string(), z.unknown()).optional(),
  /** Use Pi Testnet server key + Testnet payouts (super-admin tooling). */
  sandbox: z.boolean().optional(),
});

export async function POST(req: Request) {
  const callerId = await getSessionUserId();
  if (!callerId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [caller] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, callerId))
    .limit(1);
  if (!caller || caller.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid body." }, { status: 400 });
  }

  const [u] = await db
    .select({ id: users.id, piUid: users.piUid })
    .from(users)
    .where(eq(users.id, parsed.data.userId))
    .limit(1);
  if (!u) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  if (!u.piUid) {
    return NextResponse.json({ message: "User has no Pi account." }, { status: 409 });
  }

  try {
    const apiKey = getPiNetworkApiKeyForSandbox(parsed.data.sandbox === true);
    const r = await piCreateA2UPaymentPlatform({
      uid: u.piUid,
      amount: parsed.data.amount,
      memo: parsed.data.memo,
      metadata: parsed.data.metadata,
      apiKey,
    });
    const paymentId = extractPaymentId(r);
    if (!paymentId) {
      return NextResponse.json({ message: "Pi returned no payment id." }, { status: 502 });
    }

    await db
      .insert(piPlatformPayments)
      .values({
        userId: u.id,
        kind: "A2U",
        paymentId,
        amount: String(parsed.data.amount),
        memo: parsed.data.memo,
        action: "a2u_payout",
        actionRefId: null,
        status: "INITIATED",
        meta: parsed.data.metadata ?? null,
      })
      .onConflictDoNothing();

    return NextResponse.json({ ok: true, paymentId });
  } catch (e) {
    if (
      e instanceof PiNetworkApiKeyMissingError ||
      e instanceof PiNetworkTestApiKeyMissingError
    ) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "A2U create failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}

