import type { KycStatusPayload } from "@/lib/kyc-status-payload";

export async function fetchKycStatus(): Promise<KycStatusPayload | null> {
  const res = await fetch("/api/kyc/status", {
    cache: "no-store",
    credentials: "include",
  });
  if (!res.ok) return null;
  return (await res.json()) as KycStatusPayload;
}

export async function syncKycEvent(
  event: "started" | "finished" | "exited" | "already_verified",
  detail?: { identityId?: string; verificationId?: string },
): Promise<void> {
  await fetch("/api/kyc/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      identityId: detail?.identityId,
      verificationId: detail?.verificationId,
    }),
  });
}

export async function refreshKycFromMetamap(): Promise<KycStatusPayload | null> {
  const res = await fetch("/api/kyc/refresh", {
    method: "POST",
    credentials: "include",
  });
  const j = (await res.json().catch(() => ({}))) as {
    kyc?: KycStatusPayload;
  };
  return j.kyc ?? null;
}
