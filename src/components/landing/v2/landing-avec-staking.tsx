import { LandingAvecCards } from "@/components/landing/v2/landing-avec-cards";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export async function LandingAvecStaking() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <section id="avec" className="scroll-mt-20 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78350f]">
            {d.landing_v2_avec_eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-bold text-stone-900 sm:text-2xl">{d.landing_v2_avec_title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{d.landing_v2_avec_sub}</p>
        </div>

        <LandingAvecCards
          groups={{
            title: d.landing_svc_groups_t,
            yieldLabel: d.landing_v2_avec_yield,
            tag: d.landing_v2_avec_tag_groups,
            desc: d.landing_v2_avec_desc_groups,
            icon: d.landing_v2_action_join,
          }}
          staking={{
            title: d.landing_svc_staking_t,
            yieldLabel: d.landing_v2_staking_yield,
            tag: d.landing_v2_avec_tag_staking,
            desc: d.landing_v2_avec_desc_staking,
            icon: d.landing_v2_action_earn,
          }}
        />

        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
          <li>{d.landing_v2_stat_escrow}</li>
          <li>{d.landing_v2_stat_mobile}</li>
          <li>{d.landing_v2_stat_kyc}</li>
          <li>{d.landing_v2_stat_support}</li>
        </ul>
      </div>
    </section>
  );
}
