const PI_PLATFORM_V2 = "https://api.minepi.com/v2";

function authKeyHeader(apiKey: string): HeadersInit {
  return {
    Authorization: `Key ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function piApprovePaymentPlatform(
  paymentId: string,
  apiKey: string,
): Promise<unknown> {
  const res = await fetch(
    `${PI_PLATFORM_V2}/payments/${encodeURIComponent(paymentId)}/approve`,
    {
      method: "POST",
      headers: authKeyHeader(apiKey),
      body: JSON.stringify({}),
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
        : `Pi approve failed: HTTP ${res.status}`,
    );
  }
  return json;
}

export async function piCompletePaymentPlatform(
  paymentId: string,
  txid: string,
  apiKey: string,
): Promise<unknown> {
  const res = await fetch(
    `${PI_PLATFORM_V2}/payments/${encodeURIComponent(paymentId)}/complete`,
    {
      method: "POST",
      headers: authKeyHeader(apiKey),
      body: JSON.stringify({ txid }),
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
        : `Pi complete failed: HTTP ${res.status}`,
    );
  }
  return json;
}

export async function piCreateA2UPaymentPlatform(args: {
  uid: string;
  amount: number;
  memo: string;
  metadata?: Record<string, unknown>;
  apiKey: string;
}): Promise<unknown> {
  const res = await fetch(`${PI_PLATFORM_V2}/payments`, {
    method: "POST",
    headers: authKeyHeader(args.apiKey),
    body: JSON.stringify({
      payment: {
        amount: args.amount,
        memo: args.memo,
        metadata: args.metadata ?? {},
        uid: args.uid,
      },
    }),
    cache: "no-store",
  });
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
        : `Pi create payment failed: HTTP ${res.status}`,
    );
  }
  return json;
}

export async function piFetchPaymentPlatform(
  paymentId: string,
  apiKey: string,
): Promise<unknown> {
  const res = await fetch(`${PI_PLATFORM_V2}/payments/${encodeURIComponent(paymentId)}`, {
    method: "GET",
    headers: authKeyHeader(apiKey),
    cache: "no-store",
  });
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
        : `Pi fetch payment failed: HTTP ${res.status}`,
    );
  }
  return json;
}

export type PiPaymentDtoLike = {
  identifier?: string;
  status?: {
    developer_approved?: boolean;
    developer_completed?: boolean;
  };
  transaction?: null | { txid?: string };
};

export function extractPaymentId(payment: unknown): string | null {
  if (!payment || typeof payment !== "object") return null;
  const id = (payment as { identifier?: unknown }).identifier;
  return typeof id === "string" && id.length > 0 ? id : null;
}
