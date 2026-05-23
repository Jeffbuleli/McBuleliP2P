import { NextResponse } from "next/server";
import {
  applyKycFromProvider,
  setUserKycPending,
  type KycVerificationOutcome,
} from "@/lib/kyc-service";
import { diditWebhookSecret } from "@/lib/didit/config";
import { rejectionNoteFromDiditDecision } from "@/lib/didit/decision-notes";
import { parseDiditSessionStatus } from "@/lib/didit/parse-outcome";
import { resolveDiditWebhookUserId } from "@/lib/didit/resolve-webhook-user";
import { verifyDiditWebhookRequest, isDiditTestWebhook } from "@/lib/didit/webhook-verify";

type DiditWebhookPayload = {
  webhook_type?: string;
  status?: string;
  session_id?: string;
  vendor_data?: string;
  metadata?: Record<string, unknown>;
  decision?: Record<string, unknown>;
};

function outcomeFromEntityStatus(status: string | undefined): KycVerificationOutcome {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return "verified";
  if (s === "DECLINED" || s === "REJECTED" || s === "BLOCKED") return "rejected";
  if (s === "IN_REVIEW") return "reviewNeeded";
  return "unknown";
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  let body: DiditWebhookPayload;
  try {
    body = JSON.parse(rawBody) as DiditWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const secret = diditWebhookSecret();
  const verified = verifyDiditWebhookRequest({
    body: body as Record<string, unknown>,
    rawBody,
    headers: req.headers,
    secret,
  });

  if (!verified) {
    console.warn("[didit webhook] invalid_signature", {
      hasSecret: Boolean(secret),
      isTest: isDiditTestWebhook(req.headers),
      hasV2: Boolean(req.headers.get("x-signature-v2")),
      hasRaw: Boolean(req.headers.get("x-signature")),
      hasSimple: Boolean(req.headers.get("x-signature-simple")),
      webhookType: body.webhook_type,
    });
    return NextResponse.json(
      {
        error: "invalid_signature",
        hint:
          "Use the webhook destination secret_shared_key (not DIDIT_API_KEY). Console tests send X-Didit-Test-Webhook: true and are accepted after deploy.",
      },
      { status: 401 },
    );
  }

  const webhookType = body.webhook_type ?? "";
  const userId = await resolveDiditWebhookUserId(body);
  const sessionId =
    typeof body.session_id === "string" ? body.session_id.trim() : null;

  if (webhookType === "status.updated" || webhookType === "data.updated") {
    if (!userId) {
      console.warn("[didit webhook] no_user", {
        webhookType,
        sessionId,
        vendorData: body.vendor_data,
      });
      return NextResponse.json({ ok: true, skipped: "no_user" });
    }

    const status = body.status ?? "";
    if (
      status === "In Progress" ||
      status === "Not Started" ||
      status === "Resubmitted"
    ) {
      await setUserKycPending({
        userId,
        diditSessionId: sessionId,
      });
      return NextResponse.json({ ok: true, status: "pending" });
    }

    const outcome = parseDiditSessionStatus(status);
    const rejectionNote =
      outcome === "rejected"
        ? rejectionNoteFromDiditDecision(body.decision)
        : null;

    const kycStatus = await applyKycFromProvider({
      userId,
      outcome,
      diditSessionId: sessionId,
      rejectionNote,
    });
    return NextResponse.json({ ok: true, status: kycStatus });
  }

  if (webhookType === "user.status.updated") {
    if (!userId) {
      return NextResponse.json({ ok: true, skipped: "no_user" });
    }
    const outcome = outcomeFromEntityStatus(body.status);
    if (outcome === "unknown") {
      return NextResponse.json({ ok: true, ignored: body.status });
    }
    const kycStatus = await applyKycFromProvider({
      userId,
      outcome,
      diditSessionId: sessionId,
      rejectionNote:
        outcome === "rejected"
          ? rejectionNoteFromDiditDecision(body.decision)
          : null,
    });
    return NextResponse.json({ ok: true, status: kycStatus });
  }

  return NextResponse.json({ ok: true, ignored: webhookType });
}
