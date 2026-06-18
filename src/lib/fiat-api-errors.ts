/** Log provider/technical errors server-side — never expose `detail` to end users. */
export function logFiatApiError(scope: string, detail: string | null | undefined): void {
  if (detail?.trim()) {
    console.error(`[fiat:${scope}]`, detail.trim());
  }
}

export function sanitizeFiatTxForUser<T extends {
  failureCode?: string | null;
  failureMessage?: string | null;
  meta?: Record<string, unknown> | null;
}>(tx: T): T {
  const meta = tx.meta ? { ...tx.meta } : null;
  if (meta) {
    delete meta.initiation;
    delete meta.remote;
    delete meta.checkoutUrl;
  }
  return {
    ...tx,
    failureCode: null,
    failureMessage: tx.failureMessage ? "wallet_fiat_status_failed" : null,
    meta,
  };
}
