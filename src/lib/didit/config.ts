/** Didit KYC — https://docs.didit.me/ */

export function diditApiKey(): string {
  return process.env.DIDIT_API_KEY?.trim() ?? "";
}

export function diditWorkflowId(): string {
  return process.env.DIDIT_WORKFLOW_ID?.trim() ?? "";
}

export function diditWebhookSecret(): string {
  return process.env.DIDIT_WEBHOOK_SECRET?.trim() ?? "";
}

export function diditConfigured(): boolean {
  return Boolean(diditApiKey() && diditWorkflowId());
}

export function diditAppCallbackUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ??
    "https://mcbuleli.org";
  return `${base}/app/profile/kyc?done=1`;
}
