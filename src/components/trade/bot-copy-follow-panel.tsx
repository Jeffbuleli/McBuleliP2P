"use client";

import { useCallback, useEffect, useState } from "react";
import type { BotPlanId } from "@/lib/bot-config";
import type { BotCopyFollowView } from "@/lib/community/bot-copy-follow-service";
import type { Messages } from "@/i18n/messages";

export function BotCopyFollowPanel({
  planId,
  billing,
  t,
}: {
  planId: BotPlanId;
  billing: "demo" | "live";
  t: (k: keyof Messages) => string;
}) {
  const [follow, setFollow] = useState<BotCopyFollowView | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(
      `/api/community/bots/copy-follow?planId=${planId}&billing=${billing}`,
      { cache: "no-store" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setFollow((j.follow as BotCopyFollowView | null) ?? null);
  }, [planId, billing]);

  useEffect(() => {
    void load();
  }, [load]);

  async function stopCopy() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/community/bots/copy-follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, billing }),
      });
      if (!res.ok) {
        setMsg(t("bots_copy_stop_failed"));
        return;
      }
      setFollow(null);
      setMsg(t("bots_copy_stopped"));
    } finally {
      setBusy(false);
    }
  }

  if (!follow) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-50/80 p-3">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-amber-800">
        {t("bots_copy_active_title")}
      </p>
      <p className="mt-1 text-xs font-semibold text-[color:var(--fd-text)]">
        @{follow.leadHandle ?? "trader"} · {Math.round(follow.sizingRatio * 100)}%
      </p>
      <p className="mt-0.5 text-[11px] text-[color:var(--fd-muted)]">
        {t("bots_copy_active_hint")}
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void stopCopy()}
        className="mt-2 rounded-full border border-amber-600/40 px-3 py-1.5 text-[11px] font-bold text-amber-900 disabled:opacity-50"
      >
        {t("bots_copy_stop")}
      </button>
      {msg ? (
        <p className="mt-2 text-[11px] font-medium text-amber-800">{msg}</p>
      ) : null}
    </div>
  );
}
