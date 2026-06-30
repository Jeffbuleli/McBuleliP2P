"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import type { CommunityRewardCatalogItem } from "@/lib/community/rewards-catalog";

type RewardsPayload = {
  balance: number | null;
  bpPerMcb: number;
  monthlyCap: number;
  catalog: CommunityRewardCatalogItem[];
};

export function CommunityRewardsCard() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [data, setData] = useState<RewardsPayload | null>(null);

  useEffect(() => {
    fetch("/api/community/rewards")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, []);

  if (!data) return null;

  const top = data.catalog.slice(0, 6);

  return (
    <section className="fd-card mb-4 overflow-hidden">
      <div className="flex items-start gap-3 border-b border-[#e8f3ee] px-4 py-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#305f33] text-sm font-bold text-white"
          aria-hidden
        >
          BP
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-[#0c0a09]">
            {fr ? "Gagnez des Buleli Points" : "Earn Buleli Points"}
          </h2>
          <p className="text-xs text-[#78716c]">
            {fr
              ? `Participez, cumulez des BP — ${data.bpPerMcb} BP = 1 McB (bientôt).`
              : `Engage and earn BP — ${data.bpPerMcb} BP = 1 McB (coming soon).`}
          </p>
          {data.balance != null ? (
            <p className="mt-1 text-xs font-semibold text-[#305f33]">
              {fr ? "Votre solde : " : "Your balance: "}
              {data.balance.toLocaleString()} BP
            </p>
          ) : null}
        </div>
        <Link
          href="/app/wallet/points"
          className="shrink-0 text-xs font-semibold text-[#305f33]"
        >
          {fr ? "Détails" : "Details"} →
        </Link>
      </div>
      <ul className="divide-y divide-[#f0f4f2]">
        {top.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between gap-2 px-4 py-2.5 text-xs"
          >
            <span className="min-w-0 truncate text-[#44403c]">
              {fr ? item.labelFr : item.labelEn}
            </span>
            <span className="shrink-0 font-bold text-[#305f33]">+{item.points}</span>
          </li>
        ))}
      </ul>
      <p className="border-t border-[#e8f3ee] px-4 py-2 text-[10px] text-[#a8a29e]">
        {fr
          ? `Plafond mensuel global : ${data.monthlyCap.toLocaleString()} BP · limites journalières anti-spam`
          : `Monthly cap: ${data.monthlyCap.toLocaleString()} BP · daily anti-spam limits`}
      </p>
    </section>
  );
}
