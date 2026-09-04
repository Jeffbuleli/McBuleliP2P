import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from "@simplewebauthn/server";

const PRODUCTION_PASSKEY_ORIGINS = [
  "https://mcbuleli.com",
  "https://www.mcbuleli.com",
  "https://mcbuleli.org",
  "https://www.mcbuleli.org",
] as const;

/**
 * RP ID for all McBuleli passkeys.
 * Keep `mcbuleli.org` so credentials registered before the .com cutover still work.
 * `.com` uses them via Related Origin Requests (/.well-known/webauthn on the RP ID host).
 */
export function webAuthnRpId(): string {
  const fromEnv = process.env.WEBAUTHN_RP_ID?.trim();
  if (fromEnv) {
    // Browsers require rpId to be a registrable domain.
    // Public suffixes like "org" (no dot) are rejected and can break passkeys.
    if (fromEnv.includes(".")) {
      return fromEnv;
    }
  }
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "https://mcbuleli.com";
  try {
    const host = new URL(base).hostname;
    // Prefer legacy .org RP ID when serving production .com so old passkeys keep working.
    if (host === "mcbuleli.com" || host === "www.mcbuleli.com") {
      return "mcbuleli.org";
    }
    return host;
  } catch {
    return "localhost";
  }
}

export function webAuthnOrigin(): string {
  const fromEnv = process.env.WEBAUTHN_ORIGIN?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

/** Origins accepted in clientDataJSON (primary site + legacy .org). */
export function webAuthnExpectedOrigins(): string | string[] {
  const fromEnv = process.env.WEBAUTHN_ORIGINS?.trim();
  if (fromEnv) {
    const list = fromEnv
      .split(",")
      .map((s) => s.trim().replace(/\/$/, ""))
      .filter(Boolean);
    if (list.length === 1) return list[0]!;
    if (list.length > 1) return list;
  }

  const primary = webAuthnOrigin();
  try {
    const host = new URL(primary).hostname;
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".localhost")
    ) {
      return primary;
    }
  } catch {
    return primary;
  }

  const set = new Set<string>([primary, ...PRODUCTION_PASSKEY_ORIGINS]);
  return [...set];
}

/** Origins listed in https://{rpId}/.well-known/webauthn for Related Origin Requests. */
export function webAuthnRelatedOrigins(): string[] {
  const expected = webAuthnExpectedOrigins();
  const list = Array.isArray(expected) ? expected : [expected];
  return list.filter((o) => o.startsWith("https://"));
}

export function webAuthnRpName(): string {
  return "McBuleli";
}

export type StoredPasskeyMeta = {
  credentialId: string;
  publicKey: string;
  counter: number;
  deviceName: string | null;
  transports: AuthenticatorTransportFuture[] | null;
  deviceType?: CredentialDeviceType;
};
