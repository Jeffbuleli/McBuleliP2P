export class PiNetworkApiKeyMissingError extends Error {
  constructor() {
    super(
      "PI_NETWORK_API_KEY is not configured. Add your Pi App Platform Server API key to the server environment (e.g. Render → Environment).",
    );
    this.name = "PiNetworkApiKeyMissingError";
  }
}

/** Pi App Platform Server API Key — server-side only (approve / complete payments). */
export function getPiNetworkApiKey(): string {
  const s = process.env.PI_NETWORK_API_KEY?.trim();
  if (!s) {
    throw new PiNetworkApiKeyMissingError();
  }
  return s;
}
