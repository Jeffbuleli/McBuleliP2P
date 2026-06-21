"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { AcademyKpiStrip } from "@/components/admin/academy-kpi-strip";
import { AcademyLeadsTab } from "@/components/admin/academy-leads-tab";
import {
  AdvancedBlock,
  ANALYTICS_VERB_FR,
  EDITION_STATUS_FR,
  formatSessionWhen,
  LiveActionChip,
  SectionHead,
  StatusPill,
} from "@/components/admin/academy-admin-ui";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";
import {
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";
import { buildLiveEnterAppPath } from "@/lib/academy-live-enter-path";
import type { EventDashboardKpis } from "@/lib/events/types";

type TabId = "overview" | "program" | "lives" | "enrollments" | "analytics" | "tools" | "leads";

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

const TABS: { id: TabId; label: string; icon: "live" | "calendar" | "chat" | "tutor" | "wallet" | "signal" }[] = [
  { id: "overview", label: "Aperçu", icon: "signal" },
  { id: "program", label: "Cohorte", icon: "calendar" },
  { id: "lives", label: "Événements", icon: "live" },
  { id: "enrollments", label: "Inscrits", icon: "wallet" },
  { id: "leads", label: "Leads", icon: "chat" },
  { id: "analytics", label: "Stats", icon: "tutor" },
  { id: "tools", label: "Outils", icon: "signal" },
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
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabId | null) ?? "overview";
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : "overview",
  );
  const [editions, setEditions] = useState<EditionRow[]>([]);
  const [formation, setFormation] = useState<FormationStats | null>(null);
  const [eventKpis, setEventKpis] = useState<EventDashboardKpis | null>(null);
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
    setEventKpis((j.eventKpis as EventDashboardKpis) ?? null);
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
    const programSlug = selectedEdition?.programSlug ?? "";
    const enterBase = {
      editionSlug: selected,
      sessionSlug: session.slug,
      programSlug: programSlug || undefined,
    };
    return {
      learner: buildLiveEnterAppPath({ ...enterBase, mode: "learner" }),
      host: buildLiveEnterAppPath({ ...enterBase, mode: "host" }),
      audio: buildLiveEnterAppPath({ ...enterBase, mode: "audio" }),
      app: `/app/academy/${selected}/live/${session.slug}?program=${encodeURIComponent(programSlug)}`,
    };
  }

  const launchLiveEnterHost = buildLiveEnterAppPath({
    editionSlug: ACADEMY_EDITION_JUNE_2026,
    sessionSlug: "lancement-8-juin",
    programSlug: ACADEMY_PROGRAM_LAUNCH,
    mode: "host",
  });

  const totalEnrollments = editions.reduce((n, e) => n + e.enrollmentCount, 0);
  const totalSessions = editions.reduce((n, e) => n + e.sessionCount, 0);

  return (
    <div className={adminCls.page}>
      <AdminBackLink href="/admin">← Admin</AdminBackLink>
      <AdminPageHeader title="Academy" subtitle="Cohortes · événements · McBuleli Live" />
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
              {EDITION_STATUS_FR[e.status] ?? e.status} · {e.enrollmentCount} ·{" "}
              {e.sessionCount} évts
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
            className={`flex flex-col items-center gap-0.5 rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${
              tab === t.id
                ? "bg-[color:var(--fd-primary)] text-white"
                : "text-[color:var(--fd-muted)] hover:bg-[color:var(--fd-mint)]"
            }`}
          >
            <AcademyIcon
              name={t.icon}
              className={`h-4 w-4 ${tab === t.id ? "!text-white" : ""}`}
            />
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <>
          <AcademyKpiStrip
            editions={editions.length}
            enrollments={totalEnrollments}
            events={totalSessions}
            eventKpis={eventKpis}
            liveOk={Boolean(liveBaseEffective)}
          />

          {formation ? (
            <div className={adminCls.card}>
              <SectionHead
                icon="wallet"
                title="Inscriptions lancement"
                hint="Page formation publique et comptes Academy"
              />
              <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Kpi label="Demandes" value={String(formation.formationTotal)} compact />
                <Kpi label="Comptes liés" value={String(formation.formationLinkedToUser)} compact />
                <Kpi label="Dans l'app" value={String(formation.academyEnrolledLaunch)} compact />
                <Kpi label="En attente" value={String(formation.pendingAcademyEnroll)} compact />
              </dl>
            </div>
          ) : null}

          {infra ? (
            <div className={adminCls.card}>
              <SectionHead
                icon="live"
                title="Salle McBuleli Live"
                hint="Serveur vidéo pour les cohortes"
              />
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StatusPill
                  ok={!!liveBaseEffective}
                  label={liveBaseEffective ? "En ligne" : "À configurer"}
                />
                {infra.embedEnabled ? (
                  <StatusPill ok label="Vidéo dans l'app" />
                ) : null}
                {infra.r2PublicBaseUrl ? <StatusPill ok label="Replays cloud" /> : null}
              </div>
              {liveBaseEffective ? (
                <a
                  href={launchLiveEnterHost}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[color:var(--fd-primary)] underline"
                >
                  <AcademyIcon name="video" className="h-4 w-4" />
                  Ouvrir la salle live ↗
                </a>
              ) : null}
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
          <SectionHead
            icon="calendar"
            title={selectedEdition?.titleFr ?? "Programme"}
            hint={`${moduleCount} modules · cohorte`}
          />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-bold text-[color:var(--fd-text)]">Statut</span>
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
                    {EDITION_STATUS_FR[s] ?? s}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-[color:var(--fd-mint)]/30 px-3 py-3 text-sm font-bold">
              <AcademyIcon name="tutor" className="h-5 w-5 shrink-0" />
              <input
                type="checkbox"
                checked={editionDraft.tutorEnabled}
                onChange={(e) =>
                  setEditionDraft((d) =>
                    d ? { ...d, tutorEnabled: e.target.checked } : d,
                  )
                }
                className="h-4 w-4 rounded"
              />
              Tuteur IA pendant le live
            </label>
          </div>
          <AdvancedBlock summary="Serveur live personnalisé (optionnel)">
            <label className="block text-sm">
              <span className="font-bold text-[color:var(--fd-text)]">Adresse salle live</span>
              <input
                type="url"
                placeholder="https://live.mcbuleli.org"
                className={`${adminCls.input} mt-1 w-full`}
                value={editionDraft.liveBaseUrl}
                onChange={(e) =>
                  setEditionDraft((d) =>
                    d ? { ...d, liveBaseUrl: e.target.value } : d,
                  )
                }
              />
              <span className="mt-1 block text-[10px] text-[color:var(--fd-muted)]">
                Laissez vide pour utiliser le serveur McBuleli par défaut.
              </span>
            </label>
          </AdvancedBlock>
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
            <SectionHead
              icon="live"
              title="Événements McBuleli Live"
              hint="Testez « Animation » avant chaque cours"
            />
            {!liveBaseEffective ? (
              <p className="mt-3 text-xs font-semibold text-amber-800">
                Serveur live non configuré — onglet Programme ou variables Render.
              </p>
            ) : null}
          </div>

          {sessions.length === 0 ? (
            <p className={adminCls.empty}>Aucun live planifié</p>
          ) : (
            <ul className="space-y-4">
              {sessions.map((s) => {
                const urls = sessionJoinUrls(s);
                return (
                  <li key={s.id} className={adminCls.card}>
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-50">
                        <AcademyIcon name="live" className="h-6 w-6" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-[color:var(--fd-text)]">{s.titleFr}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[color:var(--fd-muted)]">
                          <AcademyIcon name="calendar" className="h-3.5 w-3.5" />
                          {formatSessionWhen(s.startsAt)}
                        </p>
                      </div>
                    </div>
                    {urls ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <LiveActionChip
                          href={urls.host}
                          icon="video"
                          label="Animation"
                          variant="host"
                        />
                        <LiveActionChip
                          href={urls.learner}
                          icon="camera"
                          label="Apprenants"
                          variant="learner"
                        />
                        <LiveActionChip
                          href={urls.audio}
                          icon="audio"
                          label="Audio"
                          variant="default"
                        />
                        <LiveActionChip
                          href={urls.app}
                          icon="chat"
                          label="App McBuleli"
                          variant="app"
                        />
                      </div>
                    ) : null}
                    <AdvancedBlock summary="Replay & lien personnalisé">
                      <label className="block text-xs">
                        <span className="font-bold text-[color:var(--fd-text)]">
                          Lien live alternatif
                        </span>
                        <input
                          type="url"
                          placeholder="Vide = salle McBuleli automatique"
                          className={`${adminCls.input} mt-1 w-full`}
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
                      <label className="block text-xs">
                        <span className="font-bold text-[color:var(--fd-text)]">
                          Replay (lien web)
                        </span>
                        <input
                          type="url"
                          placeholder="YouTube, Drive…"
                          className={`${adminCls.input} mt-1 w-full`}
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
                      <label className="block text-xs">
                        <span className="font-bold text-[color:var(--fd-text)]">
                          Replay (fichier cloud)
                        </span>
                        <input
                          type="text"
                          placeholder="dossier/nom-de-la-video.mp4"
                          className={`${adminCls.input} mt-1 w-full`}
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
                    </AdvancedBlock>
                    <button
                      type="button"
                      disabled={savingSession === s.id}
                      onClick={() => void saveSession(s.id)}
                      className={`${adminCls.btnPrimary} mt-3 w-full sm:w-auto`}
                    >
                      {savingSession === s.id ? "…" : "Enregistrer"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className={adminCls.card}>
            <SectionHead
              icon="tutor"
              title="Équipe live"
              hint="Co-animateurs avec accès Animation"
            />
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
          <SectionHead icon="tutor" title="Statistiques" hint={selectedEdition?.titleFr} />
          <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Kpi label="Inscrits" value={String(analytics.enrollmentsActive)} compact />
            <Kpi label="Lives" value={String(analytics.livesAttended)} compact />
            <Kpi label="Quiz" value={String(analytics.quizPasses)} compact />
            <Kpi label="Modules" value={String(analytics.modulesCompleted)} compact />
            <Kpi label="Replays" value={String(analytics.replayViews)} compact />
          </dl>
          {analytics.eventsByVerb.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-2">
              {analytics.eventsByVerb.map((e) => (
                <li
                  key={e.verb}
                  className="rounded-full bg-[color:var(--fd-mint)] px-2.5 py-1 text-[10px] font-bold text-[color:var(--fd-primary)]"
                >
                  {ANALYTICS_VERB_FR[e.verb] ?? e.verb} ({e.n})
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {tab === "leads" ? <AcademyLeadsTab /> : null}

      {tab === "tools" ? (
        <div className="space-y-4">
          <div className={adminCls.card}>
            <SectionHead icon="wallet" title="Données" hint="Formation publique → Academy" />
            <button
              type="button"
              disabled={syncing}
              onClick={() => void syncFormation()}
              className={`${adminCls.btnPrimary} mt-4`}
            >
              {syncing ? "…" : "Synchroniser les inscriptions"}
            </button>
            {syncMsg ? (
              <p className="mt-2 text-xs font-semibold text-[color:var(--fd-primary)]">
                {syncMsg}
              </p>
            ) : null}
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setTab("leads")}
                className="flex items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-3 text-sm font-bold text-[color:var(--fd-primary)]"
              >
                <AcademyIcon name="wallet" className="h-5 w-5" />
                Leads /formation
              </button>
              <a
                href={launchLiveEnterHost}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl border border-[color:var(--fd-border)] bg-white px-3 py-3 text-sm font-bold text-[color:var(--fd-primary)]"
              >
                <AcademyIcon name="video" className="h-5 w-5" />
                Salle McBuleli Live ↗
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {!selected && tab !== "overview" && tab !== "tools" && tab !== "leads" ? (
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
