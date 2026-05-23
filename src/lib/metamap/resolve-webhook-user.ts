import {
  resolveUserIdByMetamapIdentityId,
  resolveUserIdByMetamapVerificationId,
  resolveUserIdFromMetamapMetadata,
} from "@/lib/kyc-service";
import { fetchMetamapVerification, metamapApiConfigured } from "@/lib/metamap/api";
import { normalizeMetamapMetadata } from "@/lib/metamap/normalize-metadata";
import {
  parseMetamapResourceIds,
  verificationIdFromResource,
} from "@/lib/metamap/resource-ids";

export type MetamapWebhookBody = {
  metadata?: unknown;
  resource?: string;
};

/** Resolve McBuleli user from webhook metadata and/or stored MetaMap IDs. */
export async function resolveMetamapWebhookUserId(
  body: MetamapWebhookBody,
): Promise<string | null> {
  const meta = normalizeMetamapMetadata(body.metadata);
  let userId = await resolveUserIdFromMetamapMetadata(meta);
  if (userId) return userId;

  const { identityId, verificationId } = parseMetamapResourceIds(body.resource);
  const vid =
    verificationId ?? verificationIdFromResource(body.resource);

  if (vid) {
    userId = await resolveUserIdByMetamapVerificationId(vid);
    if (userId) return userId;
  }

  if (identityId) {
    userId = await resolveUserIdByMetamapIdentityId(identityId);
    if (userId) return userId;
  }

  if (vid && metamapApiConfigured()) {
    try {
      const resource = await fetchMetamapVerification(vid);
      userId = await resolveUserIdFromMetamapMetadata(
        normalizeMetamapMetadata(resource.metadata),
      );
      if (userId) return userId;
    } catch (err) {
      console.warn("[metamap webhook] fetch verification for userId failed", err);
    }
  }

  return null;
}
