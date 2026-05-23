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
  event: "started" | "finished" | "cancelled",
  detail?: { sessionId?: string },
): Promise<void> {
  await fetch("/api/kyc/sync", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      sessionId: detail?.sessionId,
    }),
  });
}

export async function refreshKycFromDidit(): Promise<KycStatusPayload | null> {
  const res = await fetch("/api/kyc/refresh", {
    method: "POST",
    credentials: "include",
  });
  const j = (await res.json().catch(() => ({}))) as {
    kyc?: KycStatusPayload;
  };
  return j.kyc ?? null;
}
