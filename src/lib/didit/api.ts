import {
  diditApiKey,
  diditAppCallbackUrl,
  diditConfigured,
  diditWorkflowId,
} from "@/lib/didit/config";
import { parseDiditSessionStatus } from "@/lib/didit/parse-outcome";
import { rejectionNoteFromDiditDecision } from "@/lib/didit/decision-notes";
import type { KycVerificationOutcome } from "@/lib/kyc-service";

const API_BASE = "https://verification.didit.me/v3";

export function diditApiConfigured(): boolean {
  return diditConfigured();
}

export type DiditSessionResource = Record<string, unknown> & {
  session_id?: string;
  status?: string;
  url?: string;
  vendor_data?: string;
  metadata?: Record<string, unknown>;
};

export async function createDiditSession(args: {
  userId: string;
  countryCode?: string | null;
}): Promise<DiditSessionResource> {
  const apiKey = diditApiKey();
  const workflowId = diditWorkflowId();
  if (!apiKey || !workflowId) {
    throw new Error("didit_api_not_configured");
  }

  const metadata: Record<string, string> = { userId: args.userId };
  const cc = args.countryCode?.trim().toUpperCase();
  if (cc && cc !== "OTHER") metadata.countryCode = cc;

  const res = await fetch(`${API_BASE}/session/`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      workflow_id: workflowId,
      vendor_data: args.userId,
      callback: diditAppCallbackUrl(),
      metadata,
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`didit_create_session_${res.status}:${detail.slice(0, 200)}`);
  }

  return (await res.json()) as DiditSessionResource;
}

export async function fetchDiditSessionDecision(
  sessionId: string,
): Promise<DiditSessionResource> {
  const apiKey = diditApiKey();
  if (!apiKey) throw new Error("didit_api_not_configured");

  const res = await fetch(`${API_BASE}/session/${sessionId}/decision/`, {
    method: "GET",
    headers: { "x-api-key": apiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`didit_decision_${res.status}:${detail.slice(0, 200)}`);
  }

  return (await res.json()) as DiditSessionResource;
}

export function outcomeFromDiditResource(
  body: DiditSessionResource,
): KycVerificationOutcome {
  return parseDiditSessionStatus(body.status);
}

export function rejectionNoteFromDiditResource(
  body: DiditSessionResource,
  outcome: KycVerificationOutcome,
): string | null {
  if (outcome !== "rejected") return null;
  return rejectionNoteFromDiditDecision(body);
}
