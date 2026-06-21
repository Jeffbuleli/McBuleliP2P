"use client";

import { useCallback, useEffect, useState } from "react";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { adminCls } from "@/components/admin/admin-ui";
import { formatSessionWhen } from "@/components/admin/academy-admin-ui";

type SsotEvent = {
  id: string;
  slug: string;
  title: string;
  status: string;
  startDate: string;
  visibility: string;
  editionId: string | null;
};

type Viewer = { id: string; name: string };

export function AcademyEventsWizard({
  editionId,
  editionSlug,
  editionTitle,
  onCreated,
}: {
  editionId: string;
  editionSlug: string;
  editionTitle: string;
  onCreated?: () => void;
}) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [events, setEvents] = useState<SsotEvent[]>([]);
  const [title, setTitle] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [durationMin, setDurationMin] = useState(90);
  const [visibility, setVisibility] = useState<"PRIVATE" | "COMMUNITY">("PRIVATE");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const res = await fetch("/api/events", { credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) return;
    const all = (j.events as SsotEvent[]) ?? [];
    setEvents(
      all.filter((e) => e.status !== "CANCELLED" && e.editionId === editionId),
    );
  }, [editionId]);

  useEffect(() => {
    void fetch("/api/admin/academy", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.viewer) setViewer(j.viewer as Viewer);
      })
      .catch(() => {});
    void loadEvents();
  }, [loadEvents]);

  async function createDraft() {
    if (!viewer || !title.trim() || !startsAt) return;
    setBusy("create");
    setMsg(null);
    const start = new Date(startsAt);
    const end = new Date(start.getTime() + durationMin * 60_000);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          trainerId: viewer.id,
          trainerName: viewer.name,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
          visibility,
          editionId,
          category: "cohort-live",
          audienceMode: "ALL_ACADEMY_MEMBERS",
          eventType: "FREE",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof j.error === "string" ? j.error : "Erreur");
        return;
      }
      setTitle("");
      setStartsAt("");
      setMsg("Brouillon OK");
      await loadEvents();
      onCreated?.();
    } finally {
      setBusy(null);
    }
  }

  async function publishEvent(id: string) {
    setBusy(id);
    setMsg(null);
    try {
      const res = await fetch(`/api/events/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(typeof j.error === "string" ? j.error : "Erreur");
        return;
      }
      setMsg("Publié");
      await loadEvents();
      onCreated?.();
    } finally {
      setBusy(null);
    }
  }

  async function cancelEvent(id: string) {
    setBusy(`x-${id}`);
    try {
      await fetch(`/api/events/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      await loadEvents();
      onCreated?.();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`${adminCls.card} space-y-3`}>
      <div className="flex items-center gap-3">
        <img src="/academy/event-live.svg" alt="" className="h-11 w-11 shrink-0" />
        <div>
          <p className="text-sm font-extrabold">{editionTitle}</p>
          <p className="text-[10px] text-[color:var(--fd-muted)]">Nouvel événement</p>
        </div>
      </div>

      <input
        type="text"
        placeholder="Titre"
        className={adminCls.input}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="datetime-local"
          className={adminCls.input}
          value={startsAt}
          onChange={(e) => setStartsAt(e.target.value)}
        />
        <select
          className={adminCls.select}
          value={durationMin}
          onChange={(e) => setDurationMin(Number(e.target.value))}
        >
          {[60, 90, 120, 180].map((m) => (
            <option key={m} value={m}>
              {m} min
            </option>
          ))}
        </select>
        <select
          className={adminCls.select}
          value={visibility}
          onChange={(e) =>
            setVisibility(e.target.value as "PRIVATE" | "COMMUNITY")
          }
        >
          <option value="PRIVATE">Cohorte</option>
          <option value="COMMUNITY">Community</option>
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy != null || !viewer}
          onClick={() => void createDraft()}
          className={adminCls.btnPrimary}
        >
          {busy === "create" ? "…" : "Créer"}
        </button>
        <a
          href={`/app/academy/${editionSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className={adminCls.btnSecondary}
        >
          Voir ↗
        </a>
      </div>

      {msg ? (
        <p className="text-xs font-semibold text-[color:var(--fd-primary)]">{msg}</p>
      ) : null}

      {events.length > 0 ? (
        <ul className="space-y-2 border-t border-[color:var(--fd-border)] pt-3">
          {events.map((ev) => (
            <li
              key={ev.id}
              className="flex items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-2"
            >
              <AcademyIcon name="live" className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold">{ev.title}</p>
                <p className="text-[10px] text-[color:var(--fd-muted)]">
                  {formatSessionWhen(ev.startDate)} · {ev.status}
                </p>
              </div>
              {ev.status === "DRAFT" ? (
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void publishEvent(ev.id)}
                  className="rounded-lg bg-[#305f33] px-2 py-1 text-[10px] font-bold text-white"
                >
                  {busy === ev.id ? "…" : "Publier"}
                </button>
              ) : null}
              {ev.status !== "CANCELLED" ? (
                <button
                  type="button"
                  disabled={busy != null}
                  onClick={() => void cancelEvent(ev.id)}
                  className="rounded-lg border px-2 py-1 text-[10px] font-bold text-rose-700"
                >
                  ×
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
