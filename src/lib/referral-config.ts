/**
 * Referral (parrainage) — product defaults.
 * Reward = share of *platform fee* on the invitee's first qualifying deposit only;
 * subsequent deposits: 0% to referrer (see comments below).
 */

/** USD — minimum first deposit to count as “qualifying” (anti-spam / floor). */
export const REFERRAL_MIN_FIRST_DEPOSIT_USD = 10;

/**
 * Share of **McBuleli's fee revenue** on that first deposit paid to the referrer.
 * e.g. deposit $10 @ 5% platform fee → $0.50 platform → $0.25 to referrer at 0.5.
 */
export const REFERRAL_FIRST_DEPOSIT_FEE_SHARE_TO_REFERRER = 0.5;

/** Deposits 2…n: no referral split on deposit fees (platform keeps full margin on those). */
export const REFERRAL_SUBSEQUENT_DEPOSIT_FEE_SHARE_TO_REFERRER = 0;
