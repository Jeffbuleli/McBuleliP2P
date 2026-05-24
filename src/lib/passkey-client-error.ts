import type { Messages } from "@/i18n/messages";

type TFn = (k: keyof Messages) => string;

/** User-friendly passkey / WebAuthn errors — never show raw browser messages or spec URLs. */
export function passkeyClientErrorText(t: TFn, err: unknown): string {
  if (!(err instanceof Error)) {
    return t("auth_passkey_failed");
  }

  const name = err.name;
  const msg = err.message.toLowerCase();

  if (
    name === "AbortError" ||
    msg.includes("cancel") ||
    msg.includes("aborted") ||
    msg.includes("user denied") ||
    msg.includes("user cancelled") ||
    msg.includes("not allowed")
  ) {
    return t("auth_passkey_cancelled");
  }

  if (name === "TimeoutError" || msg.includes("timed out") || msg.includes("timeout")) {
    return t("auth_passkey_timeout");
  }

  if (name === "SecurityError" || msg.includes("security")) {
    return t("auth_passkey_security");
  }

  if (name === "InvalidStateError") {
    return t("auth_passkey_invalid_state");
  }

  return t("auth_passkey_failed");
}
