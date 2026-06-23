"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import {
  CommunityHelpSheet,
  CommunityHelpTrigger,
} from "@/components/community/community-help-sheet";
import {
  COMMUNITY_EXPLORE,
  COMMUNITY_PRIMARY,
  type CommunityExploreId,
  type CommunityPrimaryId,
} from "@/lib/community/nav-config";

function PrimaryIcon({ id }: { id: CommunityPrimaryId }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const };
  if (id === "news") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
        <rect x="3" y="4" width="18" height="14" rx="2" {...c} />
        <path d="M7 9h10M7 13h6" {...c} />
      </svg>
    );
  }
  if (id === "discussions") {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 6h14a2 2 0 012 2v8a2 2 0 01-2 2H9l-5 4V8a2 2 0 012-2z" {...c} />
      </svg>
    );
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden>
      <rect x="2" y="5" width="14" height="10" rx="1.5" {...c} />
      <path d="M16 8l6-3v10l-6-3" {...c} />
    </svg>
  );
}

function ExploreIcon({ id }: { id: CommunityExploreId }) {
  const c = { fill: "none", stroke: "currentColor", strokeWidth: 1.75, strokeLinecap: "round" as const };
  if (id === "blogs") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path d="M6 4h12v16H6z" {...c} />
        <path d="M9 8h6M9 12h6" {...c} />
      </svg>
    );
  }
  if (id === "questions") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="12" r="9" {...c} />
        <path d="M9.5 9.5a3 3 0 015 1c0 2-2 2-2 3M12 17h.01" {...c} />
      </svg>
    );
  }
  if (id === "signals") {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 18l4-8 4 4 4-10 4 14" {...c} />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path d="M8 21V10M12 21V4M16 21v-7" {...c} />
    </svg>
  );
}

export function CommunityHub() {
  const { locale } = useI18n();
  const fr = locale === "fr";
  const [helpOpen, setHelpOpen] = useState(false);
  const [bpBalance, setBpBalance] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/rewards/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { balance?: number } | null) => {
        if (d?.balance != null) setBpBalance(d.balance);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-3">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-[#0c0a09]">Community</h1>
        <div className="flex items-center gap-2">
          {bpBalance != null ? (
            <Link
              href="/app/wallet/points"
              className="rounded-full bg-[#e8f3ee] px-2.5 py-1 text-[10px] font-bold text-[#305f33]"
            >
              {bpBalance} BP
            </Link>
          ) : null}
          <CommunityHelpTrigger onClick={() => setHelpOpen(true)} />
        </div>
      </header>

      <section aria-label={fr ? "Actions principales" : "Primary actions"}>
        <ul className="space-y-2">
          {COMMUNITY_PRIMARY.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-[60px] items-center gap-3.5 rounded-2xl border border-[#e8f3ee] bg-gradient-to-r from-[#f4faf6] to-white px-4 py-3.5 shadow-sm transition active:scale-[0.99]"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e8f3ee] text-[#305f33]">
                  <PrimaryIcon id={item.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-bold text-[#0c0a09]">
                    {fr ? item.titleFr : item.titleEn}
                  </span>
                  <span className="block text-xs text-[#78716c]">
                    {fr ? item.subtitleFr : item.subtitleEn}
                  </span>
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0 text-[#a8a29e]" aria-hidden>
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="my-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e7e5e4]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#a8a29e]">
          {fr ? "Explorer" : "Explore"}
        </span>
        <span className="h-px flex-1 bg-[#e7e5e4]" />
      </div>

      <section aria-label={fr ? "Explorer" : "Explore"}>
        <ul className="space-y-1.5">
          {COMMUNITY_EXPLORE.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-[48px] items-center gap-3 rounded-xl px-3 py-2.5 transition active:bg-[#fafaf9]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f5f5f4] text-[#57534e]">
                  <ExploreIcon id={item.id} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0c0a09]">
                    {fr ? item.titleFr : item.titleEn}
                  </span>
                  <span className="block text-[11px] text-[#78716c]">
                    {fr ? item.subtitleFr : item.subtitleEn}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <CommunityHelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
