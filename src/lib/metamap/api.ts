import { metamapClientId, metamapClientSecret } from "@/lib/metamap/config";
import { parseMetamapIdentityStatus } from "@/lib/metamap/parse-outcome";
import { rejectionNoteFromWebhookBody } from "@/lib/metamap/signals";
import type { MetamapVerificationOutcome } from "@/lib/kyc-service";

const OAUTH_URL = "https://api.prod.metamap.com/oauth";
const API_BASE = "https://api.prod.metamap.com";

let cachedToken: { token: string; expMs: number } | null = null;

export function metamapApiConfigured(): boolean {
  return Boolean(metamapClientId() && metamapClientSecret());
}

export async function getMetamapAccessToken(): Promise<string> {
  const clientId = metamapClientId();
  const secret = metamapClientSecret();
  if (!clientId || !secret) {
    throw new Error("metamap_api_not_configured");
  }

  if (cachedToken && Date.now() < cachedToken.expMs - 60_000) {
    return cachedToken.token;
  }

  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64");
  const res = await fetch(OAUTH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${basic}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`metamap_oauth_${res.status}:${detail.slice(0, 120)}`);
  }

  const json = (await res.json()) as {
    access_token?: string;
    expiresIn?: number;
  };
  const token = json.access_token?.trim();
  if (!token) throw new Error("metamap_oauth_no_token");

  const ttlSec = json.expiresIn ?? 3600;
  cachedToken = { token, expMs: Date.now() + ttlSec * 1000 };
  return token;
}

export type MetamapVerificationResource = Record<string, unknown> & {
  identityStatus?: string;
  status?: string;
  identity?: string;
  id?: string;
  metadata?: Record<string, unknown>;
};

export async function fetchMetamapVerification(
  verificationId: string,
): Promise<MetamapVerificationResource> {
  const token = await getMetamapAccessToken();
  const res = await fetch(`${API_BASE}/v2/verifications/${verificationId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`metamap_verification_${res.status}:${detail.slice(0, 120)}`);
  }

  return (await res.json()) as MetamapVerificationResource;
}

export function outcomeFromMetamapResource(
  body: MetamapVerificationResource,
): MetamapVerificationOutcome {
  return parseMetamapIdentityStatus(body.identityStatus, body.status);
}

export function rejectionNoteFromMetamapResource(
  body: MetamapVerificationResource,
  outcome: MetamapVerificationOutcome,
): string | null {
  if (outcome !== "rejected") return null;
  return rejectionNoteFromWebhookBody(body) ?? "Verification rejected by MetaMap";
}
