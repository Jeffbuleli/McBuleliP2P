"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode } from "html5-qrcode";
import { adminCls } from "@/components/admin/admin-ui";
import { HackathonPoweredBy } from "@/components/hackathon/hackathon-process-card";

type Edition = {
  id: string;
  nameFr: string;
  startDate: string | null;
};

type RosterPerson = {
  subjectType: "participant" | "partner";
  subjectId: string;
  ticketCode: string | null;
  displayName: string;
  orgOrEmail: string;
  presenceStatus: "absent" | "inside" | "outside";
};

type ScanResult = {
  ok: true;
  mode: "in" | "out";
  presenceStatus: string;
  previousStatus: string;
  pass: {
    subjectType: string;
    displayName: string;
    orgOrEmail: string;
    ticketCode: string;
  };
};

export function HackathonScanClient() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState("");
  const [dayIndex, setDayIndex] = useState<1 | 2 | 3>(1);
  const [mode, setMode] = useState<"in" | "out">("in");
  const [manualCode, setManualCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<ScanResult | null>(null);
  const [counts, setCounts] = useState({
    absent: 0,
    inside: 0,
    outside: 0,
    total: 0,
  });
  const [roster, setRoster] = useState<{
    absent: RosterPerson[];
    inside: RosterPerson[];
    outside: RosterPerson[];
  }>({ absent: [], inside: [], outside: [] });
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const uid = useId().replace(/:/g, "");
  const regionId = `hackathon-door-reader-${uid}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningLock = useRef(false);

  const loadRoster = useCallback(async () => {
    if (!editionId) return;
    const res = await fetch(
      `/api/admin/hackathon/scan?editionId=${encodeURIComponent(editionId)}&dayIndex=${dayIndex}`,
    );
    if (!res.ok) throw new Error("roster_failed");
    const json = (await res.json()) as {
      dayIndex: 1 | 2 | 3;
      suggestedDayIndex: 1 | 2 | 3;
      counts: typeof counts;
      roster: typeof roster;
    };
    setCounts(json.counts);
    setRoster(json.roster);
  }, [editionId, dayIndex]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/admin/hackathon?tab=editions");
      if (!res.ok) return;
      const json = (await res.json()) as {
        editions: { id: string; nameFr: string; startDate: string | null }[];
      };
      setEditions(json.editions);
      if (json.editions[0]) setEditionId(json.editions[0].id);
    })().catch(() => setErr("Impossible de charger les éditions."));
  }, []);

  useEffect(() => {
    void loadRoster().catch(() => setErr("Impossible de charger le roster."));
  }, [loadRoster]);

  const submitScan = useCallback(
    async (code: string) => {
      if (!editionId || !code.trim() || busy) return;
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/admin/hackathon/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: code.trim(),
            mode,
            dayIndex,
            editionId,
          }),
        });
        const json = (await res.json()) as ScanResult & {
          error?: string;
          message?: string;
        };
        if (!res.ok) {
          setErr(json.message || json.error || "Scan refusé");
          setLast(null);
          return;
        }
        setLast(json);
        setManualCode("");
        await loadRoster();
      } catch {
        setErr("Erreur réseau lors du scan.");
      } finally {
        setBusy(false);
        scanningLock.current = false;
      }
    },
    [editionId, mode, dayIndex, busy, loadRoster],
  );

  useEffect(() => {
    if (!camOn) return;
    let stopped = false;
    setCamErr(null);
    const scanner = new Html5Qrcode(regionId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 8, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        (text) => {
          if (stopped || scanningLock.current) return;
          scanningLock.current = true;
          void submitScan(text);
        },
        () => {},
      )
      .catch(() => {
        setCamErr("Caméra inaccessible. Autorisez l'accès ou saisissez le code.");
        setCamOn(false);
      });

    return () => {
      stopped = true;
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s?.isScanning) {
        void s.stop().catch(() => {});
      }
    };
  }, [camOn, regionId, submitScan]);

  function PersonList({
    title,
    people,
    tone,
  }: {
    title: string;
    people: RosterPerson[];
    tone: string;
  }) {
    return (
      <div className="rounded-xl border border-[color:var(--fd-border)] bg-white p-3">
        <p className={`text-xs font-extrabold uppercase tracking-wider ${tone}`}>
          {title} · {people.length}
        </p>
        <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-sm">
          {people.length === 0 ? (
            <li className="text-[color:var(--fd-muted)]">—</li>
          ) : (
            people.map((p) => (
              <li key={`${p.subjectType}-${p.subjectId}`} className="truncate">
                <span className="font-semibold text-[color:var(--fd-text)]">
                  {p.displayName}
                </span>
                <span className="text-[color:var(--fd-muted)]">
                  {" "}
                  · {p.subjectType === "partner" ? "Partenaire" : "Participant"} ·{" "}
                  {p.orgOrEmail}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className={adminCls.page}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={adminCls.h1}>Scanner porte</h2>
          <p className={adminCls.muted}>
            Entrée / sortie (besoin primaire) · badges participants & partenaires · 3 jours
          </p>
        </div>
        <Link href="/admin/hackathon" className={adminCls.btnSecondary}>
          ← Admin Hackathon
        </Link>
      </div>

      {err ? <p className={adminCls.error}>{err}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Édition</span>
          <select
            className={adminCls.input}
            value={editionId}
            onChange={(e) => setEditionId(e.target.value)}
          >
            {editions.map((ed) => (
              <option key={ed.id} value={ed.id}>
                {ed.nameFr}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Jour</span>
          <select
            className={adminCls.input}
            value={dayIndex}
            onChange={(e) =>
              setDayIndex(Number(e.target.value) as 1 | 2 | 3)
            }
          >
            <option value={1}>Jour 1</option>
            <option value={2}>Jour 2</option>
            <option value={3}>Jour 3</option>
          </select>
        </label>
        <div className="text-sm sm:col-span-2">
          <span className="mb-1 block font-semibold">Mode scan</span>
          <div className="flex gap-2">
            <button
              type="button"
              className={mode === "in" ? adminCls.btnPrimary : adminCls.btnSecondary}
              onClick={() => setMode("in")}
            >
              Entrée
            </button>
            <button
              type="button"
              className={mode === "out" ? adminCls.btnPrimary : adminCls.btnSecondary}
              onClick={() => setMode("out")}
            >
              Sortie (besoin)
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-[color:var(--fd-border)] bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Caméra</p>
            <button
              type="button"
              className={camOn ? adminCls.btnSecondary : adminCls.btnPrimary}
              onClick={() => setCamOn((v) => !v)}
            >
              {camOn ? "Arrêter" : "Démarrer caméra"}
            </button>
          </div>
          <div className="relative min-h-[240px] overflow-hidden rounded-xl bg-stone-950">
            <div id={regionId} className="w-full [&_video]:rounded-xl" />
          </div>
          {camErr ? (
            <p className="mt-2 text-sm text-rose-700">{camErr}</p>
          ) : (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              Mode actuel : <strong>{mode === "in" ? "Entrée" : "Sortie"}</strong> · Jour {dayIndex}
            </p>
          )}

          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void submitScan(manualCode);
            }}
          >
            <input
              className={adminCls.input}
              placeholder="Code ou URL QR (MBH-… / MBP-…)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button
              type="submit"
              className={adminCls.btnPrimary}
              disabled={busy || !manualCode.trim()}
            >
              Valider
            </button>
          </form>

          {last ? (
            <div className="mt-4 rounded-xl border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] p-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--fd-primary)]">
                {last.mode === "in" ? "Entrée OK" : "Sortie OK"}
              </p>
              <p className="mt-1 font-bold text-[color:var(--fd-text)]">
                {last.pass.displayName}
              </p>
              <p className="text-sm text-[color:var(--fd-muted)]">
                {last.pass.subjectType === "partner" ? "Partenaire" : "Participant"} ·{" "}
                {last.pass.orgOrEmail}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-[color:var(--fd-primary)]">
                {last.pass.ticketCode}
              </p>
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                {last.previousStatus} → {last.presenceStatus}
              </p>
            </div>
          ) : null}
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-xl bg-stone-100 p-3">
              <p className="text-2xl font-black">{counts.absent}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Absents
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--fd-mint)] p-3">
              <p className="text-2xl font-black text-[color:var(--fd-primary)]">
                {counts.inside}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--fd-primary)]">
                Dans la salle
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-black text-amber-800">{counts.outside}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Dehors
              </p>
            </div>
          </div>
          <PersonList
            title="Absents"
            people={roster.absent}
            tone="text-stone-500"
          />
          <PersonList
            title="Dans la salle"
            people={roster.inside}
            tone="text-[color:var(--fd-primary)]"
          />
          <PersonList
            title="Dehors (besoin)"
            people={roster.outside}
            tone="text-amber-700"
          />
        </div>
      </div>

      <HackathonPoweredBy />
    </div>
  );
}
