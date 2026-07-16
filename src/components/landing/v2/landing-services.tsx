"use client";

import type { ComponentType } from "react";
import { SessionAppLink } from "@/components/landing/session-app-link";
import {
  IconBell,
  IconBook,
  IconChartLine,
  IconHeadset,
  IconP2P,
  IconStaking,
  IconUsers,
  IconWallet,
} from "@/components/landing/landing-icons";
import { useI18n } from "@/components/i18n-provider";

type Service = {
  href: string;
  titleKey:
    | "landing_svc_wallet_t"
    | "landing_svc_p2p_t"
    | "landing_svc_trade_t"
    | "landing_svc_groups_t"
    | "landing_svc_staking_t"
    | "landing_svc_community_t"
    | "landing_svc_academy_t"
    | "landing_svc_support_t";
  tagKey:
    | "landing_svc_wallet_tag"
    | "landing_svc_p2p_tag"
    | "landing_svc_trade_tag"
    | "landing_svc_groups_tag"
    | "landing_svc_staking_tag"
    | "landing_svc_community_tag"
    | "landing_svc_academy_tag"
    | "landing_svc_support_tag";
  Icon: ComponentType<{ className?: string }>;
};

const SERVICES: Service[] = [
  {
    href: "/app/wallet",
    titleKey: "landing_svc_wallet_t",
    tagKey: "landing_svc_wallet_tag",
    Icon: IconWallet,
  },
  {
    href: "/app/p2p",
    titleKey: "landing_svc_p2p_t",
    tagKey: "landing_svc_p2p_tag",
    Icon: IconP2P,
  },
  {
    href: "/app/trade",
    titleKey: "landing_svc_trade_t",
    tagKey: "landing_svc_trade_tag",
    Icon: IconChartLine,
  },
  {
    href: "/app/wallet/groups",
    titleKey: "landing_svc_groups_t",
    tagKey: "landing_svc_groups_tag",
    Icon: IconUsers,
  },
  {
    href: "/app/wallet/staking",
    titleKey: "landing_svc_staking_t",
    tagKey: "landing_svc_staking_tag",
    Icon: IconStaking,
  },
  {
    href: "/app/community",
    titleKey: "landing_svc_community_t",
    tagKey: "landing_svc_community_tag",
    Icon: IconBell,
  },
  {
    href: "/app/academy",
    titleKey: "landing_svc_academy_t",
    tagKey: "landing_svc_academy_tag",
    Icon: IconBook,
  },
  {
    href: "/app/support",
    titleKey: "landing_svc_support_t",
    tagKey: "landing_svc_support_tag",
    Icon: IconHeadset,
  },
];

export function LandingServices() {
  const { t } = useI18n();

  return (
    <section id="services" className="scroll-mt-20 bg-white px-4 py-10 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-xl">
          <h2 className="text-xl font-bold text-stone-900 sm:text-2xl">
            {t("landing_services_heading")}
          </h2>
          <p className="mt-1.5 text-sm text-stone-600">{t("landing_services_sub")}</p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {SERVICES.map(({ href, titleKey, tagKey, Icon }) => (
            <li key={href + titleKey}>
              <SessionAppLink
                href={href}
                className="flex h-full flex-col gap-2 rounded-2xl border border-stone-200 bg-[#fafaf9] p-4 transition hover:border-[#305F33]/35 hover:bg-[#305F33]/[0.04]"
              >
                <Icon className="h-5 w-5 text-[#305F33]" />
                <span className="text-sm font-bold text-stone-900">{t(titleKey)}</span>
                <span className="text-[11px] font-medium leading-snug text-stone-500">
                  {t(tagKey)}
                </span>
              </SessionAppLink>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
