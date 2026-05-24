import type {
  AuthenticatorTransportFuture,
  CredentialDeviceType,
} from "@simplewebauthn/server";

export function webAuthnRpId(): string {
  const fromEnv = process.env.WEBAUTHN_RP_ID?.trim();
  if (fromEnv) return fromEnv;
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? "https://mcbuleli.org";
  try {
    return new URL(base).hostname;
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
