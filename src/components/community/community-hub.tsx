"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  isDataSaverEnabled,
  setDataSaverEnabled,
} from "@/lib/community/data-saver";
import { CommunityRewardsCard } from "@/components/community/community-rewards-card";
import type { CommunityModuleCard } from "@/lib/community/overview-service";

function ModuleIcon({ id }: { id: CommunityModuleCard["id"] }) {
  const stroke = "currentColor";
  const common = { fill: "none", stroke, strokeWidth: 1.75, strokeLinecap: "round" as const };
  if (id === "feed") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="4" width="18" height="14" rx="2" {...common} />
        <path d="M7 9h10M7 13h6" {...common} />
      </svg>
    );
  }
  if (id === "blogs") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 4h12v16H6z" {...common} />
        <path d="M9 8h6M9 12h6M9 16h4" {...common} />
      </svg>
    );
  }
  if (id === "formations") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
        <rect x="2" y="5" width="14" height="10" rx="1.5" {...common} />
        <path d="M16 8l6-3v10l-6-3" {...common} />
      </svg>
    );
  }
  if (id === "signals") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 18l4-8 4 4 4-10 4 14" {...common} />
      </svg>
    );
  }
  if (id === "traders") {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
        <path d="M8 21V10M12 21V4M16 21v-7" {...common} />
      </svg>
    );
  }
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" {...common} />
      <path d="M9.5 9.5h5v5h-5z" {...common} />
      <path d="M12 7v2M12 15v2M7 12h2M15 12h2" {...common} />
    </svg>
  );
}

export function CommunityHub() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [modules, setModules] = useState<CommunityModuleCard[]>([]);
  const [enabled, setEnabled] = useState(true);
  const [dataSaver, setDataSaver] = useState(true);

  useEffect(() => {
    setDataSaver(isDataSaverEnabled());
    fetch("/api/community/overview")
      .then((r) => r.json())
      .then((d: { enabled?: boolean; modules?: CommunityModuleCard[] }) => {
        setEnabled(d.enabled !== false);
        setModules(d.modules ?? []);
      })
      .catch(() => setEnabled(false));
  }, []);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-4">
      <header className="mb-5">
        <h1 className="text-xl font-bold text-[#0c0a09]">
          {fr ? "Communauté" : "Community"}
        </h1>
        <p className="mt-1 text-sm text-[#57534e]">
          {fr
            ? "Apprendre, échanger et suivre l'actu crypto."
            : "Learn, discuss, and follow crypto news."}
        </p>
      </header>

      <CommunityRewardsCard />

      <label className="fd-card mb-4 flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#0c0a09]">
            {fr ? "Économie de données" : "Data saver"}
          </p>
          <p className="text-xs text-[#78716c]">
            {fr ? "Images légères, pas d'autoplay vidéo" : "Light images, no video autoplay"}
          </p>
        </div>
        <input
          type="checkbox"
          checked={dataSaver}
          className="h-5 w-5 accent-[#305f33]"
          onChange={(e) => {
            setDataSaver(e.target.checked);
            setDataSaverEnabled(e.target.checked);
          }}
        />
      </label>

      {!enabled ? (
        <div className="fd-card px-4 py-8 text-center text-sm text-[#57534e]">
          {fr ? "Module en cours de déploiement." : "Module rolling out soon."}
        </div>
      ) : (
        <ul className="grid gap-3">
          {modules.map((m) => (
            <li key={m.id}>
              <Link
                href={m.href}
                className="fd-card flex items-center gap-4 px-4 py-4 transition active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f3ee] text-[#305f33]">
                  <ModuleIcon id={m.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-[#0c0a09]">
                    {fr ? m.titleFr : m.titleEn}
                  </span>
                  <span className="block text-xs text-[#78716c]">
                    {fr ? m.subtitleFr : m.subtitleEn}
                  </span>
                </span>
                {m.count !== null && m.count > 0 ? (
                  <span className="rounded-full bg-[#e8f3ee] px-2 py-0.5 text-xs font-semibold text-[#305f33]">
                    {m.count}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
