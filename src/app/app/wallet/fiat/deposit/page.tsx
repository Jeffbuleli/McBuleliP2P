import Link from "next/link";
import WalletFiatDepositClient from "./wallet-fiat-deposit-client";
import { getDictionary, interpolate } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";
import { FIAT_FEE_RATE } from "@/lib/wallet-fees";
import { getDb, users } from "@/db";
import { eq } from "drizzle-orm";
import { isPawapaySupportedForCountry } from "@/lib/pawapay/availability";
import { isFiatDepositWithdrawPaused } from "@/lib/fiat-deposit-withdraw-paused";

export const dynamic = "force-dynamic";

export default async function WalletFiatDepositInfoPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();
  const d = getDictionary(locale);
  if (!userId) return null;
  const pct = Math.round(FIAT_FEE_RATE * 100);

  const db = getDb();
  const [u] = await db
    .select({ countryCode: users.countryCode })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const pawapayOk = isPawapaySupportedForCountry(u?.countryCode ?? null);
  const fiatPaused = isFiatDepositWithdrawPaused();

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 pt-2">
      <Link href="/app/wallet" className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400">
        ← {d.wallet_title}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {d.wallet_fiat_deposit_title}
      </h1>
      <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {interpolate(d.wallet_fiat_deposit_intro, { pct })}
      </p>
      {fiatPaused ? (
        <WalletFiatDepositClient fiatPaused />
      ) : pawapayOk ? (
        <WalletFiatDepositClient />
      ) : (
        <div className="rounded-2xl border border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
          {d.wallet_pawapay_unavailable}
        </div>
      )}
      <div className="rounded-2xl border border-amber-600/40 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700/50 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-semibold">{d.wallet_fees_title}</p>
        <p className="mt-1">{interpolate(d.wallet_fee_fiat, { pct })}</p>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        {d.wallet_fiat_ops_note}
      </p>
    </div>
  );
}
