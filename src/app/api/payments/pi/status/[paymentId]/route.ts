import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, piPlatformPayments } from "@/db";
import {
  PiNetworkApiKeyMissingError,
  PiNetworkTestApiKeyMissingError,
} from "@/lib/pi-network-env";
import { resolvePiPlatformApiKeyForPaymentId } from "@/lib/pi-platform-payment-key";
import { piFetchPaymentPlatform } from "@/lib/pi-platform-payments";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function statusFromPlatform(payment: unknown): "INITIATED" | "APPROVED" | "COMPLETED" {
  const st =
    payment && typeof payment === "object"
      ? (payment as { status?: Record<string, unknown> }).status
      : undefined;
  const approved = Boolean(st && (st as Record<string, unknown>).developer_approved);
  const completed = Boolean(st && (st as Record<string, unknown>).developer_completed);
  if (completed) return "COMPLETED";
  if (approved) return "APPROVED";
  return "INITIATED";
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> },
) {
  const { paymentId } = await params;
  if (!paymentId || paymentId.length < 8) {
    return NextResponse.json({ message: "Invalid paymentId." }, { status: 400 });
  }

  try {
    const { apiKey } = await resolvePiPlatformApiKeyForPaymentId(paymentId);
    const payment = await piFetchPaymentPlatform(paymentId, apiKey);
    const st = statusFromPlatform(payment);
    const meta =
      payment && typeof payment === "object"
        ? (payment as Record<string, unknown>)
        : null;

    const db = getDb();
    const [row] = await db
      .update(piPlatformPayments)
      .set({ status: st, updatedAt: new Date(), meta })
      .where(eq(piPlatformPayments.paymentId, paymentId))
      .returning();

    return NextResponse.json({ ok: true, status: st, payment, local: row ?? null });
  } catch (e) {
    if (
      e instanceof PiNetworkApiKeyMissingError ||
      e instanceof PiNetworkTestApiKeyMissingError
    ) {
      return NextResponse.json({ message: e.message }, { status: 503 });
    }
    const msg = e instanceof Error ? e.message : "Status fetch failed.";
    return NextResponse.json({ message: msg }, { status: 502 });
  }
}

