import Link from "next/link";
import { WalletFlowShell } from "@/components/wallet/wallet-flow-shell";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export const dynamic = "force-dynamic";

export default async function WalletPayInfoPage() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <WalletFlowShell title="McBuleli Pay" subtitle={d.wallet_mcbuleli_pay}>
      <article className="fd-card space-y-4 p-4 text-sm leading-relaxed text-[color:var(--fd-text)]">
        <section>
          <h2 className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {d.wallet_pay_info_what}
          </h2>
          <p className="mt-1.5 text-[color:var(--fd-muted)]">{d.wallet_pay_info_body}</p>
        </section>
        <section>
          <h2 className="text-xs font-bold uppercase text-[color:var(--fd-muted)]">
            {d.wallet_pay_info_methods}
          </h2>
          <ul className="mt-2 space-y-2 text-xs text-[color:var(--fd-text)]">
            <li className="rounded-xl bg-stone-50 px-3 py-2">
              <strong>{d.wallet_transfer_mode_email}</strong> — {d.wallet_pay_info_email}
            </li>
            <li className="rounded-xl bg-stone-50 px-3 py-2">
              <strong>QR</strong> — {d.wallet_pay_info_qr}
            </li>
            <li className="rounded-xl bg-stone-50 px-3 py-2">
              <strong>UUID</strong> — {d.wallet_pay_info_uuid}
            </li>
          </ul>
        </section>
        <p className="text-[11px] text-[color:var(--fd-muted)]">{d.wallet_pay_info_binance}</p>
      </article>
      <Link
        href="/app/wallet/transfer"
        className="mt-4 block text-center text-sm font-bold text-[color:var(--fd-primary)] underline-offset-2 hover:underline"
      >
        ← {d.wallet_transfer_title}
      </Link>
    </WalletFlowShell>
  );
}
