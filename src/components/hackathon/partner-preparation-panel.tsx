"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type PassRow = {
  id: string;
  seatIndex: number;
  status: string;
  holderEmail: string | null;
  holderName: string | null;
  roleLabel: string;
  badgeKind: string;
  ticketCode: string | null;
  passUrl: string | null;
};

type TaskRow = {
  id: string;
  title: string;
  notes: string | null;
  status: string;
  kind: string;
};

export function PartnerPreparationPanel({
  isFr,
  orgId,
}: {
  isFr: boolean;
  orgId: string | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passes, setPasses] = useState<PassRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [seatHolderOnly, setSeatHolderOnly] = useState(false);
  const [grantEmail, setGrantEmail] = useState("");
  const [grantName, setGrantName] = useState("");
  const [newTask, setNewTask] = useState("");

  const load = useCallback(async () => {
    if (!orgId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/hackathon/partner-workspace?orgId=${encodeURIComponent(orgId)}`,
        { credentials: "include", cache: "no-store" },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      setPasses(json.passes ?? []);
      setTasks(json.tasks ?? []);
      setSeatHolderOnly(Boolean(json.seatHolderOnly));
    } finally {
      setBusy(false);
    }
  }, [orgId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/hackathon/partner-workspace", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, orgId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "error");
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!orgId) {
    return (
      <p className="text-sm text-[color:var(--hk-muted)]">
        {isFr
          ? "Sélectionnez votre organisation pour ouvrir l'espace de préparation."
          : "Select your organisation to open the prep workspace."}
      </p>
    );
  }

  const seat2 = passes.find((p) => p.seatIndex === 2);
  const seat1 = passes.find((p) => p.seatIndex === 1);

  return (
    <section className="space-y-5">
      <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
          {isFr ? "Badges partenaires (2 places)" : "Partner badges (2 seats)"}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
          {isFr
            ? "Accès exclusif au titulaire (compte McBuleli = email du badge). La 2e place peut être octroyée à un collègue."
            : "Owner-only access (McBuleli account = badge email). Grant seat 2 to a colleague."}
        </p>
        {error ? (
          <p className="mt-2 text-sm font-semibold text-red-600">{error}</p>
        ) : null}
        <ul className="mt-4 space-y-2">
          {passes.map((p) => (
            <li
              key={p.id}
              className="rounded-xl bg-[color:var(--hk-page)] px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-[color:var(--hk-text)]">
                    {isFr ? `Place ${p.seatIndex}` : `Seat ${p.seatIndex}`}
                    {p.status === "reserved"
                      ? isFr
                        ? " · disponible"
                        : " · available"
                      : ""}
                  </p>
                  <p className="text-[color:var(--hk-muted)]">
                    {p.holderName || "-"} · {p.holderEmail || "-"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[color:var(--hk-accent)]">
                    {p.roleLabel}
                  </p>
                </div>
                {p.passUrl && p.status === "active" ? (
                  <Link
                    href={
                      p.ticketCode
                        ? `/hackathon/pass/${encodeURIComponent(p.ticketCode)}`
                        : p.passUrl
                    }
                    className="rounded-lg bg-[color:var(--hk-accent)] px-3 py-1.5 text-xs font-bold text-white"
                  >
                    {isFr ? "Ouvrir mon badge" : "Open my badge"}
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
          {!passes.length ? (
            <li className="text-sm text-[color:var(--hk-muted)]">
              {isFr
                ? "Pas de badges pour cette organisation (ex. SanJa / démos tech)."
                : "No badges for this organisation."}
            </li>
          ) : null}
        </ul>

        {seat1 && seat2 && seat2.status !== "active" && !seatHolderOnly ? (
          <div className="mt-4 space-y-2 border-t border-[color:var(--hk-border)] pt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
              {isFr ? "Octroyer la 2e place" : "Grant seat 2"}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={grantName}
                onChange={(e) => setGrantName(e.target.value)}
                placeholder={isFr ? "Nom du collègue" : "Colleague name"}
                className="min-w-[10rem] flex-1 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3 py-2 text-sm"
              />
              <input
                value={grantEmail}
                onChange={(e) => setGrantEmail(e.target.value)}
                placeholder="email@…"
                className="min-w-[12rem] flex-1 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3 py-2 text-sm"
              />
              <button
                type="button"
                disabled={busy || !grantEmail.includes("@") || grantName.trim().length < 1}
                onClick={() =>
                  void post({
                    action: "grant_seat_2",
                    holderEmail: grantEmail,
                    holderName: grantName,
                  }).then(() => {
                    setGrantEmail("");
                    setGrantName("");
                  })
                }
                className="rounded-xl bg-[color:var(--hk-accent)] px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                {isFr ? "Attribuer" : "Assign"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
          {isFr ? "Bloc-notes · To-do" : "Notepad · To-do"}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
          {isFr
            ? "Préparez atelier, mentorat, jury et logistique avant Silikin."
            : "Prep workshop, mentoring, jury and logistics before Silikin."}
        </p>
        <ul className="mt-4 space-y-2">
          {tasks.map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[color:var(--hk-page)] px-3 py-2 text-sm"
            >
              <span
                className={
                  t.status === "done"
                    ? "text-[color:var(--hk-muted)] line-through"
                    : "font-medium text-[color:var(--hk-text)]"
                }
              >
                {t.title}
              </span>
              <select
                value={t.status}
                disabled={busy}
                onChange={(e) =>
                  void post({
                    action: "set_task_status",
                    taskId: t.id,
                    status: e.target.value,
                  })
                }
                className="rounded-lg border border-[color:var(--hk-border)] bg-transparent px-2 py-1 text-xs"
              >
                <option value="todo">To-do</option>
                <option value="doing">{isFr ? "En cours" : "Doing"}</option>
                <option value="done">{isFr ? "Fait" : "Done"}</option>
              </select>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder={isFr ? "Nouvelle tâche…" : "New task…"}
            className="min-w-[12rem] flex-1 rounded-xl border border-[color:var(--hk-border)] bg-[color:var(--hk-page)] px-3 py-2 text-sm"
          />
          <button
            type="button"
            disabled={busy || newTask.trim().length < 2}
            onClick={() =>
              void post({ action: "add_task", title: newTask }).then(() =>
                setNewTask(""),
              )
            }
            className="rounded-xl border border-[color:var(--hk-border)] px-4 py-2 text-sm font-bold text-[color:var(--hk-text)] disabled:opacity-50"
          >
            {isFr ? "Ajouter" : "Add"}
          </button>
        </div>
      </div>
    </section>
  );
}
