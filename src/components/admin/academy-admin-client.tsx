"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import { buildLiveJoinUrl } from "@/lib/academy-live";
import { ACADEMY_JITSI_APP_NAME } from "@/lib/academy-jitsi-brand";

type TabId = "overview" | "program" | "lives" | "enrollments" | "analytics" | "tools";

type FormationStats = {
  formationTotal: number;
  formationLinkedToUser: number;
  academyEnrolledLaunch: number;
  pendingAcademyEnroll: number;
};

type LiveInfra = {
  liveBaseUrl: string | null;
  jitsiBaseUrl: string | null;
  embedEnabled: boolean;
  r2PublicBaseUrl: string | null;
};

type EditionRow = {
  id: string;
  slug: string;
  programSlug: string;
  titleFr: string;
  status: string;
  liveBaseUrl: string | null;
  tutorEnabled: boolean;
  sessionCount: number;
  enrollmentCount: number;
  formationRegistrations: number | null;
};

type EditionDetail = {
  id: string;
  slug: string;
  programSlug: string;
  titleFr: string;
  titleEn: string;
  status: string;
  liveBaseUrl: string | null;
  tutorEnabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
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

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Aperçu" },
  { id: "program", label: "Programme" },
  { id: "lives", label: "Lives & Jitsi" },
  { id: "enrollments", label: "Inscriptions" },
  { id: "analytics", label: "Analytics" },
  { id: "tools", label: "Outils" },
];

const EDITION_STATUSES = ["draft", "open", "active", "closed"] as const;

function effectiveLiveBase(
  editionUrl: string | null,
  infra: LiveInfra | null,
): string | null {
  return (
    editionUrl?.trim() ||
    infra?.liveBaseUrl?.trim() ||
    infra?.jitsiBaseUrl?.trim() ||
    null
  );
}

