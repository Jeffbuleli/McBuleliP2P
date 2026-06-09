"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/components/i18n-provider";
import { CommunitySignalCard } from "@/components/community/community-signal-card";
import { CommunityModuleHeader } from "@/components/community/community-module-header";
import { CommunityFilterTabs } from "@/components/community/community-filter-tabs";
import {
  CommunityEmptyState,
  EmptySignalIllustration,
} from "@/components/community/community-empty-illustrations";
import { useCommunityPaginatedLoad } from "@/hooks/use-community-paginated-load";
import type { TradingSignalView } from "@/lib/community/signals-service";

type SignalTab = "open" | "closed";

const SIGNAL_TABS = [
  { id: "open" as const, labelFr: "Ouverts", labelEn: "Open" },
  { id: "closed" as const, labelFr: "Historique", labelEn: "History" },
];

export function CommunitySignalsClient() {
  const { locale, t } = useI18n();
  const fr = locale === "fr";
  const [tab, setTab] = useState<SignalTab>("open");
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"long" | "short">("long");
  const [note, setNote] = useState("");
  const [entryPrice, setEntryPrice] = useState("");
  const [targetPrice, setTargetPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bpToast, setBpToast] = useState<string | null>(null);
  const [viewerUserId, setViewerUserId] = useState<string | null>(null);

  const loadPage = useCallback(
    async (cursor: string | null) => {
      const q = new URLSearchParams({
        limit: "15",
        status: tab === "open" ? "open" : "closed",
      });
      if (cursor) q.set("cursor", cursor);
      const res = await fetch(`/api/community/signals?${q}`);
      const j = await res.json();
      return {
        items: (j.signals ?? []) as TradingSignalView[],
        nextCursor: (j.nextCursor as string | null) ?? null,
      };
    },
    [tab],
  );

  const { items: signals, setItems: setSignals, loading, sentinelRef } =
    useCommunityPaginatedLoad({
      loadPage,
      resetKey: tab,
    });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { id: string } | null }) => {
        if (d.user?.id) setViewerUserId(d.user.id);
      })
      .catch(() => {});
  }, []);

  const publish = async () => {
    if (note.trim().length < 10) {
      setError(fr ? "Min. 10 caractères" : "Min. 10 characters");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const res = await fetch("/api/community/signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: symbol.trim(),
          side,
          note: note.trim(),
          entryPrice: entryPrice || undefined,
          targetPrice: targetPrice || undefined,
          stopPrice: stopPrice || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        if (j.error === "kyc_required") {
          setError(t("kyc_required"));
        } else if (j.error === "kyc_country_unsupported") {
          setError(t("kyc_country_unsupported"));
        } else {
          setError(
            j.error === "too_many_open"
              ? fr
                ? "Max. 5 signaux ouverts"
                : "Max. 5 open signals"
              : (j.error ?? "failed"),
          );
        }
        return;
      }
      setSignals((p) => [j.signal as TradingSignalView, ...p]);
      setNote("");
      setEntryPrice("");
      setTargetPrice("");
      setStopPrice("");
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } finally {
      setPublishing(false);
    }
  };

  const closeSignal = async (
    id: string,
    outcome: "win" | "loss" | "neutral",
  ) => {
    setClosingId(id);
    try {
      const res = await fetch(`/api/community/signals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const j = await res.json();
      if (!res.ok) return;
      setSignals((p) =>
        p.map((s) => (s.id === id ? (j.signal as TradingSignalView) : s)),
      );
      if (j.bpGranted?.granted) {
        setBpToast(`+${j.bpGranted.points} BP`);
        setTimeout(() => setBpToast(null), 3000);
      }
    } finally {
      setClosingId(null);
    }
  };

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-28 pt-3">
      <CommunityModuleHeader title={fr ? "Signaux Trading" : "Trading signals"} />

      <p className="mb-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900">
        {fr
          ? "Signaux éducatifs uniquement — pas un conseil financier. Aucune exécution automatique."
          : "Educational signals only — not financial advice. No automatic execution."}
      </p>

      <CommunityFilterTabs tabs={SIGNAL_TABS} active={tab} onChange={setTab} fr={fr} />

      {tab === "open" ? (
      <div className="fd-card mb-4 space-y-3 px-4 py-4">
        <p className="text-sm font-semibold text-[#0c0a09]">
          {fr ? "Publier un signal" : "Publish a signal"}
        </p>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            placeholder="BTCUSDT"
          />
          <select
            className="rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
            value={side}
            onChange={(e) => setSide(e.target.value as "long" | "short")}
          >
            <option value="long">Long</option>
            <option value="short">Short</option>
          </select>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <input
            className="rounded-xl border border-[#e7e5e4] px-2 py-2 text-xs"
            value={entryPrice}
            onChange={(e) => setEntryPrice(e.target.value)}
            placeholder={fr ? "Entrée" : "Entry"}
          />
          <input
            className="rounded-xl border border-[#e7e5e4] px-2 py-2 text-xs"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder={fr ? "Cible" : "Target"}
          />
          <input
            className="rounded-xl border border-[#e7e5e4] px-2 py-2 text-xs"
            placeholder="SL"
            value={stopPrice}
            onChange={(e) => setStopPrice(e.target.value)}
          />
        </div>
        <textarea
          className="w-full rounded-xl border border-[#e7e5e4] px-3 py-2 text-sm"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={
            fr ? "Analyse et contexte (min. 10 car.)" : "Analysis & context (min. 10 chars)"
          }
        />
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        {error === t("kyc_required") ? (
          <Link
            href="/app/profile/kyc"
            className="block text-xs font-semibold text-[#305f33]"
          >
            {fr ? "Compléter le KYC →" : "Complete KYC →"}
          </Link>
        ) : null}
        <button
          type="button"
          disabled={publishing}
          className="w-full rounded-xl bg-[#305f33] py-2.5 text-sm font-bold text-white disabled:opacity-50"
          onClick={() => void publish()}
        >
          {publishing
            ? fr
              ? "Publication…"
              : "Publishing…"
            : fr
              ? "Publier (+35 BP)"
              : "Publish (+35 BP)"}
        </button>
      </div>
      ) : null}

      {!loading && signals.length === 0 ? (
        <CommunityEmptyState
          illustration={<EmptySignalIllustration />}
          title={fr ? "Aucun signal" : "No signals yet"}
          body={
            fr
              ? "Les signaux publiés apparaîtront ici."
              : "Published signals will appear here."
          }
        />
      ) : (
      <ul className="space-y-3">
        {signals.map((s) => (
          <li key={s.id}>
            <CommunitySignalCard
              signal={s}
              viewerUserId={viewerUserId}
              onClose={closeSignal}
              closing={closingId === s.id}
            />
          </li>
        ))}
      </ul>
      )}

      <div ref={sentinelRef} className="h-8" />
      {loading ? (
        <p className="py-4 text-center text-xs text-[#78716c]">…</p>
      ) : null}

      {bpToast ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-sm font-bold text-white shadow-lg">
          {bpToast}
        </div>
      ) : null}
    </div>
  );
}
