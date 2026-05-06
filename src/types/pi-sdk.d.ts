export {};

declare global {
  interface Window {
    Pi?: {
      init: (args: Record<string, unknown>) => unknown;
      authenticate: (
        scopes: string[],
        onIncompletePaymentFound?: (
          payment: unknown,
        ) => void | Promise<void>,
      ) => unknown;
      createPayment?: (
        payment: {
          amount: number;
          memo: string;
          metadata?: Record<string, unknown>;
        },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
          onReadyForServerCompletion: (
            paymentId: string,
            txid: string,
          ) => void | Promise<void>;
          onCancel?: (error: unknown) => void;
        },
      ) => unknown;
    };
  }
}