export function AcademyAdminClient() {
  const [tab, setTab] = useState<TabId>("overview");
  const [editions, setEditions] = useState<EditionRow[]>([]);
  const [formation, setFormation] = useState<FormationStats | null>(null);
  const [infra, setInfra] = useState<LiveInfra | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [editionDetail, setEditionDetail] = useState<EditionDetail | null>(null);
  const [moduleCount, setModuleCount] = useState(0);
  const [editionDraft, setEditionDraft] = useState<{
    status: string;
    liveBaseUrl: string;
    tutorEnabled: boolean;
  } | null>(null);
  const [savingEdition, setSavingEdition] = useState(false);
  const [editionMsg, setEditionMsg] = useState<string | null>(null);

  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionDraft, setSessionDraft] = useState<
    Record<string, { liveUrl: string; replayUrl: string; replayR2Key: string }>
  >({});
  const [analytics, setAnalytics] = useState<EditionAnalytics | null>(null);
  const [hosts, setHosts] = useState<HostRow[]>([]);
  const [hostEmail, setHostEmail] = useState("");
  const [hostBusy, setHostBusy] = useState(false);
  const [hostMsg, setHostMsg] = useState<string | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  const selectedEdition = useMemo(
    () => editions.find((e) => e.slug === selected) ?? null,
    [editions, selected],
  );

  const liveBaseEffective = useMemo(
    () =>
      effectiveLiveBase(
        editionDraft?.liveBaseUrl || selectedEdition?.liveBaseUrl || null,
        infra,
      ),
    [editionDraft?.liveBaseUrl, selectedEdition?.liveBaseUrl, infra],
  );

  const loadOverview = useCallback(async () => {
    setErr(null);
    const res = await fetch("/api/admin/academy", { credentials: "include" });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr("Forbidden");
      return;
    }
    const eds = (j.editions as EditionRow[]) ?? [];
    setEditions(eds);
    setFormation((j.formation as FormationStats) ?? null);
    setInfra((j.infra as LiveInfra) ?? null);
    setSelected((cur) => cur ?? eds[0]?.slug ?? null);
  }, []);

  const loadEditionDetail = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy?edition=${encodeURIComponent(editionSlug)}&detail=1`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setEditionDetail(null);
      return;
    }
    const ed = j.edition as EditionDetail;
    setEditionDetail(ed);
    setModuleCount(typeof j.moduleCount === "number" ? j.moduleCount : 0);
    setEditionDraft({
      status: ed.status,
      liveBaseUrl: ed.liveBaseUrl ?? "",
      tutorEnabled: ed.tutorEnabled,
    });
  }, []);

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
      const draft: Record<
        string,
        { liveUrl: string; replayUrl: string; replayR2Key: string }
      > = {};
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

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (selected) {
      void loadEditionDetail(selected);
      void loadEnrollments(selected);
      void loadSessions(selected);
      void loadHosts(selected);
      void loadAnalytics(selected);
    }
  }, [
    selected,
    loadEditionDetail,
    loadEnrollments,
    loadSessions,
    loadHosts,
    loadAnalytics,
  ]);

  async function saveEdition() {
    if (!editionDetail || !editionDraft) return;
    setSavingEdition(true);
    setEditionMsg(null);
    try {
      const res = await fetch("/api/admin/academy", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          editionId: editionDetail.id,
          status: editionDraft.status,
          liveBaseUrl: editionDraft.liveBaseUrl.trim() || null,
          tutorEnabled: editionDraft.tutorEnabled,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setEditionMsg(typeof j.error === "string" ? j.error : "Erreur");
        return;
      }
      setEditionMsg("Programme enregistré");
      await loadOverview();
      if (selected) await loadEditionDetail(selected);
    } finally {
      setSavingEdition(false);
    }
  }

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
        `OK — ${j.enrolled ?? 0} inscrits Academy · ${j.noAccount ?? 0} sans compte`,
      );
      await loadOverview();
      if (selected) await loadEnrollments(selected);
    } finally {
      setSyncing(false);
    }
  }

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

  function sessionJoinUrls(session: SessionRow) {
    if (!selected) return null;
    const base = {
      editionSlug: selected,
      sessionSlug: session.slug,
      sessionLiveUrl: sessionDraft[session.id]?.liveUrl || session.liveUrl,
      liveBaseUrl: liveBaseEffective,
      sessionTitle: session.titleFr,
    };
    return {
      learner: buildLiveJoinUrl({ ...base, mode: "learner" }),
      host: buildLiveJoinUrl({ ...base, mode: "host" }),
      audio: buildLiveJoinUrl({ ...base, mode: "audio" }),
      app: `/app/academy/${selected}/live/${session.slug}?program=${encodeURIComponent(selectedEdition?.programSlug ?? "")}`,
    };
  }

  const totalEnrollments = editions.reduce((n, e) => n + e.enrollmentCount, 0);
  const totalSessions = editions.reduce((n, e) => n + e.sessionCount, 0);

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin">← Admin</AdminBackLink>
      <AdminPageHeader
        title="Academy — Centre de contrôle"
        subtitle="Programmes, lives Jitsi McBuleli, inscriptions & analytics"
      />
      {err ? <p className={adminCls.error}>{err}</p> : null}

      <div className={`${adminCls.card} flex flex-wrap gap-2`}>
        <span className="w-full text-[10px] font-extrabold uppercase tracking-wide text-[color:var(--fd-muted)]">
          Édition / cohorte
        </span>
        {editions.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setSelected(e.slug)}
            className={`rounded-xl px-3 py-2 text-left text-xs font-bold transition ${
              selected === e.slug
                ? "bg-[color:var(--fd-primary)] text-white shadow-md"
                : "border border-[color:var(--fd-border)] bg-white text-[color:var(--fd-text)] hover:bg-[color:var(--fd-mint)]"
            }`}
          >
            {e.titleFr}
            <span className="mt-0.5 block font-medium opacity-80">
              {e.status} · {e.enrollmentCount} inscrits · {e.sessionCount} sessions
            </span>
          </button>
        ))}
      </div>

      <nav
        className="flex flex-wrap gap-1 rounded-xl border border-[color:var(--fd-border)] bg-white p-1"
        aria-label="Academy admin"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
              tab === t.id
                ? "bg-[color:var(--fd-primary)] text-white"
                : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="Éditions" value={String(editions.length)} />
            <Kpi label="Inscrits (total)" value={String(totalEnrollments)} />
            <Kpi label="Sessions live" value={String(totalSessions)} />
            <Kpi
              label="Serveur live"
              value={liveBaseEffective ? "OK" : "—"}
              sub={liveBaseEffective ?? "Non configuré"}
            />
          </div>

          {formation ? (
            <div className={adminCls.card}>
              <h2 className={adminCls.h2}>Lancement juin — /formation ↔ Academy</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi label="/formation" value={String(formation.formationTotal)} compact />
                <Kpi label="Compte lié" value={String(formation.formationLinkedToUser)} compact />
                <Kpi label="Academy app" value={String(formation.academyEnrolledLaunch)} compact />
                <Kpi
                  label="En attente"
                  value={String(formation.pendingAcademyEnroll)}
                  compact
                />
              </dl>
            </div>
          ) : null}

          {infra ? (
            <div className={adminCls.card}>
              <h2 className={adminCls.h2}>Infra live (Render / VPS)</h2>
              <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-[color:var(--fd-text)]">
                <li>
                  <span className="text-[color:var(--fd-muted)]">LIVE_BASE</span>{" "}
                  {infra.liveBaseUrl ?? "—"}
                </li>
                <li>
                  <span className="text-[color:var(--fd-muted)]">JITSI_BASE</span>{" "}
                  {infra.jitsiBaseUrl ?? "—"}
                </li>
                <li>
                  <span className="text-[color:var(--fd-muted)]">EMBED</span>{" "}
                  {infra.embedEnabled ? "true" : "false"}
                </li>
                <li>
                  <span className="text-[color:var(--fd-muted)]">R2 public</span>{" "}
                  {infra.r2PublicBaseUrl ?? "—"}
                </li>
              </ul>
              <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
                Branding Jitsi : {ACADEMY_JITSI_APP_NAME} (hash URL depuis l&apos;app)
              </p>
            </div>
          ) : null}

          {selectedEdition && analytics ? (
            <div className={adminCls.card}>
              <h2 className={adminCls.h2}>Snapshot — {selectedEdition.titleFr}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Kpi label="Inscrits" value={String(analytics.enrollmentsActive)} compact />
                <Kpi label="Lives" value={String(analytics.livesAttended)} compact />
                <Kpi label="Quiz" value={String(analytics.quizPasses)} compact />
                <Kpi label="Modules" value={String(analytics.modulesCompleted)} compact />
                <Kpi label="Replays" value={String(analytics.replayViews)} compact />
              </dl>
            </div>
          ) : null}
        </>
      ) : null}

      {tab === "program" && selected && editionDraft ? (
        <div className={adminCls.card}>
          <h2 className={adminCls.h2}>Programme — {selectedEdition?.titleFr}</h2>
          <p className={`mt-1 ${adminCls.muted}`}>
            Slug <code className="text-[10px]">{selected}</code> · {moduleCount} modules
            · programme {editionDetail?.programSlug}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-bold text-[color:var(--fd-text)]">Statut cohorte</span>
              <select
                className={`${adminCls.select} mt-1 w-full`}
                value={editionDraft.status}
                onChange={(e) =>
                  setEditionDraft((d) =>
                    d ? { ...d, status: e.target.value } : d,
                  )
                }
              >
                {EDITION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 pt-6 text-sm font-bold">
              <input
                type="checkbox"
                checked={editionDraft.tutorEnabled}
                onChange={(e) =>
                  setEditionDraft((d) =>
                    d ? { ...d, tutorEnabled: e.target.checked } : d,
                  )
                }
                className="h-4 w-4 rounded border-[color:var(--fd-border)]"
              />
              Tuteur IA activé (companion live)
            </label>
          </div>
          <label className="mt-4 block text-sm">
            <span className="font-bold text-[color:var(--fd-text)]">
              live_base_url (override Jitsi)
            </span>
            <input
              type="url"
              placeholder="https://live.mcbuleli.org"
              className={`${adminCls.input} mt-1 w-full font-mono text-xs`}
              value={editionDraft.liveBaseUrl}
              onChange={(e) =>
                setEditionDraft((d) =>
                  d ? { ...d, liveBaseUrl: e.target.value } : d,
                )
              }
            />
            <span className="mt-1 block text-[10px] text-[color:var(--fd-muted)]">
              Vide = env global Render. Salles :{" "}
              <code>
                {liveBaseEffective ?? "…"}/{"{session-slug}"}
              </code>
            </span>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={savingEdition}
              onClick={() => void saveEdition()}
              className={adminCls.btnPrimary}
            >
              {savingEdition ? "…" : "Enregistrer le programme"}
            </button>
            {editionDetail ? (
              <Link
                href={`/app/academy/${editionDetail.slug}?program=${encodeURIComponent(editionDetail.programSlug)}`}
                className={adminCls.btnSecondary}
                target="_blank"
              >
                Voir hub apprenant ↗
              </Link>
            ) : null}
          </div>
          {editionMsg ? (
            <p className="mt-2 text-xs font-semibold text-[color:var(--fd-primary)]">
              {editionMsg}
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "lives" && selected ? (
        <div className="space-y-4">
          <div className={adminCls.card}>
            <h2 className={adminCls.h2}>Jitsi McBuleli — {selected}</h2>
            <p className={`mt-1 ${adminCls.muted}`}>
              Liens générés avec branding {ACADEMY_JITSI_APP_NAME}. Testez host avant le live.
            </p>
            {liveBaseEffective ? (
              <a
                href={liveBaseEffective}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block text-xs font-bold text-[color:var(--fd-primary)] underline"
              >
                Ouvrir {liveBaseEffective} ↗
              </a>
            ) : (
              <p className="mt-2 text-xs text-amber-800">
                Configurez live_base_url ou NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL
              </p>
            )}
          </div>

          {sessions.length === 0 ? (
            <p className={adminCls.empty}>Aucune session pour cette édition</p>
          ) : (
            <ul className="space-y-4">
              {sessions.map((s) => {
                const urls = sessionJoinUrls(s);
                return (
                  <li key={s.id} className={adminCls.card}>
                    <p className="font-bold text-[color:var(--fd-text)]">{s.titleFr}</p>
                    <p className="text-xs text-[color:var(--fd-muted)]">
                      {s.slug} · {new Date(s.startsAt).toLocaleString()}
                    </p>
                    {urls ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        <a
                          href={urls.host}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[10px] font-extrabold text-amber-950"
                        >
                          Host 480p ↗
                        </a>
                        <a
                          href={urls.learner}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[color:var(--fd-mint)] px-2.5 py-1.5 text-[10px] font-extrabold text-[color:var(--fd-primary)]"
                        >
                          Apprenant ↗
                        </a>
                        <a
                          href={urls.audio}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-[color:var(--fd-border)] px-2.5 py-1.5 text-[10px] font-bold"
                        >
                          Audio seul ↗
                        </a>
                        <Link
                          href={urls.app}
                          target="_blank"
                          className="rounded-lg border-2 border-[color:var(--fd-primary)] px-2.5 py-1.5 text-[10px] font-extrabold text-[color:var(--fd-primary)]"
                        >
                          Companion app ↗
                        </Link>
                      </div>
                    ) : null}
                    <label className="mt-3 block text-xs">
                      <span className="font-bold">live_url (override)</span>
                      <input
                        type="url"
                        className={`${adminCls.input} mt-1 w-full text-xs`}
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
                    <label className="mt-2 block text-xs">
                      <span className="font-bold">replay_url</span>
                      <input
                        type="url"
                        className={`${adminCls.input} mt-1 w-full text-xs`}
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
                    <label className="mt-2 block text-xs">
                      <span className="font-bold">replay_r2_key</span>
                      <input
                        type="text"
                        placeholder="replays/edition/session.mp4"
                        className={`${adminCls.input} mt-1 w-full font-mono text-xs`}
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
                      className={`${adminCls.btnPrimary} mt-3`}
                    >
                      {savingSession === s.id ? "…" : "Enregistrer session"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={adminCls.card}>
            <h2 className={adminCls.h2}>Co-animateurs</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="email"
                placeholder="email@exemple.com"
                value={hostEmail}
                onChange={(e) => setHostEmail(e.target.value)}
                className={`${adminCls.input} min-w-[200px] flex-1`}
              />
              <button
                type="button"
                disabled={hostBusy}
                onClick={() => void addCoHost()}
                className={adminCls.btnPrimary}
              >
                {hostBusy ? "…" : "Ajouter"}
              </button>
            </div>
            {hostMsg ? (
              <p className="mt-2 text-xs font-semibold text-[color:var(--fd-primary)]">
                {hostMsg}
              </p>
            ) : null}
            <ul className="mt-3 space-y-1">
              {hosts.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between rounded-lg bg-[color:var(--fd-mint)]/40 px-3 py-2 text-xs"
                >
                  <span className="font-semibold">{h.email}</span>
                  <button
                    type="button"
                    onClick={() => void removeCoHost(h.id)}
                    className="font-bold text-rose-700"
                  >
                    Retirer
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      {tab === "enrollments" && selected ? (
        <div className={adminCls.card}>
          <div className="flex items-center justify-between gap-2">
            <h2 className={adminCls.h2}>Inscriptions — {selected}</h2>
            {enrollments.length > 0 ? (
              <button type="button" onClick={exportCsv} className="text-xs font-bold text-[color:var(--fd-primary)]">
                Export CSV
              </button>
            ) : null}
          </div>
          <p className={`mt-1 ${adminCls.muted}`}>{total} total</p>
          <div className="mt-3 max-h-[480px] overflow-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[color:var(--fd-border)]">
                  <th className="py-2 pr-2">Email</th>
                  <th className="py-2 pr-2">Nom</th>
                  <th className="py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((r) => (
                  <tr key={r.id} className="border-b border-[color:var(--fd-border)]/60">
                    <td className="py-2 pr-2">{r.email}</td>
                    <td className="py-2 pr-2">{r.displayName ?? "—"}</td>
                    <td className="py-2 whitespace-nowrap">
                      {new Date(r.enrolledAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "analytics" && selected && analytics ? (
        <div className={adminCls.card}>
          <h2 className={adminCls.h2}>Analytics formateur — {selected}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Kpi label="Inscrits" value={String(analytics.enrollmentsActive)} compact />
            <Kpi label="Lives" value={String(analytics.livesAttended)} compact />
            <Kpi label="Quiz OK" value={String(analytics.quizPasses)} compact />
            <Kpi label="Modules" value={String(analytics.modulesCompleted)} compact />
            <Kpi label="Replays" value={String(analytics.replayViews)} compact />
          </dl>
          {analytics.eventsByVerb.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {analytics.eventsByVerb.map((e) => (
                <li
                  key={e.verb}
                  className="rounded-full bg-[color:var(--fd-mint)] px-2.5 py-0.5 text-[10px] font-semibold"
                >
                  {e.verb} · {e.n}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {tab === "tools" ? (
        <div className="space-y-4">
          <div className={adminCls.card}>
            <h2 className={adminCls.h2}>Synchronisation & données</h2>
            <button
              type="button"
              disabled={syncing}
              onClick={() => void syncFormation()}
              className={adminCls.btnPrimary}
            >
              {syncing ? "…" : "Synchroniser /formation → Academy"}
            </button>
            {syncMsg ? (
              <p className="mt-2 text-xs font-semibold text-[color:var(--fd-primary)]">
                {syncMsg}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
              <Link href="/admin/training-registrations" className="text-[color:var(--fd-primary)] underline">
                Liste /formation →
              </Link>
              <a
                href="https://live.mcbuleli.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[color:var(--fd-primary)] underline"
              >
                Serveur Jitsi ↗
              </a>
            </div>
          </div>
          <div className={adminCls.card}>
            <h2 className={adminCls.h2}>Guide ops</h2>
            <p className={`${adminCls.muted} text-xs leading-relaxed`}>
              Replays R2, crons, variables Render : voir{" "}
              <code className="text-[10px]">docs/academy-infra.md</code> dans le dépôt.
              Personnalisation Jitsi côté VPS (logo, couleurs) :{" "}
              <code className="text-[10px]">interface_config.js</code> sur le serveur live.
            </p>
          </div>
        </div>
      ) : null}

      {!selected && tab !== "overview" && tab !== "tools" ? (
        <p className={adminCls.empty}>Sélectionnez une édition ci-dessus</p>
      ) : null}
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  compact,
}: {
  label: string;
  value: string;
  sub?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : adminCls.card}>
      <dt className={adminCls.kpiLabel}>{label}</dt>
      <dd className={compact ? "text-xl font-black text-[color:var(--fd-primary)]" : adminCls.kpiValue}>
        {value}
      </dd>
      {sub ? <dd className="mt-0.5 truncate text-[10px] text-[color:var(--fd-muted)]">{sub}</dd> : null}
    </div>
  );
}
