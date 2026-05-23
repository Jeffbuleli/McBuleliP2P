import { NextResponse } from "next/server";
import {
  applyKycFromMetamap,
  setUserKycPending,
} from "@/lib/kyc-service";
import { parseMetamapIdentityStatus } from "@/lib/metamap/parse-outcome";
import { rejectionNoteFromWebhookBody } from "@/lib/metamap/signals";
import { metamapWebhookSecret } from "@/lib/metamap/config";
import { verifyMetamapWebhookSignature } from "@/lib/metamap/webhook-verify";
import { resolveMetamapWebhookUserId } from "@/lib/metamap/resolve-webhook-user";
import { parseMetamapResourceIds } from "@/lib/metamap/resource-ids";

type WebhookPayload = {
  eventName?: string;
  metadata?: unknown;
  identityStatus?: string;
  status?: string;
  resource?: string;
};

export async function POST(req: Request) {
  const raw = await req.text();
  const secret = metamapWebhookSecret();
  const sig = req.headers.get("x-signature");

  if (secret) {
    if (!verifyMetamapWebhookSignature(raw, sig, secret)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let body: WebhookPayload;
  try {
    body = JSON.parse(raw) as WebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = body.eventName ?? "";
  const userId = await resolveMetamapWebhookUserId(body);
  const { identityId, verificationId } = parseMetamapResourceIds(body.resource);

  if (!userId) {
    console.warn("[metamap webhook] no_user", {
      eventName,
      resource: body.resource,
      verificationId,
    });
    return NextResponse.json({ ok: true, skipped: "no_user" });
  }

  if (eventName === "verification_started") {
    await setUserKycPending({
      userId,
      metamapIdentityId: identityId,
      metamapVerificationId: verificationId,
    });
    return NextResponse.json({ ok: true });
  }

  if (eventName === "verification_completed" || eventName === "verification_updated") {
    const outcome = parseMetamapIdentityStatus(body.identityStatus, body.status);
    const rejectionNote =
      outcome === "rejected"
        ? (rejectionNoteFromWebhookBody(body as Record<string, unknown>) ??
          "Verification rejected by MetaMap")
        : null;
    const status = await applyKycFromMetamap({
      userId,
      outcome,
      metamapIdentityId: identityId,
      metamapVerificationId: verificationId,
      rejectionNote,
    });
    return NextResponse.json({ ok: true, status });
  }

  return NextResponse.json({ ok: true, ignored: eventName });
}
