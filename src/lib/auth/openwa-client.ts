/** OpenWA session model - https://github.com/rmyndharis/OpenWA (Swagger /api/sessions). */
export type OpenWaSession = {
  id: string;
  name: string;
  status: string;
  phone?: number | string;
  phoneNumber?: string;
  pushName?: string;
  connectedAt?: string;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
  qr?: string | null;
};

type OpenWaApiResponse<T> = {
  success?: boolean;
  data?: T;
  message?: string;
};

export type OpenWaClientConfig = {
  base: string;
  apiKey: string;
  sessionId: string;
};

let cachedPhone: { value: string | null; at: number } | null = null;
const PHONE_CACHE_MS = 5 * 60 * 1000;

export function readOpenWaConfig(): OpenWaClientConfig | null {
  const base = process.env.OPENWA_API_BASE?.trim()?.replace(/\/$/, "");
  const apiKey = process.env.OPENWA_API_KEY?.trim();
  const sessionId = process.env.OPENWA_SESSION_ID?.trim();
  if (!base || !apiKey || !sessionId) return null;
  return { base, apiKey, sessionId };
}

export function isOpenWaConfigured(): boolean {
  return readOpenWaConfig() !== null;
}

export function isOpenWaSessionLive(status: string): boolean {
  const s = status.toLowerCase();
  return s === "ready" || s === "connected" || s === "authenticated";
}

function normalizePhone(raw: number | string | undefined | null): string | null {
  if (raw == null || raw === "") return null;
  const digits = String(raw).replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}

function sessionPhone(session: OpenWaSession): string | null {
  return normalizePhone(session.phoneNumber ?? session.phone);
}

async function openWaFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
  const cfg = readOpenWaConfig();
  if (!cfg) {
    return { ok: false, status: 0, message: "openwa_not_configured" };
  }

  const res = await fetch(`${cfg.base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": cfg.apiKey,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  }).catch(() => null);

  if (!res) {
    return { ok: false, status: 0, message: "openwa_unreachable" };
  }

  const json = (await res.json().catch(() => null)) as OpenWaApiResponse<T> | T | null;
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json && typeof json.message === "string"
        ? json.message
        : `openwa_http_${res.status}`;
    return { ok: false, status: res.status, message: msg };
  }

  const data =
    json && typeof json === "object" && "data" in json
      ? (json as OpenWaApiResponse<T>).data
      : (json as T);

  if (data == null) {
    return { ok: false, status: res.status, message: "openwa_empty_response" };
  }

  return { ok: true, data };
}

/** GET /api/sessions/:sessionId */
export async function getOpenWaSession(
  sessionId?: string,
): Promise<OpenWaSession | null> {
  const cfg = readOpenWaConfig();
  if (!cfg) return null;
  const id = sessionId ?? cfg.sessionId;
  const out = await openWaFetch<OpenWaSession>(
    `/api/sessions/${encodeURIComponent(id)}`,
  );
  return out.ok ? out.data : null;
}

/** POST /api/sessions - body matches Swagger (name + optional config). */
export async function createOpenWaSession(args: {
  name: string;
  autoReconnect?: boolean;
  proxyUrl?: string;
  proxyType?: string;
  webhook?: {
    url: string;
    events: string[];
    secret?: string;
  };
}): Promise<OpenWaSession | null> {
  const body: Record<string, unknown> = {
    name: args.name,
    config: { autoReconnect: args.autoReconnect ?? true },
  };
  if (args.proxyUrl) {
    body.proxyUrl = args.proxyUrl;
    body.proxyType = args.proxyType ?? "http";
  }
  if (args.webhook) {
    body.webhook = args.webhook;
  }

  const out = await openWaFetch<OpenWaSession>("/api/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return out.ok ? out.data : null;
}

/** POST /api/sessions/:sessionId/webhooks */
export async function registerOpenWaWebhook(args: {
  sessionId?: string;
  url: string;
  secret: string;
  events?: string[];
}): Promise<boolean> {
  const cfg = readOpenWaConfig();
  if (!cfg) return false;
  const sessionId = args.sessionId ?? cfg.sessionId;

  const out = await openWaFetch<unknown>(
    `/api/sessions/${encodeURIComponent(sessionId)}/webhooks`,
    {
      method: "POST",
      body: JSON.stringify({
        url: args.url,
        secret: args.secret,
        events: args.events ?? ["message.received"],
      }),
    },
  );
  return out.ok;
}

/** McBuleli WhatsApp number for wa.me - env override, else live session phone. */
export async function getOpenWaMcBuleliPhone(): Promise<string | null> {
  const fromEnv = normalizePhone(process.env.OPENWA_MCBULELI_NUMBER);
  if (fromEnv) return fromEnv;

  const now = Date.now();
  if (cachedPhone && now - cachedPhone.at < PHONE_CACHE_MS) {
    return cachedPhone.value;
  }

  const session = await getOpenWaSession();
  const phone =
    session && isOpenWaSessionLive(session.status) ? sessionPhone(session) : null;

  cachedPhone = { value: phone, at: now };
  return phone;
}

export async function getOpenWaHealth(): Promise<{
  configured: boolean;
  session: OpenWaSession | null;
  phone: string | null;
  webhookUrl: string;
}> {
  const configured = isOpenWaConfigured();
  const session = configured ? await getOpenWaSession() : null;
  const phone = session && isOpenWaSessionLive(session.status)
    ? sessionPhone(session)
    : normalizePhone(process.env.OPENWA_MCBULELI_NUMBER);

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "https://mcbuleli.org";

  return {
    configured,
    session,
    phone,
    webhookUrl: `${appUrl}/api/webhooks/openwa/inbound`,
  };
}
