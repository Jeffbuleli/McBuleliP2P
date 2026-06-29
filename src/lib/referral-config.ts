import { MIN_DEPOSIT_USDT_FIRST } from "@/lib/usdt-deposit-constants";

/**
 * Referral (parrainage) - product defaults.
 * Fiat: share of **platform fee** on first qualifying deposit; USDT on-chain: fixed $1 (see below).
 * Subsequent deposits: 0% to referrer.
 */

/** USD - minimum first *fiat* first deposit to count as qualifying (Pawapay, etc.). */
export const REFERRAL_MIN_FIRST_DEPOSIT_USD = 10;

/** On-chain USDT: same floor as first deposit minimum (`MIN_DEPOSIT_USDT_FIRST`). */
export const REFERRAL_USDT_FIRST_MIN_GROSS_USDT = MIN_DEPOSIT_USDT_FIRST;

/** On-chain USDT: fixed USDT paid to the referrer when the first deposit meets `REFERRAL_USDT_FIRST_MIN_GROSS_USDT`. */
export const REFERRAL_USDT_FIRST_REFERRER_REWARD_USDT = 1;

/**
 * Share of **McBuleli's fee revenue** on that first deposit paid to the referrer.
 * e.g. deposit $10 @ 5% platform fee → $0.50 platform → $0.25 to referrer at 0.5.
 */
export const REFERRAL_FIRST_DEPOSIT_FEE_SHARE_TO_REFERRER = 0.5;

/** Deposits 2…n: no referral split on deposit fees (platform keeps full margin on those). */
export const REFERRAL_SUBSEQUENT_DEPOSIT_FEE_SHARE_TO_REFERRER = 0;

/**
 * On-chain **PI**: credited 100% with no separate fee line - **notional** rate for referral math.
 * **USDT** on-chain: fixed reward via `REFERRAL_USDT_FIRST_*` (not this rate).
 */
export const REFERRAL_CRYPTO_DEPOSIT_NOTIONAL_FEE_RATE = 0.05;
