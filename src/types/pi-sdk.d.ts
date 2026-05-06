export {};

declare global {
  interface Window {
    Pi?: {
      init: (args: Record<string, unknown>) => unknown;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (...args: unknown[]) => void,
      ) => unknown;
    };
  }
}

