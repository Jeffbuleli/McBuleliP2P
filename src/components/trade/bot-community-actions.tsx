"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { BotTemplateId } from "@/lib/bot-templates";
import type { Messages } from "@/i18n/messages";

export function BotCommunityActions({
  planId,
  billing,
  templateId,
  t,
}: {
  planId: BotPlanId;
  billing: "demo" | "live";
  templateId: BotTemplateId | null;
  t: (k: keyof Messages) => string;
}) {
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [copyTradingEnabled, setCopyTradingEnabled] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSettings = useCallback(async () => {
    const res = await fetch("/api/community/bots/settings", { cache: "no-store" });
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setShowLeaderboard(Boolean(j.meta?.showBotLeaderboard));
      setCopyTradingEnabled(Boolean(j.meta?.copyTradingEnabled));
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  async function toggleCopyTrading() {
    setBusy(true);
    try {
      const next = !copyTradingEnabled;
      const res = await fetch("/api/community/bots/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copyTradingEnabled: next }),
      });
      if (res.ok) setCopyTradingEnabled(next);
    } finally {
      setBusy(false);
    }
  }

  async function toggleLeaderboard() {
    setBusy(true);
    try {
      const next = !showLeaderboard;
      const res = await fetch("/api/community/bots/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ showBotLeaderboard: next }),
      });
      if (res.ok) setShowLeaderboard(next);
    } finally {
      setBusy(false);
    }
  }

  async function shareTemplate() {
    if (!templateId) return;
    setBusy(true);
    setShareMsg(null);
    try {
      const res = await fetch("/api/community/bots/share-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing, templateId }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setShareMsg(t("bots_share_failed"));
        return;
      }
      setShareMsg(t("bots_share_ok"));
      setShowLeaderboard(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-[color:var(--fd-border)]/80 bg-white/90 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
        {t("bots_community_title")}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !templateId}
          onClick={() => void shareTemplate()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)]/40 px-3 py-1.5 text-[11px] font-bold text-[color:var(--fd-primary)] disabled:opacity-50"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" aria-hidden>
            <path
              d="M14 5L8 1 2 5v8l6-3 6 3V5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
          {t("bots_share_community")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleCopyTrading()}
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
            copyTradingEnabled
              ? "bg-amber-600 text-white"
              : "border border-[color:var(--fd-border)] text-[color:var(--fd-muted)]"
          }`}
        >
          {t("bots_copy_trading_opt_in")}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void toggleLeaderboard()}
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${
            showLeaderboard
              ? "bg-[color:var(--fd-primary)] text-white"
              : "border border-[color:var(--fd-border)] text-[color:var(--fd-muted)]"
          }`}
        >
          {t("bots_leaderboard_opt_in")}
        </button>
        <a
          href="/app/community/traders"
          className="rounded-full border border-[color:var(--fd-border)] px-3 py-1.5 text-[11px] font-bold text-[color:var(--fd-primary)]"
        >
          {t("bots_view_leaderboard")}
        </a>
      </div>
      {shareMsg ? (
        <p className="mt-2 text-[11px] font-medium text-[color:var(--fd-primary)]">{shareMsg}</p>
      ) : null}
    </div>
  );
}
