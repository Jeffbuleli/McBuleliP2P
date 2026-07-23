/** Shared types for partner promo dashboard (safe for client + server). */

export const PARTNER_FREE_SEATS = 2;
/** Paid confirmations via promo required to unlock free partner seats. */
export const PARTNER_FREE_SEATS_THRESHOLD = 10;

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
    freeSeats: number;
    freeSeatsThreshold: number;
    freeSeatsUnlocked: boolean;
    freeSeatsRemaining: number;
  };
  cashback: {
    claimableUsd: number;
    claims: Array<{
      id: string;
      amountUsd: number;
      status: string;
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
