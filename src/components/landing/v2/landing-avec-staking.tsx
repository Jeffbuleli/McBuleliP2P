import { LandingAvecCards } from "@/components/landing/v2/landing-avec-cards";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export async function LandingAvecStaking() {
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <section id="avec" className="scroll-mt-20 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-fuchsia-400/80">
            {d.landing_v2_avec_eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">{d.landing_v2_avec_title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">{d.landing_v2_avec_sub}</p>
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
            { label: d.landing_v2_stat_escrow, color: "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400" },
            { label: d.landing_v2_stat_mobile, color: "border border-cyan-500/20 bg-cyan-500/5 text-cyan-300" },
            { label: d.landing_v2_stat_kyc, color: "border border-teal-500/20 bg-teal-500/5 text-teal-300" },
            { label: d.landing_v2_stat_support, color: "border border-fuchsia-500/20 bg-fuchsia-500/5 text-fuchsia-300" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl px-2.5 py-3 text-center font-mono text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${s.color}`}>
              {s.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
