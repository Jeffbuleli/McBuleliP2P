"use client";

import { useCallback, useEffect, useState } from "react";

type MentorRow = {
  id: string;
  topic: string;
  notes: string | null;
  status: string;
  teamId: string;
  teamName: string;
  createdAt: string;
};

function statusLabel(status: string, isFr: boolean): string {
  switch (status) {
    case "open":
      return isFr ? "En attente" : "Pending";
    case "accepted":
      return isFr ? "En cours" : "In progress";
    case "closed":
      return isFr ? "Terminé" : "Done";
    default:
      return status;
  }
}

export function PartnerMentorQueuePanel({ isFr }: { isFr: boolean }) {
  const [rows, setRows] = useState<MentorRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/hackathon/mentor-queue", {
        credentials: "include",
        cache: "no-store",
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      setRows(json.requests ?? []);
      setError(null);
    } catch {
      setError("network");
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: string, status: "open" | "accepted" | "closed") {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hackathon/mentor-queue", {
        method: "PATCH",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      setRows(json.requests ?? []);
    } finally {
      setBusy(false);
    }
  }

  const open = rows.filter((r) => r.status === "open");
  const active = rows.filter((r) => r.status === "accepted");

  return (
    <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
            {isFr ? "File mentorat équipes" : "Team mentoring queue"}
          </h2>
          <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
            {isFr
              ? "Demandes des builders pendant le build. Acceptez puis marquez terminé après l'aide."
              : "Builder requests during the build. Accept then mark done after helping."}
          </p>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => void load()}
          className="rounded-xl border border-[color:var(--hk-border)] px-3 py-2 text-xs font-bold text-[color:var(--hk-accent)]"
        >
          {isFr ? "Actualiser" : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-3 text-sm text-red-600">
          {isFr ? "Erreur de chargement." : "Load error."} ({error})
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-[color:var(--hk-page)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
            {isFr ? "En attente" : "Pending"}
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--hk-text)]">
            {open.length}
          </p>
        </div>
        <div className="rounded-xl bg-[color:var(--hk-page)] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
            {isFr ? "En cours" : "In progress"}
          </p>
          <p className="mt-1 text-2xl font-black text-[color:var(--hk-accent)]">
            {active.length}
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <li className="text-sm text-[color:var(--hk-muted)]">
            {isFr ? "Aucune demande pour le moment." : "No requests yet."}
          </li>
        ) : (
          rows.map((r) => (
            <li
              key={r.id}
              className="rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3.5 py-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-[color:var(--hk-text)]">
                    {r.teamName}
                  </p>
                  <p className="mt-0.5 text-sm text-[color:var(--hk-text)]">
                    {r.topic}
                  </p>
                  {r.notes ? (
                    <p className="mt-1 text-xs text-[color:var(--hk-muted)]">
                      {r.notes}
                    </p>
                  ) : null}
                </div>
                <span className="rounded-full bg-[color:var(--hk-soft)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[color:var(--hk-accent)]">
                  {statusLabel(r.status, isFr)}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {(["accepted", "closed", "open"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={busy || r.status === status}
                    onClick={() => void setStatus(r.id, status)}
                    className="rounded-lg border border-[color:var(--hk-border)] px-2.5 py-1.5 text-xs font-bold text-[color:var(--hk-text)] disabled:opacity-40"
                  >
                    {statusLabel(status, isFr)}
                  </button>
                ))}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
