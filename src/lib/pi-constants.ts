/** OKX chain name for Pi Network deposits (see OKX “Deposit” UI or API currencies). */
export function getPiOkxChain(): string {
  return process.env.OKX_PI_CHAIN?.trim() || "Pi";
}

export const PI_MAIN_NETWORK_ID = "PI_MAIN" as const;
