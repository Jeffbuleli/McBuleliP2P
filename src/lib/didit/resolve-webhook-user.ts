import {
  resolveUserIdByDiditSessionId,
  resolveUserIdFromVendorData,
} from "@/lib/kyc-service";

export type DiditWebhookBody = {
  vendor_data?: string;
  session_id?: string;
  metadata?: Record<string, unknown>;
};

/** Resolve McBuleli user from Didit vendor_data or stored session id. */
export async function resolveDiditWebhookUserId(
  body: DiditWebhookBody,
): Promise<string | null> {
  const fromVendor = await resolveUserIdFromVendorData(body.vendor_data);
  if (fromVendor) return fromVendor;

  const sessionId = body.session_id?.trim();
  if (sessionId) {
    return resolveUserIdByDiditSessionId(sessionId);
  }

  const metaUserId = body.metadata?.userId ?? body.metadata?.user_id;
  if (typeof metaUserId === "string") {
    return resolveUserIdFromVendorData(metaUserId);
  }

  return null;
}
