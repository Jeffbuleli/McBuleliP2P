"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  AcademyJourneyProgress,
  journeyContinueHref,
  journeyNextStepLabel,
} from "@/components/academy/academy-journey-progress";
import type { AcademyJourneySnapshot } from "@/lib/academy-journey";
import { fetchWithDeadline } from "@/lib/fetch-with-deadline";

type HubSlice = {
  displayName: string | null;
  journey: AcademyJourneySnapshot;
};

export function AcademyJourneyTeaser() {
  const { t } = useI18n();
  const [data, setData] = useState<HubSlice | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetchWithDeadline(
        "/api/academy/overview",
        { credentials: "include", cache: "no-store" },
        15_000,
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return;
      if (j.journey) {
        setData({
          displayName: typeof j.displayName === "string" ? j.displayName : null,
          journey: j.journey as AcademyJourneySnapshot,
        });
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!data || data.journey.progressPercent === 0) return null;

  const href = journeyContinueHref(data.journey);

  return (
    <section className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-extrabold text-[color:var(--fd-text)]">
          {t("academy_journey_profile_title")}
        </h2>
        <Link
          href="/app/academy"
          className="text-xs font-bold text-[color:var(--fd-primary)]"
        >
          {t("academy_journey_profile_open")} →
        </Link>
      </div>
      <div className="mt-2">
        <AcademyJourneyProgress
          displayName={data.displayName}
          journey={data.journey}
        />
      </div>
      <Link
        href={href}
        className="mt-3 flex w-full justify-center rounded-xl bg-[color:var(--fd-primary)] py-2.5 text-sm font-extrabold text-white"
      >
        {journeyNextStepLabel(t, data.journey)} →
      </Link>
    </section>
  );
}
