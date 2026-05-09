import Link from "next/link";
import { PiWalletPaymentSection } from "@/components/pi/pi-wallet-payment";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function PiTestTrainingPage() {
  const userId = await getSessionUserId();
  const locale = await getLocale();
  const d = getDictionary(locale);
  if (!userId) return null;

  return (
    <div className="mx-auto max-w-lg space-y-5 pb-10 pt-2">
      <Link
        href="/app/wallet"
        className="text-sm font-medium text-emerald-800 underline dark:text-emerald-400"
      >
        ← {d.wallet_title}
      </Link>
      <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-50">
        {d.wallet_pi_test_title}
      </h1>
      <p className="text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        {d.wallet_pi_test_intro}
      </p>
      <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
        <li>{d.wallet_pi_test_step_a}</li>
        <li>{d.wallet_pi_test_step_b}</li>
        <li>{d.wallet_pi_test_step_c}</li>
      </ol>
      <div className="rounded-2xl border border-emerald-700/30 bg-emerald-950/20 p-4">
        <PiWalletPaymentSection />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Link
          href="/app/wallet/history"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-stone-600 bg-stone-900 px-4 text-sm font-semibold text-stone-100 dark:bg-stone-800"
        >
          {d.wallet_link_history}
        </Link>
        <Link
          href="/app/trade/futures"
          className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-emerald-700/50 bg-emerald-900/40 px-4 text-sm font-semibold text-emerald-100"
        >
          {d.wallet_pi_test_cta_trade}
        </Link>
      </div>
    </div>
  );
}
