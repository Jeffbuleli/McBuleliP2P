import Image from "next/image";
import Link from "next/link";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

const PROMOS = [
  {
    href: "/app/wallet",
    image: "/ads/mcbuleli-ad-en-wallet-1080.jpg",
    titleKey: "landing_promo_wallet_t" as const,
    tagKey: "landing_promo_wallet_tag" as const,
  },
  {
    href: "/app/p2p",
    image: "/ads/mcbuleli-ad-p2p-1080.jpg",
    titleKey: "landing_promo_p2p_t" as const,
    tagKey: "landing_promo_p2p_tag" as const,
  },
  {
    href: "/app/trade/futures",
    image: "/ads/mcbuleli-ad-en-futures-1080.jpg",
    titleKey: "landing_promo_futures_t" as const,
    tagKey: "landing_promo_futures_tag" as const,
  },
  {
    href: "/app/wallet/groups",
    image: "/ads/mcbuleli-ad-avec-1080.jpg",
    titleKey: "landing_promo_avec_t" as const,
    tagKey: "landing_promo_avec_tag" as const,
  },
  {
    href: "/app/trade/bots",
    image: "/ads/mcbuleli-ad-trading-bot-1080.jpg",
    titleKey: "landing_promo_bots_t" as const,
    tagKey: "landing_promo_bots_tag" as const,
  },
  {
    href: "/app/wallet/staking",
    image: "/ads/mcbuleli-ad-en-staking-1080.jpg",
    titleKey: "landing_promo_staking_t" as const,
    tagKey: "landing_promo_staking_tag" as const,
  },
] as const;

export async function LandingPromoStrip() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <section className="mt-5" aria-labelledby="landing-promos-h">
      <h2
        id="landing-promos-h"
        className="text-center text-sm font-black text-[color:var(--fd-text)]"
      >
        {d.landing_promo_heading}
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {PROMOS.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="group overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)] shadow-sm transition hover:border-[color:var(--fd-primary)]/30 hover:shadow-md active:scale-[0.99]"
          >
            <div className="relative aspect-[16/10] w-full overflow-hidden">
              <Image
                src={p.image}
                alt=""
                fill
                className="object-cover transition group-hover:scale-[1.02]"
                sizes="(max-width: 640px) 50vw, 25vw"
              />
            </div>
            <div className="px-2 py-2">
              <p className="text-[11px] font-extrabold leading-tight text-[color:var(--fd-text)]">
                {d[p.titleKey]}
              </p>
              <p className="mt-0.5 text-[9px] font-medium text-[color:var(--fd-muted)]">
                {d[p.tagKey]}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
