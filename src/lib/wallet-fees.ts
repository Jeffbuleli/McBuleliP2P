/** Mobile money fiat deposit / withdrawal — platform fee (shown to user). */
export const FIAT_FEE_RATE = 0.05;

/** Fixed swap fee in USD, settled from USDT balance first, then USD pocket. */
export const SWAP_FEE_USD = 1;

/** Minimum gross USD notional for a swap (must cover fee + dust). */
export const SWAP_MIN_GROSS_USD = SWAP_FEE_USD + 0.01;
