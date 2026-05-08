const PI_PLATFORM_V2 = "https://api.minepi.com/v2";

function authKeyHeader(apiKey: string): HeadersInit {
  return {
    Authorization: `Key ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export type PiRewardedAdStatus = {
  identifier: string;
  mediator_ack_status: "granted" | "revoked" | "failed" | null;
  mediator_granted_at: string | null;
  mediator_revoked_at: string | null;
};

export async function piFetchRewardedAdStatus(
  adId: string,
  apiKey: string,
): Promise<PiRewardedAdStatus> {
  const res = await fetch(
    `${PI_PLATFORM_V2}/ads_network/status/${encodeURIComponent(adId)}`,
    {
      method: "GET",
      headers: authKeyHeader(apiKey),
      cache: "no-store",
    },
  );
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    throw new Error(
      typeof json === "object" && json !== null && "message" in json
        ? String((json as { message: unknown }).message)
        : `Pi ad status failed: HTTP ${res.status}`,
    );
  }
  return json as PiRewardedAdStatus;
}

