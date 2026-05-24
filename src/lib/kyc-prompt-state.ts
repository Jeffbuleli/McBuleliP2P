const STORAGE_UNTIL = "mb_kyc_prompt_dismiss_until";

/** Remind again after user taps "Later". */
export const KYC_PROMPT_DISMISS_MS = 24 * 60 * 60 * 1000;

export function kycPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const until = localStorage.getItem(STORAGE_UNTIL);
    if (!until) return false;
    return Date.now() < Number(until);
  } catch {
    return false;
  }
}

export function dismissKycPrompt(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_UNTIL, String(Date.now() + KYC_PROMPT_DISMISS_MS));
  } catch {
    // ignore
  }
}

export function clearKycPromptDismiss(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_UNTIL);
  } catch {
    // ignore
  }
}
