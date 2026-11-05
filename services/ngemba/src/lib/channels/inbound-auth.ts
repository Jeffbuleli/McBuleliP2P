import { readEnvKey } from "@/lib/env";

export function verifyChannelInboundAuth(req: Request): boolean {
  const secret = readEnvKey("NGEMBA_CHANNEL_INBOUND_SECRET");
  if (!secret || secret.length < 16) return false;
  const header = req.headers.get("authorization")?.trim() ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return false;
  return match[1] === secret;
}
