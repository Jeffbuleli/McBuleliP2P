import { eq, sql } from "drizzle-orm";
import { users } from "@/db/schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DbLike = any;

export async function creditTradeDemoUsdt(
  tx: DbLike,
  userId: string,
  amtStr: string,
) {
  await tx
    .update(users)
    .set({
      tradeDemoUsdtBalance: sql`${users.tradeDemoUsdtBalance} + ${amtStr}::numeric`,
    })
    .where(eq(users.id, userId));
}

export async function debitTradeDemoUsdt(
  tx: DbLike,
  userId: string,
  amtStr: string,
) {
  await tx
    .update(users)
    .set({
      tradeDemoUsdtBalance: sql`${users.tradeDemoUsdtBalance} - ${amtStr}::numeric`,
    })
    .where(eq(users.id, userId));
}
