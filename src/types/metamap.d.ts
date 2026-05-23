type MetamapSdkDetail = {
  identityId?: string;
  verificationId?: string;
  screen?: string;
};

type MetamapSdkEvent = { detail: MetamapSdkDetail | null };

type MetamapVerificationConfig = {
  clientId: string;
  flowId: string;
  metadata?: Record<string, string>;
  language?: string;
  color?: string;
  /** Resume an existing identity (required with verificationId). */
  identityId?: string;
  /** Continue a previous verification attempt. */
  verificationId?: string;
};

interface MetamapVerificationInstance {
  start(): void;
  on(event: string, handler: (ev: MetamapSdkEvent) => void): void;
  off(event: string, handler: (ev: MetamapSdkEvent) => void): void;
}

interface Window {
  MetamapVerification?: new (
    config: MetamapVerificationConfig,
  ) => MetamapVerificationInstance;
}
