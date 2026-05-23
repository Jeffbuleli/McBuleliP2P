import { NextResponse } from "next/server";
import {
  applyKycFromMetamap,
  resolveUserIdFromMetamapMetadata,
  setUserKycPending,
  type MetamapVerificationOutcome,
} from "@/lib/kyc-service";
import { rejectionNoteFromWebhookBody } from "@/lib/metamap/signals";
import { metamapWebhookSecret } from "@/lib/metamap/config";
import { verifyMetamapWebhookSignature } from "@/lib/metamap/webhook-verify";

type WebhookPayload = {
  eventName?: string;
  metadata?: Record<string, unknown>;
  identityStatus?: string;
  status?: string;
  resource?: string;
};

function parseOutcome(body: WebhookPayload): MetamapVerificationOutcome {
  const s = (
    body.identityStatus ??
    body.status ??
    ""
  )
    .toString()
    .toLowerCase();
  if (s === "verified") return "verified";
  if (s === "reviewneeded" || s === "review_needed") return "reviewNeeded";
  if (s === "rejected") return "rejected";
  return "unknown";
}

function verificationIdFromResource(resource: string | undefined): string | null {
  if (!resource || typeof resource !== "string") return null;
  const parts = resource.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? null;
}

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
  const userId = await resolveUserIdFromMetamapMetadata(body.metadata);
  if (!userId) {
    return NextResponse.json({ ok: true, skipped: "no_user" });
  }

  if (eventName === "verification_started") {
    await setUserKycPending({
      userId,
      metamapVerificationId: verificationIdFromResource(body.resource),
    });
    return NextResponse.json({ ok: true });
  }

  if (eventName === "verification_completed" || eventName === "verification_updated") {
    const outcome = parseOutcome(body);
    const rejectionNote =
      outcome === "rejected"
        ? (rejectionNoteFromWebhookBody(body as Record<string, unknown>) ??
          "Verification rejected by MetaMap")
        : null;
    const status = await applyKycFromMetamap({
      userId,
      outcome,
      metamapVerificationId: verificationIdFromResource(body.resource),
      rejectionNote,
    });
    return NextResponse.json({ ok: true, status });
  }

  return NextResponse.json({ ok: true, ignored: eventName });
}
