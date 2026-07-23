/** Shared types for partner promo dashboard (safe for client + server). */

export const PARTNER_FREE_SEATS_MAX = 2;
/** Paid confirmations via promo to unlock the partner's own free seat. */
export const PARTNER_SEAT_1_AT = 3;
/** Paid confirmations via promo to unlock the second free seat. */
export const PARTNER_SEAT_2_AT = 10;

/** @deprecated use PARTNER_FREE_SEATS_MAX */
export const PARTNER_FREE_SEATS = PARTNER_FREE_SEATS_MAX;
/** @deprecated use PARTNER_SEAT_2_AT — kept for older copy that meant “full unlock”. */
export const PARTNER_FREE_SEATS_THRESHOLD = PARTNER_SEAT_2_AT;

export function partnerFreeSeatsEarned(confirmedPaid: number): number {
  if (confirmedPaid >= PARTNER_SEAT_2_AT) return 2;
  if (confirmedPaid >= PARTNER_SEAT_1_AT) return 1;
  return 0;
}

export type PartnerDashboardSignup = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  whatsappUrl: string | null;
  paymentStatus: string;
  confirmed: boolean;
  ticketCode: string | null;
  cashbackUsd: number | null;
  createdAt: string;
};

export type PartnerDashboardStats = {
  promo: {
    code: string;
    orgName: string;
    partnerName: string | null;
    discountPercent: number;
    cashbackPerPaidUsd: number;
    shareUrl: string;
    active: boolean;
  };
  edition: {
    id: string;
    nameFr: string;
    nameEn: string;
  } | null;
  totals: {
    signups: number;
    confirmed: number;
    pending: number;
    cashbackUsd: number;
  };
  rewards: {
    seatsMax: number;
    seatsEarned: number;
    seat1At: number;
    seat2At: number;
    nextSeatAt: number | null;
    nextSeatRemaining: number;
    /** @deprecated use seatsEarned >= 1 */
    freeSeats: number;
    /** @deprecated use seat2At */
    freeSeatsThreshold: number;
    /** @deprecated use seatsEarned >= seatsMax */
    freeSeatsUnlocked: boolean;
    /** @deprecated use nextSeatRemaining */
    freeSeatsRemaining: number;
  };
  cashback: {
    claimableUsd: number;
    claims: Array<{
      id: string;
      amountUsd: number;
      status: string;
      phoneNumber: string | null;
      providerLabel: string | null;
      payoutStatus: string | null;
      requestedAt: string;
      resolvedAt: string | null;
      note: string | null;
    }>;
  };
  auth: {
    required: boolean;
    verified: boolean;
    partnerEmailMasked: string | null;
  };
  signups: PartnerDashboardSignup[];
  updatedAt: string;
};
