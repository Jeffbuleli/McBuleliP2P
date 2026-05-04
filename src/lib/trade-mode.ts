import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

export type TradeModeSnapshot = {
  demoUsdt: string;
  tradeLiveEnabled: boolean;
};

export async function getTradeModeSnapshot(
  userId: string,
): Promise<TradeModeSnapshot | null> {
  const db = getDb();
  const [u] = await db
    .select({
      tradeDemoUsdtBalance: users.tradeDemoUsdtBalance,
      tradeLiveEnabled: users.tradeLiveEnabled,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;
  return {
    demoUsdt: u.tradeDemoUsdtBalance?.toString() ?? "0",
    tradeLiveEnabled: u.tradeLiveEnabled,
  };
}

export async function enableTradeLive(userId: string): Promise<boolean> {
  const db = getDb();
  const r = await db
    .update(users)
    .set({ tradeLiveEnabled: true })
    .where(eq(users.id, userId))
    .returning({ id: users.id });
  return r.length > 0;
}
