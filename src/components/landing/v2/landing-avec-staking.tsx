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
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#78350f]">
            {d.landing_v2_avec_eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-black text-stone-900 sm:text-2xl">{d.landing_v2_avec_title}</h2>
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

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          {[
            { label: d.landing_v2_stat_escrow, color: "bg-[#305F33]/8 text-[#305F33] ring-[#305F33]/15" },
            { label: d.landing_v2_stat_mobile, color: "bg-stone-100 text-stone-800 ring-stone-200" },
            { label: d.landing_v2_stat_kyc, color: "bg-emerald-50 text-emerald-800 ring-emerald-100" },
            { label: d.landing_v2_stat_support, color: "bg-[#78350f]/8 text-[#78350f] ring-[#78350f]/15" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl px-2.5 py-3 text-center text-[11px] font-extrabold ring-1 sm:text-xs ${s.color}`}>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
