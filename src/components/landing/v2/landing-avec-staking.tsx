"use client";

import { LandingAvecCards } from "@/components/landing/v2/landing-avec-cards";
import { useI18n } from "@/components/i18n-provider";

export function LandingAvecStaking() {
  const { t } = useI18n();

  return (
    <section id="avec" className="scroll-mt-20 bg-white px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#78350f]">
            {t("landing_v2_avec_eyebrow")}
          </p>
          <h2 className="mt-2 text-xl font-bold text-stone-900 sm:text-2xl">
            {t("landing_v2_avec_title")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            {t("landing_v2_avec_sub")}
          </p>
        </div>

        <LandingAvecCards
          groups={{
            title: t("landing_svc_groups_t"),
            yieldLabel: t("landing_v2_avec_yield"),
            tag: t("landing_v2_avec_tag_groups"),
            desc: t("landing_v2_avec_desc_groups"),
            icon: t("landing_v2_action_join"),
          }}
          staking={{
            title: t("landing_svc_staking_t"),
            yieldLabel: t("landing_v2_staking_yield"),
            tag: t("landing_v2_avec_tag_staking"),
            desc: t("landing_v2_avec_desc_staking"),
            icon: t("landing_v2_action_earn"),
          }}
        />

        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-stone-600">
          <li>{t("landing_v2_stat_escrow")}</li>
          <li>{t("landing_v2_stat_mobile")}</li>
          <li>{t("landing_v2_stat_kyc")}</li>
        </ul>
      </div>
    </section>
  );
}
