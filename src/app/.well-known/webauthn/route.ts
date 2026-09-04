import {
  webAuthnOrigin,
  webAuthnRelatedOrigins,
} from "@/lib/auth/passkeys-config";

/**
 * Related Origin Requests (WebAuthn L3): browsers fetch this from the RP ID host
 * (mcbuleli.org) to allow passkeys scoped to that RP ID on listed origins (mcbuleli.com).
 * @see https://web.dev/articles/webauthn-related-origin-requests
 */
export function GET() {
  const origins = webAuthnRelatedOrigins();
  // Always include the primary app origin if somehow missing.
  const primary = webAuthnOrigin();
  const list = origins.includes(primary) ? origins : [primary, ...origins];

  return Response.json(
    { origins: list },
    {
      headers: {
        "Cache-Control": "public, max-age=3600",
      },
    },
  );
}
