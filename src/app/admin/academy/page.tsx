"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type FormationStats = {
  formationTotal: number;
  formationLinkedToUser: number;
  academyEnrolledLaunch: number;
  pendingAcademyEnroll: number;
};

type EditionRow = {
  id: string;
  slug: string;
  programSlug: string;
  titleFr: string;
  status: string;
  enrollmentCount: number;
  formationRegistrations: number | null;
};

type EnrollmentRow = {
  id: string;
  email: string;
  displayName: string | null;
  enrolledAt: string;
  paidUsdt: string;
  status: string;
};

type SessionRow = {
  id: string;
  slug: string;
  titleFr: string;
  startsAt: string;
  liveUrl: string | null;
  replayUrl: string | null;
  replayR2Key: string | null;
};

type EditionAnalytics = {
  enrollmentsActive: number;
  livesAttended: number;
  quizPasses: number;
  modulesCompleted: number;
  replayViews: number;
  eventsByVerb: { verb: string; n: number }[];
};

type HostRow = {
  id: string;
  userId: string;
  email: string;
  displayName: string | null;
  role: string;
};

export default function AdminAcademyPage() {
  const [editions, setEditions] = useState<EditionRow[]>([]);
  const [formation, setFormation] = useState<FormationStats | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionDraft, setSessionDraft] = useState<
    Record<string, { liveUrl: string; replayUrl: string; replayR2Key: string }>
  >({});
  const [analytics, setAnalytics] = useState<EditionAnalytics | null>(null);
  const [savingSession, setSavingSession] = useState<string | null>(null);
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [hostEmail, setHostEmail] = useState("");
  const [hostBusy, setHostBusy] = useState(false);
  const [hostMsg, setHostMsg] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/academy", { credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr("Forbidden");
      return;
    }
    setEditions((j.editions as EditionRow[]) ?? []);
    setFormation((j.formation as FormationStats) ?? null);
  }, []);

  async function syncFormation() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/admin/academy/sync-formation", {
        method: "POST",
        credentials: "include",
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSyncMsg("Échec synchronisation");
        return;
      }
      setSyncMsg(
        `OK — ${j.enrolled ?? 0} inscrits Academy · ${j.noAccount ?? 0} sans compte McBuleli`,
      );
      await loadOverview();
      if (selected) await loadEnrollments(selected);
    } finally {
      setSyncing(false);
    }
  }

  const loadEnrollments = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy?edition=${encodeURIComponent(editionSlug)}&limit=100`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      setEnrollments((j.enrollments as EnrollmentRow[]) ?? []);
      setTotal(typeof j.total === "number" ? j.total : 0);
    }
  }, []);

  const loadAnalytics = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy/analytics?edition=${encodeURIComponent(editionSlug)}`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setAnalytics((j.analytics as EditionAnalytics) ?? null);
    else setAnalytics(null);
  }, []);

  const loadHosts = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy/editions/${encodeURIComponent(editionSlug)}/hosts`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) setHosts((j.hosts as HostRow[]) ?? []);
  }, []);

  const loadSessions = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy?edition=${encodeURIComponent(editionSlug)}&sessions=1`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      const rows = (j.sessions as SessionRow[]) ?? [];
      setSessions(rows);
      const draft: Record<string, { liveUrl: string; replayUrl: string; replayR2Key: string }> =
        {};
      for (const s of rows) {
        draft[s.id] = {
          liveUrl: s.liveUrl ?? "",
          replayUrl: s.replayUrl ?? "",
          replayR2Key: s.replayR2Key ?? "",
        };
      }
      setSessionDraft(draft);
    }
  }, []);

  async function saveSession(sessionId: string) {
    const d = sessionDraft[sessionId];
    if (!d) return;
    setSavingSession(sessionId);
    try {
      const res = await fetch("/api/admin/academy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          sessionId,
          liveUrl: d.liveUrl.trim() || null,
          replayUrl: d.replayUrl.trim() || null,
          replayR2Key: d.replayR2Key.trim() || null,
        }),
      });
      if (res.ok && selected) await loadSessions(selected);
    } finally {
      setSavingSession(null);
    }
  }

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selected) {
      void loadEnrollments(selected);
      void loadSessions(selected);
      void loadHosts(selected);
      void loadAnalytics(selected);
    }
  }, [selected, loadEnrollments, loadSessions, loadHosts, loadAnalytics]);

  async function addCoHost() {
    if (!selected || !hostEmail.trim()) return;
    setHostBusy(true);
    setHostMsg(null);
    try {
      const edition = editions.find((e) => e.slug === selected);
      const res = await fetch(
        `/api/admin/academy/editions/${encodeURIComponent(selected)}/hosts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            email: hostEmail.trim(),
            programSlug: edition?.programSlug,
          }),
        },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHostMsg(typeof j.error === "string" ? j.error : "Erreur");
        return;
      }
      setHostEmail("");
      setHostMsg("Co-animateur ajouté");
      await loadHosts(selected);
    } finally {
      setHostBusy(false);
    }
  }

  async function removeCoHost(hostId: string) {
    if (!selected) return;
    await fetch(
      `/api/admin/academy/editions/${encodeURIComponent(selected)}/hosts?hostId=${encodeURIComponent(hostId)}`,
      { method: "DELETE", credentials: "include" },
    );
    await loadHosts(selected);
  }

  function exportCsv() {
    const header = ["enrolledAt", "email", "displayName", "paidUsdt", "status"];
    const lines = enrollments.map((r) =>
      [r.enrolledAt, r.email, r.displayName ?? "", r.paidUsdt, r.status]
        .map((c) => `"${String(c).replace(/"/g, '""')}"`)
        .join(","),
    );
    const blob = new Blob([[header.join(","), ...lines].join("\n")], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `academy-${selected ?? "cohort"}.csv`;
    a.click();
  }

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin">← Admin</AdminBackLink>
      <AdminPageHeader title="McBuleli Academy" subtitle="Cohortes & inscriptions" />
      {err ? <p className="text-sm text-rose-700">{err}</p> : null}

      {formation ? (
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Vue unifiée lancement juin</h2>
          <p className="mt-1 text-xs text-stone-500">
            <strong>/formation</strong> enregistre dans{" "}
            <code className="text-[10px]">training_registrations</code>. Academy
            Ops compte les comptes connectés dans{" "}
            <code className="text-[10px]">academy_enrollments</code> (après login ou
            sync).
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">
                /formation
              </dt>
              <dd className="text-xl font-black text-[#305f33]">
                {formation.formationTotal}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">
                Compte lié
              </dt>
              <dd className="text-xl font-black">{formation.formationLinkedToUser}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">
                Academy (app)
              </dt>
              <dd className="text-xl font-black">{formation.academyEnrolledLaunch}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">
                En attente app
              </dt>
              <dd className="text-xl font-black text-amber-800">
                {formation.pendingAcademyEnroll}
              </dd>
            </div>
          </dl>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={syncing}
              onClick={() => void syncFormation()}
              className="rounded-lg bg-[#305f33] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {syncing ? "…" : "Synchroniser /formation → Academy"}
            </button>
            <a
              href="/admin/training-registrations"
              className="text-xs font-bold text-[#305f33] underline"
            >
              Liste complète /formation →
            </a>
          </div>
          {syncMsg ? <p className="mt-2 text-xs font-semibold text-[#305f33]">{syncMsg}</p> : null}
        </div>
      ) : null}
      {selected && sessions.length > 0 ? (
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Sessions — {selected}</h2>
          <p className="mt-1 text-xs text-stone-500">
            URLs live / replay (replay visible après fin de session)
          </p>
          <ul className="mt-3 space-y-4">
            {sessions.map((s) => (
              <li
                key={s.id}
                className="rounded-lg border border-stone-200 p-3 text-xs"
              >
                <p className="font-semibold">{s.titleFr}</p>
                <p className="text-stone-500">{s.slug} · {new Date(s.startsAt).toLocaleString()}</p>
                <label className="mt-2 block">
                  <span className="font-medium">live_url</span>
                  <input
                    type="url"
                    className="mt-1 w-full rounded border border-stone-200 px-2 py-1"
                    value={sessionDraft[s.id]?.liveUrl ?? ""}
                    onChange={(e) =>
                      setSessionDraft((prev) => ({
                        ...prev,
                        [s.id]: {
                          liveUrl: e.target.value,
                          replayUrl: prev[s.id]?.replayUrl ?? "",
                          replayR2Key: prev[s.id]?.replayR2Key ?? "",
                        },
                      }))
                    }
                  />
                </label>
                <label className="mt-2 block">
                  <span className="font-medium">replay_url</span>
                  <input
                    type="url"
                    className="mt-1 w-full rounded border border-stone-200 px-2 py-1"
                    value={sessionDraft[s.id]?.replayUrl ?? ""}
                    onChange={(e) =>
                      setSessionDraft((prev) => ({
                        ...prev,
                        [s.id]: {
                          liveUrl: prev[s.id]?.liveUrl ?? "",
                          replayUrl: e.target.value,
                          replayR2Key: prev[s.id]?.replayR2Key ?? "",
                        },
                      }))
                    }
                  />
                </label>
                <label className="mt-2 block">
                  <span className="font-medium">replay_r2_key</span>
                  <input
                    type="text"
                    placeholder="replays/edition/session.mp4"
                    className="mt-1 w-full rounded border border-stone-200 px-2 py-1"
                    value={sessionDraft[s.id]?.replayR2Key ?? ""}
                    onChange={(e) =>
                      setSessionDraft((prev) => ({
                        ...prev,
                        [s.id]: {
                          liveUrl: prev[s.id]?.liveUrl ?? "",
                          replayUrl: prev[s.id]?.replayUrl ?? "",
                          replayR2Key: e.target.value,
                        },
                      }))
                    }
                  />
                </label>
                <button
                  type="button"
                  disabled={savingSession === s.id}
                  onClick={() => void saveSession(s.id)}
                  className="mt-2 rounded bg-[#305f33] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                >
                  Enregistrer
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {selected && analytics ? (
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Analytics formateur — {selected}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">Inscrits</dt>
              <dd className="text-xl font-black">{analytics.enrollmentsActive}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">Lives</dt>
              <dd className="text-xl font-black">{analytics.livesAttended}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">Quiz OK</dt>
              <dd className="text-xl font-black">{analytics.quizPasses}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">Modules</dt>
              <dd className="text-xl font-black">{analytics.modulesCompleted}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-bold uppercase text-stone-500">Replays</dt>
              <dd className="text-xl font-black">{analytics.replayViews}</dd>
            </div>
          </dl>
          {analytics.eventsByVerb.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2 text-[10px]">
              {analytics.eventsByVerb.map((e) => (
                <li
                  key={e.verb}
                  className="rounded-full bg-stone-100 px-2 py-0.5 font-semibold text-stone-700"
                >
                  {e.verb} · {e.n}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {selected ? (
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Co-animateurs — {selected}</h2>
          <p className="mt-1 text-xs text-stone-500">
            Accès lien Jitsi host (en plus des agents / super admin)
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="email"
              placeholder="email@exemple.com"
              value={hostEmail}
              onChange={(e) => setHostEmail(e.target.value)}
              className="min-w-[200px] flex-1 rounded border border-stone-200 px-2 py-1.5 text-sm"
            />
            <button
              type="button"
              disabled={hostBusy}
              onClick={() => void addCoHost()}
              className="rounded-lg bg-[#305f33] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
            >
              {hostBusy ? "…" : "Ajouter"}
            </button>
          </div>
          {hostMsg ? <p className="mt-2 text-xs font-semibold text-[#305f33]">{hostMsg}</p> : null}
          <ul className="mt-3 space-y-1">
            {hosts.length === 0 ? (
              <li className="text-xs text-stone-500">Aucun co-animateur</li>
            ) : (
              hosts.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-lg bg-stone-50 px-3 py-2 text-xs"
                >
                  <span>
                    <span className="font-semibold">{h.email}</span>
                    {h.displayName ? ` · ${h.displayName}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => void removeCoHost(h.id)}
                    className="font-bold text-rose-700"
                  >
                    Retirer
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className={adminCls.card}>
          <h2 className="text-sm font-bold">Éditions</h2>
          <ul className="mt-2 space-y-1">
            {editions.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => setSelected(e.slug)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm ${
                    selected === e.slug
                      ? "bg-stone-900 text-white"
                      : "bg-stone-50 hover:bg-stone-100"
                  }`}
                >
                  <span className="font-semibold">{e.titleFr}</span>
                  <span className="ml-2 text-xs opacity-80">
                    {e.status}
                    {e.formationRegistrations != null
                      ? ` · ${e.formationRegistrations} /formation`
                      : ""}
                    {" · "}
                    {e.enrollmentCount} Academy
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className={adminCls.card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">
              Inscriptions {selected ? `— ${selected}` : ""}
            </h2>
            {selected && enrollments.length > 0 ? (
              <button
                type="button"
                onClick={exportCsv}
                className="text-xs font-bold text-[#305f33]"
              >
                CSV
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-stone-500">{total} total</p>
          {!selected ? (
            <p className="mt-4 text-sm text-stone-500">Sélectionnez une édition</p>
          ) : (
            <div className="mt-2 max-h-[420px] overflow-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="py-1 pr-2">Email</th>
                    <th className="py-1 pr-2">Nom</th>
                    <th className="py-1">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((r) => (
                    <tr key={r.id} className="border-b border-stone-100">
                      <td className="py-1.5 pr-2">{r.email}</td>
                      <td className="py-1.5 pr-2">{r.displayName ?? "—"}</td>
                      <td className="py-1.5 whitespace-nowrap">
                        {new Date(r.enrolledAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
