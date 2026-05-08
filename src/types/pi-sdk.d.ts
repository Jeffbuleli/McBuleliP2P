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
      nativeFeaturesList?: () => Promise<string[]>;
      createPayment?: (
        payment: {
          amount: number;
          memo: string;
          metadata: Record<string, unknown>;
        },
        callbacks: {
          onReadyForServerApproval: (paymentId: string) => void | Promise<void>;
          onReadyForServerCompletion: (
            paymentId: string,
            txid: string,
          ) => void | Promise<void>;
          onCancel: (paymentId: string) => void;
          onError: (error: Error, payment?: unknown) => void;
        },
      ) => void;
      Ads?: {
        showAd: (
          adType: "interstitial" | "rewarded",
        ) => Promise<
          | {
              type: "interstitial";
              result:
                | "AD_CLOSED"
                | "AD_DISPLAY_ERROR"
                | "AD_NETWORK_ERROR"
                | "AD_NOT_AVAILABLE";
            }
          | {
              type: "rewarded";
              result:
                | "AD_REWARDED"
                | "AD_CLOSED"
                | "AD_DISPLAY_ERROR"
                | "AD_NETWORK_ERROR"
                | "AD_NOT_AVAILABLE"
                | "ADS_NOT_SUPPORTED"
                | "USER_UNAUTHENTICATED";
              adId?: string;
            }
        >;
        isAdReady: (
          adType: "interstitial" | "rewarded",
        ) => Promise<{ type: "interstitial" | "rewarded"; ready: boolean }>;
        requestAd: (
          adType: "interstitial" | "rewarded",
        ) => Promise<{
          type: "interstitial" | "rewarded";
          result: "AD_LOADED" | "AD_FAILED_TO_LOAD" | "AD_NOT_AVAILABLE" | "ADS_NOT_SUPPORTED";
        }>;
      };
    };
  }
}

