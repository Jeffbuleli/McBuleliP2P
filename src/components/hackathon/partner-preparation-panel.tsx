"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  PARTNER_TALK_MINUTES,
  type PartnerDayBrief,
} from "@/lib/hackathon/partner-day-brief";

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

function talkStatusLabel(
  status: string,
  isFr: boolean,
): string {
  switch (status) {
    case "confirmed":
      return isFr ? "Confirmé" : "Confirmed";
    case "pending_24h":
      return isFr ? "À confirmer (24h)" : "Confirm within 24h";
    case "backup":
      return isFr ? "Selon planning" : "Per schedule";
    case "media_only":
      return isFr ? "Photo seule" : "Photo only";
    default:
      return isFr ? "Hors scène" : "Off stage";
  }
}

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
  const [dayBrief, setDayBrief] = useState<PartnerDayBrief | null>(null);
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
      setDayBrief(json.dayBrief ?? null);
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
  const talk = dayBrief?.talk ?? null;
  const bringTech = isFr
    ? dayBrief?.bringTechFr
    : dayBrief?.bringTechEn;
  const bringVis = isFr
    ? dayBrief?.bringVisibilityFr
    : dayBrief?.bringVisibilityEn;

  return (
    <section className="space-y-5">
      {dayBrief ? (
        <>
          <div className="rounded-2xl border border-[color:var(--hk-accent)]/35 bg-[color:var(--hk-soft)] p-4 sm:p-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
              {isFr ? dayBrief.dateLabelFr : dayBrief.dateLabelEn}
            </p>
            <h2 className="mt-1 text-lg font-extrabold text-[color:var(--hk-text)]">
              {isFr ? dayBrief.bootcampTitleFr : dayBrief.bootcampTitleEn}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-text)]">
              {isFr ? dayBrief.bootcampFr : dayBrief.bootcampEn}
            </p>
            <p className="mt-3 text-sm font-semibold text-[color:var(--hk-accent)]">
              {isFr ? dayBrief.teamFr : dayBrief.teamEn}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[color:var(--hk-text)]">
              {isFr ? dayBrief.setupFr : dayBrief.setupEn}
            </p>
          </div>

          <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
            <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
              {isFr ? "Votre créneau" : "Your slot"}
            </h2>
            {talk && talk.status !== "none" && talk.start ? (
              <div className="mt-3 rounded-xl bg-[color:var(--hk-page)] px-3.5 py-3">
                <p className="text-2xl font-extrabold tabular-nums text-[color:var(--hk-text)]">
                  {talk.start} – {talk.end}
                </p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--hk-accent)]">
                  {isFr ? talk.domainFr : talk.domainEn}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[color:var(--hk-muted)]">
                  {talkStatusLabel(talk.status, isFr)}
                  {talk.status !== "media_only"
                    ? ` · ${PARTNER_TALK_MINUTES} min`
                    : ""}
                </p>
                {(isFr ? talk.noteFr : talk.noteEn) ? (
                  <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
                    {isFr ? talk.noteFr : talk.noteEn}
                  </p>
                ) : null}
              </div>
            ) : talk?.status === "media_only" ? (
              <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
                {isFr ? talk.noteFr : talk.noteEn}
              </p>
            ) : (
              <p className="mt-2 text-sm text-[color:var(--hk-muted)]">
                {isFr
                  ? "Pas de slot scène — mentorat / présence sur site."
                  : "No stage slot — mentoring / on-site presence."}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
              <h2 className="text-base font-extrabold text-[color:var(--hk-text)]">
                {isFr ? "À apporter · tech" : "Bring · tech"}
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--hk-text)]">
                {(bringTech ?? []).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[color:var(--hk-accent)]" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
              <h2 className="text-base font-extrabold text-[color:var(--hk-text)]">
                {isFr ? "À apporter · visibilité" : "Bring · visibility"}
              </h2>
              <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--hk-text)]">
                {(bringVis ?? []).map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-[color:var(--hk-accent)]" aria-hidden>
                      ·
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : null}

      <div className="rounded-2xl border border-[color:var(--hk-border)] bg-[color:var(--hk-surface)] p-4 sm:p-5">
        <h2 className="text-lg font-extrabold text-[color:var(--hk-text)]">
          {isFr ? "Badges partenaires (2 places)" : "Partner badges (2 seats)"}
        </h2>
        <p className="mt-1 text-sm text-[color:var(--hk-muted)]">
          {isFr
            ? "Idéal : place 1 = représentant, place 2 = IT. Accès = compte McBuleli = email du badge."
            : "Ideal: seat 1 = representative, seat 2 = IT. Access = McBuleli account = badge email."}
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
                    {p.badgeKind === "media"
                      ? isFr
                        ? " · photographe"
                        : " · photographer"
                      : p.seatIndex === 1
                        ? isFr
                          ? " · représentant"
                          : " · representative"
                        : isFr
                          ? " · IT"
                          : " · IT"}
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
              {isFr
                ? "Octroyer la 2e place (IT recommandé)"
                : "Grant seat 2 (IT recommended)"}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                value={grantName}
                onChange={(e) => setGrantName(e.target.value)}
                placeholder={isFr ? "Nom du collègue IT" : "IT colleague name"}
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
                disabled={
                  busy || !grantEmail.includes("@") || grantName.trim().length < 1
                }
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
            ? "Préparez talk, mentorat, jury et logistique avant Silikin."
            : "Prep talk, mentoring, jury and logistics before Silikin."}
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
