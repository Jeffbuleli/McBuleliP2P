"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminCls } from "@/components/admin/admin-ui";

type PitchQueue = {
  entries: Array<{ teamId: string; teamName: string }>;
  currentIndex: number;
  active: boolean;
  current: { teamId: string; teamName: string } | null;
  next: { teamId: string; teamName: string } | null;
  total: number;
  position: number;
};

export function HackathonPitchQueuePanel() {
  const [queue, setQueue] = useState<PitchQueue | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hackathon/pitch-queue", {
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (json.queue) setQueue(json.queue);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 3000);
    return () => clearInterval(t);
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hackathon/pitch-queue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error === "forbidden" ? "Accès admin requis" : json.error ?? "error");
        return;
      }
      if (json.queue) setQueue(json.queue);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`${adminCls.card} space-y-4`}>
      <div>
        <h3 className={adminCls.h2}>File pitch - Mini Demo Day</h3>
        <p className={adminCls.muted}>
          Initialise depuis les équipes avec livrables soumis. Affichée sur{" "}
          <Link href="/hackathon/live" className="font-semibold text-[color:var(--fd-primary)]">
            /hackathon/live
          </Link>
          {" "}quand active.
        </p>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {queue?.active && queue.current ? (
        <div className="rounded-xl bg-[color:var(--fd-bg)] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--fd-muted)]">
            En scène · {queue.position}/{queue.total}
          </p>
          <p className="mt-1 text-2xl font-black">{queue.current.teamName}</p>
          {queue.next ? (
            <p className="mt-2 text-sm text-[color:var(--fd-muted)]">
              Suivante : {queue.next.teamName}
            </p>
          ) : null}
        </div>
      ) : (
        <p className={adminCls.muted}>File inactive ou vide.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnPrimary}
          onClick={() => void post({ action: "init" })}
        >
          Init depuis soumis
        </button>
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnSecondary}
          onClick={() => void post({ action: "active", on: true })}
        >
          Activer
        </button>
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnSecondary}
          onClick={() => void post({ action: "active", on: false })}
        >
          Désactiver
        </button>
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnSecondary}
          onClick={() => void post({ action: "prev" })}
        >
          Précédent
        </button>
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnSecondary}
          onClick={() => void post({ action: "next" })}
        >
          Suivant
        </button>
        <button
          type="button"
          disabled={busy}
          className={adminCls.btnSecondary}
          onClick={() => void post({ action: "present_current" })}
        >
          Présenté + suivant
        </button>
        <Link
          href="/hackathon/mc"
          className={`${adminCls.btnSecondary} inline-flex items-center`}
        >
          Console MC
        </Link>
      </div>

      {queue?.entries.length ? (
        <ol className="space-y-1 text-sm">
          {queue.entries.map((e, i) => (
            <li
              key={e.teamId}
              className={`rounded-lg px-3 py-2 ${
                i === queue.currentIndex
                  ? "bg-emerald-500/15 font-bold ring-1 ring-emerald-500/30"
                  : "bg-[color:var(--fd-bg)]"
              }`}
            >
              {i + 1}. {e.teamName}
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
