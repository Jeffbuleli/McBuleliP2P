import { NextResponse } from "next/server";
import { diditWebhookSecret } from "@/lib/didit/config";
import { applyDiditDecision } from "@/lib/didit/apply-decision";
import { resolveDiditWebhookUserId } from "@/lib/didit/resolve-webhook-user";
import { claimDiditWebhookEvent } from "@/lib/didit/webhook-idempotency";
import {
  verifyDiditWebhookRequest,
  isDiditTestWebhook,
} from "@/lib/didit/webhook-verify";

type DiditWebhookPayload = {
  event_id?: string;
  webhook_type?: string;
  status?: string;
  session_id?: string;
  vendor_data?: string;
  metadata?: Record<string, unknown>;
  decision?: Record<string, unknown>;
  timestamp?: number;
};

function entityStatusToDiditSession(status: string | undefined): string | null {
  const s = (status ?? "").toUpperCase();
  if (s === "APPROVED") return "Approved";
  if (s === "DECLINED" || s === "REJECTED" || s === "BLOCKED") return "Declined";
  if (s === "IN_REVIEW") return "In Review";
  return null;
}

function decisionResource(body: DiditWebhookPayload): Record<string, unknown> {
  const base = { ...body } as Record<string, unknown>;
  if (body.decision && typeof body.decision === "object") {
    base.decision = body.decision;
  }
  return base;
}

export async function POST(req: Request) {
  try {
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
        webhookType: body.webhook_type,
      });
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }

    const claimed = await claimDiditWebhookEvent(body.event_id);
    if (!claimed) {
      return NextResponse.json({ ok: true, duplicate: true });
    }

    const webhookType = body.webhook_type ?? "";
    const userId = await resolveDiditWebhookUserId(body);
    const sessionId =
      typeof body.session_id === "string" ? body.session_id.trim() : null;
    const status = body.status ?? "";

    if (webhookType === "status.updated" || webhookType === "data.updated") {
      if (!userId) {
        return NextResponse.json({ ok: true, skipped: "no_user" });
      }

      const resource = decisionResource(body);
      const kycStatus = await applyDiditDecision({
        userId,
        sessionId,
        diditStatus: status,
        resource,
        source: "webhook",
      });
      return NextResponse.json({ ok: true, status: kycStatus });
    }

    if (webhookType === "user.status.updated") {
      if (!userId) {
        return NextResponse.json({ ok: true, skipped: "no_user" });
      }
      const diditStatus = entityStatusToDiditSession(body.status);
      if (!diditStatus) {
        return NextResponse.json({ ok: true, ignored: body.status });
      }
      const resource = decisionResource(body);
      const kycStatus = await applyDiditDecision({
        userId,
        sessionId,
        diditStatus,
        resource,
        source: "webhook",
      });
      return NextResponse.json({ ok: true, status: kycStatus });
    }

    return NextResponse.json({ ok: true, ignored: webhookType });
  } catch (err) {
    console.error("[didit webhook] unhandled", err);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
