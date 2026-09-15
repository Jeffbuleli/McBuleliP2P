/**
 * Payment provider abstraction for eAVEC group money movements.
 * Current production path: McBuleli USDT wallet ledger.
 * Sandbox/mock is explicitly labeled — never silently pretend to be live rails.
 */

export type PaymentKind =
  | "contribution"
  | "deposit"
  | "repayment"
  | "disbursement"
  | "payout";

export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export type PaymentIntent = {
  reference: string;
  kind: PaymentKind;
  groupId: string;
  userId: string;
  amountUsdt: number;
  currency: "USDT" | "CDF" | "USD";
  provider: string;
  status: PaymentStatus;
  sandbox: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
};

export interface PaymentProvider {
  readonly id: string;
  readonly sandbox: boolean;
  createIntent(args: {
    kind: PaymentKind;
    groupId: string;
    userId: string;
    amountUsdt: number;
    currency?: PaymentIntent["currency"];
    meta?: Record<string, unknown>;
  }): Promise<PaymentIntent>;
}

function ref(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/** Live adapter: records intent metadata; actual settlement stays in group-savings ledger. */
export class UsdtWalletPaymentProvider implements PaymentProvider {
  readonly id = "usdt_wallet";
  readonly sandbox = false;

  async createIntent(args: {
    kind: PaymentKind;
    groupId: string;
    userId: string;
    amountUsdt: number;
    currency?: PaymentIntent["currency"];
    meta?: Record<string, unknown>;
  }): Promise<PaymentIntent> {
    return {
      reference: ref("avec_usdt"),
      kind: args.kind,
      groupId: args.groupId,
      userId: args.userId,
      amountUsdt: args.amountUsdt,
      currency: args.currency ?? "USDT",
      provider: this.id,
      status: "pending",
      sandbox: false,
      createdAt: new Date().toISOString(),
      meta: args.meta,
    };
  }
}

/**
 * Explicit sandbox/mock provider for hackathon demos without live credentials.
 * Status is always success after create — labeled sandbox: true.
 */
export class SandboxPaymentProvider implements PaymentProvider {
  readonly id = "sandbox_mock";
  readonly sandbox = true;

  async createIntent(args: {
    kind: PaymentKind;
    groupId: string;
    userId: string;
    amountUsdt: number;
    currency?: PaymentIntent["currency"];
    meta?: Record<string, unknown>;
  }): Promise<PaymentIntent> {
    return {
      reference: ref("avec_sandbox"),
      kind: args.kind,
      groupId: args.groupId,
      userId: args.userId,
      amountUsdt: args.amountUsdt,
      currency: args.currency ?? "USDT",
      provider: this.id,
      status: "success",
      sandbox: true,
      createdAt: new Date().toISOString(),
      meta: { ...args.meta, note: "SANDBOX_ONLY_NOT_REAL_MONEY" },
    };
  }
}

export function getAvecPaymentProvider(): PaymentProvider {
  const mode = (process.env.EAVEC_PAYMENT_MODE ?? "wallet").trim().toLowerCase();
  if (mode === "sandbox" || mode === "mock") {
    return new SandboxPaymentProvider();
  }
  return new UsdtWalletPaymentProvider();
}
