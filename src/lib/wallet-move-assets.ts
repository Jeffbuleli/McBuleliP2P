import { and, eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";
import type { WalletAsset } from "@/lib/wallet-types";

/** Drizzle db or transaction handle (same surface for updates). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbLike = any;

/**
 * Debit a wallet pocket atomically.
 * Uses `UPDATE … WHERE balance >= amt` so concurrent requests cannot
 * push the balance negative (TOCTOU / double-spend).
 * Throws `wallet_insufficient_balance` if the row is not updated.
 */
export async function debitUserAsset(
  tx: DbLike,
  userId: string,
  asset: WalletAsset,
  amtStr: string,
) {
  switch (asset) {
    case "USDT": {
      const [row] = await tx
        .update(users)
        .set({ balance: sql`${users.balance} - ${amtStr}::numeric` })
        .where(
          and(eq(users.id, userId), sql`${users.balance} >= ${amtStr}::numeric`),
        )
        .returning({ id: users.id });
      if (!row) throw new Error("wallet_insufficient_balance");
      break;
    }
    case "PI": {
      const [row] = await tx
        .update(users)
        .set({ piBalance: sql`${users.piBalance} - ${amtStr}::numeric` })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.piBalance} >= ${amtStr}::numeric`,
          ),
        )
        .returning({ id: users.id });
      if (!row) throw new Error("wallet_insufficient_balance");
      break;
    }
    case "PI_TEST":
      throw new Error("pi_test_asset_not_debitable");
    case "USD": {
      const [row] = await tx
        .update(users)
        .set({ usdBalance: sql`${users.usdBalance} - ${amtStr}::numeric` })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.usdBalance} >= ${amtStr}::numeric`,
          ),
        )
        .returning({ id: users.id });
      if (!row) throw new Error("wallet_insufficient_balance");
      break;
    }
    case "CDF": {
      const [row] = await tx
        .update(users)
        .set({ cdfBalance: sql`${users.cdfBalance} - ${amtStr}::numeric` })
        .where(
          and(
            eq(users.id, userId),
            sql`${users.cdfBalance} >= ${amtStr}::numeric`,
          ),
        )
        .returning({ id: users.id });
      if (!row) throw new Error("wallet_insufficient_balance");
      break;
    }
    default:
      throw new Error("asset");
  }
}

export async function creditUserAsset(
  tx: DbLike,
  userId: string,
  asset: WalletAsset,
  amtStr: string,
) {
  switch (asset) {
    case "USDT":
      await tx
        .update(users)
        .set({ balance: sql`${users.balance} + ${amtStr}::numeric` })
        .where(eq(users.id, userId));
      break;
    case "PI":
      await tx
        .update(users)
        .set({ piBalance: sql`${users.piBalance} + ${amtStr}::numeric` })
        .where(eq(users.id, userId));
      break;
    case "PI_TEST":
      await tx
        .update(users)
        .set({ piTestBalance: sql`${users.piTestBalance} + ${amtStr}::numeric` })
        .where(eq(users.id, userId));
      break;
    case "USD":
      await tx
        .update(users)
        .set({ usdBalance: sql`${users.usdBalance} + ${amtStr}::numeric` })
        .where(eq(users.id, userId));
      break;
    case "CDF":
      await tx
        .update(users)
        .set({ cdfBalance: sql`${users.cdfBalance} + ${amtStr}::numeric` })
        .where(eq(users.id, userId));
      break;
    default:
      throw new Error("asset");
  }
}
