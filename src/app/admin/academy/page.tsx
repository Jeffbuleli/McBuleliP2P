"use client";

import { useCallback, useEffect, useState } from "react";
import { adminCls, AdminBackLink, AdminPageHeader } from "@/components/admin/admin-ui";

type EditionRow = {
  id: string;
  slug: string;
  programSlug: string;
  titleFr: string;
  status: string;
  enrollmentCount: number;
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
};

export default function AdminAcademyPage() {
  const [editions, setEditions] = useState<EditionRow[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionDraft, setSessionDraft] = useState<Record<string, { liveUrl: string; replayUrl: string }>>({});
  const [savingSession, setSavingSession] = useState<string | null>(null);
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

  const loadSessions = useCallback(async (editionSlug: string) => {
    const res = await fetch(
      `/api/admin/academy?edition=${encodeURIComponent(editionSlug)}&sessions=1`,
      { credentials: "include" },
    );
    const j = await res.json().catch(() => ({}));
    if (res.ok) {
      const rows = (j.sessions as SessionRow[]) ?? [];
      setSessions(rows);
      const draft: Record<string, { liveUrl: string; replayUrl: string }> = {};
      for (const s of rows) {
        draft[s.id] = {
          liveUrl: s.liveUrl ?? "",
          replayUrl: s.replayUrl ?? "",
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
    }
  }, [selected, loadEnrollments, loadSessions]);

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
                    {e.status} · {e.enrollmentCount} inscrits
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
