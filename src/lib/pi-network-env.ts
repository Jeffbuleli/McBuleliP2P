export class PiNetworkApiKeyMissingError extends Error {
  constructor() {
    super(
      "PI_NETWORK_API_KEY is not configured. Add your Pi App Platform Server API key to the server environment (e.g. Render → Environment).",
    );
    this.name = "PiNetworkApiKeyMissingError";
  }
}

/** Missing **testnet** server key when handling a sandbox Pi Platform payment. */
export class PiNetworkTestApiKeyMissingError extends Error {
  constructor() {
    super(
      "PI_NETWORK_API_KEY_TEST is not configured. Add your Pi Testnet Server API key from the Testnet app (Develop → API Key) so sandbox approve/complete calls succeed.",
    );
    this.name = "PiNetworkTestApiKeyMissingError";
  }
}

/** Pi App Platform Server API Key — server-side only (approve / complete payments). Mainnet / production. */
export function getPiNetworkApiKey(): string {
  const s = process.env.PI_NETWORK_API_KEY?.trim();
  if (!s) {
    throw new PiNetworkApiKeyMissingError();
  }
  return s;
}

/**
 * Pi App Platform keys differ between Mainnet and Testnet. Use the key that matches
 * `Pi.init({ sandbox })` on the client (`NEXT_PUBLIC_PI_SANDBOX` or sandbox.minepi.com).
 */
export function getPiNetworkApiKeyForSandbox(sandbox: boolean): string {
  if (sandbox) {
    const s = process.env.PI_NETWORK_API_KEY_TEST?.trim();
    if (!s) {
      throw new PiNetworkTestApiKeyMissingError();
    }
    return s;
  }
  return getPiNetworkApiKey();
}

const PI_SANDBOX_META_KEYS = ["piSandbox", "sandbox", "isSandbox"] as const;

/** True if payment row metadata marks this U2A flow as Pi Test / sandbox SDK. */
export function piSandboxFromMeta(meta: Record<string, unknown> | null | undefined): boolean {
  if (!meta || typeof meta !== "object") return false;
  for (const k of PI_SANDBOX_META_KEYS) {
    const v = meta[k];
    if (v === true) return true;
    if (v === "true" || v === "1") return true;
  }
  return false;
}
