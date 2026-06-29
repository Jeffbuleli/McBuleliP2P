"use client";

import Link from "next/link";
import type { ComponentType } from "react";
import { useState } from "react";
import {
  IllustrationCommunity,
  IllustrationEarn,
  IllustrationP2P,
  IllustrationTrade,
  IllustrationWallet,
} from "@/components/landing/landing-product-illustrations";
import { useI18n } from "@/components/i18n-provider";

type TabId = "wallet" | "p2p" | "trade" | "earn" | "community";

type TabDef = {
  id: TabId;
  labelKey: string;
  tags: string[];
  href: string;
  Illustration: ComponentType<{ className?: string }>;
};

export function LandingProductTabs({ poolEnabled }: { poolEnabled: boolean }) {
  const { t } = useI18n();
  const [active, setActive] = useState<TabId>("wallet");

  const tabs: TabDef[] = [
    {
      id: "wallet",
      labelKey: "landing_tab_wallet",
      tags: [t("landing_svc_wallet_tag")],
      href: "/register?next=%2Fapp%2Fwallet",
      Illustration: IllustrationWallet,
    },
    {
      id: "p2p",
      labelKey: "landing_tab_p2p",
      tags: [t("landing_svc_p2p_tag")],
      href: "/register?next=%2Fapp%2Fp2p",
      Illustration: IllustrationP2P,
    },
    {
      id: "trade",
      labelKey: "landing_tab_trade",
      tags: [t("landing_svc_bots_tag"), t("landing_svc_futures_tag"), t("landing_svc_options_tag")],
      href: "/register?next=%2Fapp%2Ftrade",
      Illustration: IllustrationTrade,
    },
    {
      id: "earn",
      labelKey: "landing_tab_earn",
      tags: [
        t("landing_svc_staking_tag"),
        t("landing_svc_groups_tag"),
        ...(poolEnabled ? [t("landing_svc_pool_tag")] : []),
      ],
      href: "/register?next=%2Fapp%2Fwallet",
      Illustration: IllustrationEarn,
    },
    {
      id: "community",
      labelKey: "landing_tab_community",
      tags: [t("landing_svc_academy_tag"), t("landing_svc_community_tag")],
      href: "/register?next=%2Fapp%2Fcommunity",
      Illustration: IllustrationCommunity,
    },
  ];

  const current = tabs.find((x) => x.id === active) ?? tabs[0];
  const Illustration = current.Illustration;

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/40 p-1"
        role="tablist"
        aria-label={t("landing_services_heading")}
      >
        {tabs.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActive(tab.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                selected
                  ? "bg-[color:var(--fd-card)] text-[color:var(--fd-primary)] shadow-sm"
                  : "text-[color:var(--fd-muted)] hover:text-[color:var(--fd-text)]"
              }`}
            >
              {t(tab.labelKey as "landing_tab_wallet")}
            </button>
          );
        })}
      </div>

      <div
        className="mt-4 overflow-hidden rounded-2xl border border-[color:var(--fd-border)] bg-[color:var(--fd-card)]"
        role="tabpanel"
      >
        <Illustration className="h-auto w-full" />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--fd-border)] px-4 py-3">
          <div className="flex flex-wrap gap-1.5">
            {current.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-[10px] font-bold text-[color:var(--fd-primary)]"
              >
                {tag}
              </span>
            ))}
          </div>
          <Link
            href={current.href}
            prefetch={false}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[color:var(--fd-primary)] px-4 text-xs font-extrabold text-white shadow-md shadow-[color:var(--fd-primary)]/20 active:scale-[0.99]"
          >
            {t("landing_cta_primary")}
          </Link>
        </div>
      </div>
    </div>
  );
}
