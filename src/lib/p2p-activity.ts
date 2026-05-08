import { listUserOrders } from "@/lib/p2p-service";

export type P2pActivityItem = {
  id: string;
  status: string;
  asset: string;
  fiatCurrency: string;
  fiatAmount: string;
  cryptoAmount: string;
  role: "maker" | "taker";
  createdAt: string;
};

export type P2pHomeActivity = {
  items: P2pActivityItem[];
  inProgressCount: number;
  disputedCount: number;
};

function isInProgress(status: string): boolean {
  return status === "awaiting_payment" || status === "paid" || status === "disputed";
}

export async function loadP2pHomeActivity(args: {
  userId: string;
  limit?: number;
}): Promise<P2pHomeActivity> {
  const { userId } = args;
  const limit = Math.max(1, Math.min(20, args.limit ?? 8));

  const orders = await listUserOrders(userId);
  const items = orders.slice(0, limit).map((o): P2pActivityItem => ({
    id: o.id,
    status: o.status,
    asset: o.asset,
    fiatCurrency: o.fiatCurrency,
    fiatAmount: o.fiatAmount,
    cryptoAmount: o.cryptoAmount,
    role: o.role,
    createdAt: o.createdAt,
  }));

  let inProgressCount = 0;
  let disputedCount = 0;
  for (const o of orders) {
    if (isInProgress(o.status)) inProgressCount += 1;
    if (o.status === "disputed") disputedCount += 1;
  }

  return {
    items,
    inProgressCount,
    disputedCount,
  };
}

