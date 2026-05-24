import crypto from "crypto";

/** OpenWA HTTP webhook envelope (docs/06-api-specification.md §6.4). */
export type OpenWaWebhookEnvelope = {
  event?: string;
  timestamp?: string;
  sessionId?: string;
  data?: OpenWaMessageData;
  /** Alternate wrapped format (WebSocket-style over HTTP). */
  type?: string;
  payload?: {
    event?: string;
    sessionId?: string;
    data?: OpenWaMessageData;
  };
};

export type OpenWaMessageData = {
  id?: string;
  messageId?: string;
  chatId?: string;
  from?: string;
  to?: string;
  body?: string;
  type?: string;
  isGroup?: boolean;
};

export type ParsedOpenWaInbound = {
  event: string;
  sessionId: string | null;
  chatId: string;
  phone: string | null;
  body: string;
};

export function verifyOpenWaWebhookSignature(args: {
  payload: unknown;
  rawBody: string;
  signatureHeader: string | null;
  secret: string;
}): boolean {
  const sig = args.signatureHeader?.trim();
  if (!sig) return false;

  const fromRaw = `sha256=${crypto
    .createHmac("sha256", args.secret)
    .update(args.rawBody)
    .digest("hex")}`;

  const fromParsed = `sha256=${crypto
    .createHmac("sha256", args.secret)
    .update(JSON.stringify(args.payload))
    .digest("hex")}`;

  for (const expected of [fromRaw, fromParsed]) {
    try {
      if (
        expected.length === sig.length &&
        crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
      ) {
        return true;
      }
    } catch {
      /* length mismatch */
    }
  }
  return false;
}

function phoneFromChatId(chatId: string): string | null {
  const m = chatId.match(/^(\d+)@/);
  return m?.[1] ?? null;
}

/** Normalize OpenWA webhook JSON into a single inbound text message, or null. */
export function parseOpenWaInboundMessage(
  body: OpenWaWebhookEnvelope,
): ParsedOpenWaInbound | null {
  const event =
    body.event ??
    (body.type === "event" ? body.payload?.event : undefined) ??
    "";
  if (event !== "message.received") return null;

  const data = body.data ?? body.payload?.data;
  if (!data) return null;

  const chatId = (data.chatId ?? data.from ?? "").trim();
  const text = (data.body ?? "").trim();
  if (!chatId || !text) return null;

  if (data.isGroup) return null;

  const sessionId = body.sessionId ?? body.payload?.sessionId ?? null;

  return {
    event,
    sessionId,
    chatId,
    phone: phoneFromChatId(chatId),
    body: text,
  };
}
