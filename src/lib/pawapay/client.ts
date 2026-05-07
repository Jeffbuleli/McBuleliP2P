import { getPawapayApiToken, getPawapayBaseUrl } from "@/lib/env";

export type PawapayAccountDetails = {
  phoneNumber: string;
  provider: string;
};

export type PawapayParty = {
  type: "MMO";
  accountDetails: PawapayAccountDetails;
};

export type PawapayInitiationStatus = "ACCEPTED" | "REJECTED" | "DUPLICATE_IGNORED";

export type PawapayFailureReason = {
  failureCode?: string;
  failureMessage?: string;
};

export type PawapayCreateDepositResponse = {
  depositId: string | null;
  status: PawapayInitiationStatus;
  created?: string;
  failureReason?: PawapayFailureReason;
};

export type PawapayCreatePayoutResponse = {
  payoutId: string | null;
  status: PawapayInitiationStatus;
  created?: string;
  failureReason?: PawapayFailureReason;
};

async function pawapayPost<T>(path: string, body: unknown): Promise<T> {
  const baseUrl = getPawapayBaseUrl();
  const token = getPawapayApiToken();
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json().catch(() => null)) as T | null;
  if (!json) {
    throw new Error(`PawaPay responded with HTTP ${res.status}`);
  }
  return json;
}

export type PawapayActiveConfCountry = {
  country: string;
  prefix?: string;
  providers?: Array<{
    provider: string;
    displayName?: string;
    logo?: string;
    currencies?: Array<{
      currency: string;
      operationTypes?: Array<Record<string, unknown>>;
    }>;
  }>;
};

export type PawapayActiveConfResponse = {
  companyName?: string;
  countries?: PawapayActiveConfCountry[];
};

export async function pawapayActiveConfiguration(args?: {
  country?: string;
  operationType?: "DEPOSIT" | "PAYOUT" | "REFUND";
}): Promise<PawapayActiveConfResponse> {
  const baseUrl = getPawapayBaseUrl();
  const token = getPawapayApiToken();
  const qs = new URLSearchParams();
  if (args?.country) qs.set("country", args.country);
  if (args?.operationType) qs.set("operationType", args.operationType);

  const res = await fetch(`${baseUrl}/v2/active-conf${qs.size ? `?${qs.toString()}` : ""}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  const json = (await res.json().catch(() => null)) as PawapayActiveConfResponse | null;
  if (!json) {
    throw new Error(`PawaPay responded with HTTP ${res.status}`);
  }
  return json;
}

export async function pawapayInitiateDeposit(args: {
  depositId: string;
  amount: string;
  currency: "USD" | "CDF" | string;
  payer: PawapayParty;
  metadata?: Record<string, string>;
  customerMessage?: string;
  clientReferenceId?: string;
}): Promise<PawapayCreateDepositResponse> {
  return pawapayPost<PawapayCreateDepositResponse>("/v2/deposits", {
    depositId: args.depositId,
    amount: args.amount,
    currency: args.currency,
    payer: args.payer,
    metadata: args.metadata,
    customerMessage: args.customerMessage,
    clientReferenceId: args.clientReferenceId,
  });
}

export async function pawapayInitiatePayout(args: {
  payoutId: string;
  amount: string;
  currency: "USD" | "CDF" | string;
  recipient: PawapayParty;
  metadata?: Record<string, string>;
  customerMessage?: string;
  clientReferenceId?: string;
}): Promise<PawapayCreatePayoutResponse> {
  return pawapayPost<PawapayCreatePayoutResponse>("/v2/payouts", {
    payoutId: args.payoutId,
    amount: args.amount,
    currency: args.currency,
    recipient: args.recipient,
    metadata: args.metadata,
    customerMessage: args.customerMessage,
    clientReferenceId: args.clientReferenceId,
  });
}

