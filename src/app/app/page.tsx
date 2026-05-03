import Link from "next/link";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) {
    return null;
  }
  const db = getDb();
  const [u] = await db
    .select({
      email: users.email,
      balance: users.balance,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  return (
    <div>
      <p className="text-sm text-stone-600">Signed in as</p>
      <p className="font-medium text-stone-900">{u?.email}</p>
      <div className="mt-6 rounded-2xl border border-emerald-900/15 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Wallet balance
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums text-emerald-900">
          {u?.balance ?? "0"}{" "}
          <span className="text-lg font-semibold text-stone-600">USDT</span>
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/app/deposit"
          className="rounded-xl bg-emerald-700 px-4 py-3 text-center text-lg font-semibold text-white shadow-md shadow-emerald-900/15"
        >
          Deposit
        </Link>
        <Link
          href="/app/withdraw"
          className="rounded-xl border-2 border-rose-900/40 bg-white px-4 py-3 text-center text-lg font-semibold text-rose-950"
        >
          Withdraw
        </Link>
      </div>
    </div>
  );
}
