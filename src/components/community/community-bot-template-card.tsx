"use client";

import Link from "next/link";
import type { BotTemplatePostMeta } from "@/lib/community/bot-template-post-meta";
import { botTemplateTradeHref } from "@/lib/community/bot-template-post-meta";

function BotTemplateIllustration() {
  return (
    <svg viewBox="0 0 80 56" className="h-14 w-20 shrink-0" aria-hidden>
      <rect x="4" y="28" width="72" height="22" rx="8" fill="var(--fd-primary)" opacity="0.12" />
      <rect x="10" y="18" width="60" height="22" rx="8" fill="var(--fd-primary)" opacity="0.22" />
      <path
        d="M18 32h44M18 38h28"
        stroke="var(--fd-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.7"
      />
      <circle cx="58" cy="32" r="5" fill="var(--fd-primary)" opacity="0.85" />
      <path
        d="M28 12 L40 6 L52 12 L52 22 L28 22 Z"
        fill="none"
        stroke="var(--fd-primary)"
        strokeWidth="1.5"
        opacity="0.5"
      />
    </svg>
  );
}

export function CommunityBotTemplateCard({
  meta,
  fr,
}: {
  meta: BotTemplatePostMeta;
  fr: boolean;
}) {
  const href = botTemplateTradeHref(meta);
  const planLabel =
    meta.planId === "dca_spot"
      ? "DCA"
      : meta.planId === "grid_spot"
        ? fr
          ? "Grille"
          : "Grid"
        : "Futures";

  return (
    <Link
      href={href}
      className="mt-3 flex items-center gap-3 rounded-2xl border-2 border-[color:var(--fd-primary)]/25 bg-gradient-to-r from-[color:var(--fd-mint)]/50 to-white p-3 transition active:scale-[0.99]"
    >
      <BotTemplateIllustration />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-primary)]">
          {fr ? "Stratégie bot" : "Bot strategy"}
        </p>
        <p className="text-sm font-bold text-[color:var(--fd-text)]">
          {planLabel} · {meta.symbol}
        </p>
        <p className="text-[11px] text-[color:var(--fd-muted)]">
          {meta.style === "swing" ? "Swing" : "Day"} · @{meta.authorHandle}
          {meta.stats && meta.stats.tradeCount > 0
            ? ` · ${meta.stats.tradeCount} trades`
            : ""}
        </p>
      </div>
      <span className="shrink-0 rounded-full bg-[color:var(--fd-primary)] px-3 py-1.5 text-[10px] font-bold text-white">
        {fr ? "Copier" : "Copy"}
      </span>
    </Link>
  );
}
