"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
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

type BarcodeDetectorLike = {
  detect: (source: ImageBitmapSource) => Promise<Array<{ rawValue?: string }>>;
};

function getNativeQrDetector(): BarcodeDetectorLike | null {
  const BD = (
    globalThis as unknown as {
      BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
    }
  ).BarcodeDetector;
  if (!BD) return null;
  try {
    return new BD({ formats: ["qr_code"] });
  } catch {
    return null;
  }
}

export function HackathonScanClient() {
  const [editions, setEditions] = useState<Edition[]>([]);
  const [editionId, setEditionId] = useState("");
  const [dayIndex, setDayIndex] = useState<1 | 2>(1);
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
  const [aiLens, setAiLens] = useState(false);

  const uid = useId().replace(/:/g, "");
  const regionId = `hackathon-door-reader-${uid}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningLock = useRef(false);
  const lastDecoded = useRef("");
  const scanCtx = useRef({
    editionId: "",
    mode: "in" as "in" | "out",
    dayIndex: 1 as 1 | 2,
  });
  const onDecodeRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    scanCtx.current = { editionId, mode, dayIndex };
  }, [editionId, mode, dayIndex]);

  const loadRoster = useCallback(async () => {
    if (!editionId) return;
    const res = await fetch(
      `/api/admin/hackathon/scan?editionId=${encodeURIComponent(editionId)}&dayIndex=${dayIndex}`,
    );
    if (!res.ok) throw new Error("roster_failed");
    const json = (await res.json()) as {
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
      const ctx = scanCtx.current;
      const trimmed = code.trim();
      if (!ctx.editionId || !trimmed || scanningLock.current) return;
      scanningLock.current = true;
      lastDecoded.current = trimmed;
      setBusy(true);
      setErr(null);
      try {
        const res = await fetch("/api/admin/hackathon/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            code: trimmed,
            mode: ctx.mode,
            dayIndex: ctx.dayIndex,
            editionId: ctx.editionId,
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
        await loadRoster().catch(() => {});
      } catch {
        setErr("Erreur réseau lors du scan.");
      } finally {
        setBusy(false);
        window.setTimeout(() => {
          scanningLock.current = false;
        }, 900);
      }
    },
    [loadRoster],
  );

  useEffect(() => {
    onDecodeRef.current = (text: string) => {
      void submitScan(text);
    };
  }, [submitScan]);

  /** Dual path: html5-qrcode + native BarcodeDetector AI lens. */
  useEffect(() => {
    if (!camOn) return;
    let cancelled = false;
    let aiTimer: number | null = null;
    setCamErr(null);
    setAiLens(false);

    const start = async () => {
      const el = document.getElementById(regionId);
      if (!el) return;
      el.innerHTML = "";
      const scanner = new Html5Qrcode(regionId, {
        verbose: false,
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
        experimentalFeatures: { useBarCodeDetectorIfSupported: true },
      });
      scannerRef.current = scanner;
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras.length) throw new Error("no_camera");
        const back =
          cameras.find((c) => /back|rear|environment|arrière/i.test(c.label)) ??
          cameras[cameras.length - 1];

        await scanner.start(
          back.id,
          {
            fps: 30,
            qrbox: (viewW, viewH) => {
              const side = Math.max(
                200,
                Math.floor(Math.min(viewW, viewH) * 0.82),
              );
              return { width: side, height: side };
            },
            aspectRatio: 1,
            disableFlip: false,
            videoConstraints: {
              facingMode: "environment",
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
          },
          (text) => {
            if (cancelled) return;
            onDecodeRef.current(text);
          },
          () => {},
        );

        const detector = getNativeQrDetector();
        if (detector) {
          setAiLens(true);
          const tick = async () => {
            if (cancelled) return;
            try {
              const video = el.querySelector("video");
              if (video && video.readyState >= 2) {
                const hits = await detector.detect(video);
                const value = hits[0]?.rawValue?.trim();
                if (value) onDecodeRef.current(value);
              }
            } catch {
              /* frame miss - keep looping */
            }
            if (!cancelled) {
              aiTimer = window.setTimeout(() => {
                void tick();
              }, 90);
            }
          };
          void tick();
        }
      } catch (e) {
        if (!cancelled) {
          console.warn("[hackathon-scan] camera", e);
          setCamErr(
            "Caméra inaccessible. Autorisez l'accès navigateur ou saisissez le code.",
          );
          setCamOn(false);
          setAiLens(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      if (aiTimer != null) window.clearTimeout(aiTimer);
      setAiLens(false);
      const s = scannerRef.current;
      scannerRef.current = null;
      if (s) {
        void s
          .stop()
          .then(() => s.clear())
          .catch(() => {});
      }
    };
  }, [camOn, regionId]);

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
      <div className="min-w-0 rounded-xl border border-[color:var(--fd-border)] bg-white p-3">
        <p className={`text-xs font-extrabold uppercase tracking-wider ${tone}`}>
          {title} - {people.length}
        </p>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
          {people.length === 0 ? (
            <li className="text-[color:var(--fd-muted)]">-</li>
          ) : (
            people.map((p) => (
              <li
                key={`${p.subjectType}-${p.subjectId}`}
                className="truncate"
                title={`${p.displayName} - ${p.orgOrEmail}`}
              >
                <span className="font-semibold text-[color:var(--fd-text)]">
                  {p.displayName}
                </span>
                <span className="text-[color:var(--fd-muted)]">
                  {" "}
                  - {p.subjectType === "partner" ? "P" : "B"} - {p.orgOrEmail}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  return (
    <div className={`${adminCls.page} max-w-full overflow-x-hidden`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={adminCls.h1}>Scanner porte</h2>
          <p className={adminCls.muted}>
            Entrée / sortie - badges - lentille IA QR
          </p>
        </div>
        <Link href="/admin/hackathon" className={adminCls.btnSecondary}>
          ← Admin
        </Link>
      </div>

      {err ? <p className={`${adminCls.error} break-words`}>{err}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="min-w-0 text-sm">
          <span className="mb-1 block font-semibold">Édition</span>
          <select
            className={`${adminCls.input} w-full max-w-full`}
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
        <label className="min-w-0 text-sm">
          <span className="mb-1 block font-semibold">Jour</span>
          <select
            className={`${adminCls.input} w-full max-w-full`}
            value={dayIndex}
            onChange={(e) => setDayIndex(Number(e.target.value) as 1 | 2)}
          >
            <option value={1}>Jour 1 · 13 Août</option>
            <option value={2}>Jour 2 · 14 Août</option>
          </select>
        </label>
        <div className="min-w-0 text-sm sm:col-span-2">
          <span className="mb-1 block font-semibold">Mode scan</span>
          <div className="flex flex-wrap gap-2">
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

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-[color:var(--fd-border)] bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold">Lentille QR</p>
              <p className="text-[11px] text-[color:var(--fd-muted)]">
                {aiLens
                  ? "IA BarcodeDetector active - détection accélérée"
                  : camOn
                    ? "Scan haute fréquence (30 fps)"
                    : "Caméra arrêtée"}
              </p>
            </div>
            <button
              type="button"
              className={camOn ? adminCls.btnSecondary : adminCls.btnPrimary}
              onClick={() => setCamOn((v) => !v)}
            >
              {camOn ? "Arrêter" : "Démarrer caméra"}
            </button>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[min(100%,340px)] overflow-hidden rounded-2xl bg-stone-950 ring-1 ring-black/10">
            <div
              id={regionId}
              className="absolute inset-0 h-full w-full overflow-hidden [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!absolute [&_canvas]:!inset-0 [&_canvas]:!h-full [&_canvas]:!w-full [&_img]:!absolute [&_img]:!inset-0 [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover [&>div]:!h-full [&>div]:!w-full [&>div]:!overflow-hidden"
            />

            {camOn ? (
              <div className="pointer-events-none absolute inset-0 z-10">
                <div className="absolute inset-[12%] rounded-2xl border-2 border-[color:var(--fd-primary)]/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
                <div className="absolute left-[12%] top-[12%] h-7 w-7 rounded-tl-xl border-l-[3px] border-t-[3px] border-emerald-300" />
                <div className="absolute right-[12%] top-[12%] h-7 w-7 rounded-tr-xl border-r-[3px] border-t-[3px] border-emerald-300" />
                <div className="absolute bottom-[12%] left-[12%] h-7 w-7 rounded-bl-xl border-b-[3px] border-l-[3px] border-emerald-300" />
                <div className="absolute bottom-[12%] right-[12%] h-7 w-7 rounded-br-xl border-b-[3px] border-r-[3px] border-emerald-300" />
                <div className="absolute inset-x-[14%] top-1/2 h-px -translate-y-1/2 overflow-hidden">
                  <div className="h-full w-full animate-pulse bg-gradient-to-r from-transparent via-emerald-300/90 to-transparent" />
                </div>
                {aiLens ? (
                  <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white">
                    AI lens
                  </span>
                ) : null}
              </div>
            ) : (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-4 text-center text-xs text-stone-400">
                Démarrez la caméra puis alignez le QR dans la lentille.
              </div>
            )}
          </div>

          {camErr ? (
            <p className="mt-2 break-words text-sm text-rose-700">{camErr}</p>
          ) : (
            <p className="mt-2 text-xs text-[color:var(--fd-muted)]">
              Mode : <strong>{mode === "in" ? "Entrée" : "Sortie"}</strong> - Jour{" "}
              {dayIndex}
              {busy ? " - scan..." : ""}
            </p>
          )}

          <form
            className="mt-4 flex min-w-0 flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              void submitScan(manualCode);
            }}
          >
            <input
              className={`${adminCls.input} min-w-0 flex-1`}
              placeholder="Code ou URL (MBH-... / MBP-...)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button
              type="submit"
              className={`${adminCls.btnPrimary} shrink-0`}
              disabled={busy || !manualCode.trim()}
            >
              Valider
            </button>
          </form>

          {last ? (
            <div className="mt-4 break-words rounded-xl border border-[color:var(--fd-primary)]/30 bg-[color:var(--fd-mint)] p-3">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[color:var(--fd-primary)]">
                {last.mode === "in" ? "Entrée OK" : "Sortie OK"}
              </p>
              <p className="mt-1 font-bold text-[color:var(--fd-text)]">
                {last.pass.displayName}
              </p>
              <p className="text-sm text-[color:var(--fd-muted)]">
                {last.pass.subjectType === "partner" ? "Partenaire" : "Participant"} -{" "}
                {last.pass.orgOrEmail}
              </p>
              <p className="mt-1 font-mono text-sm font-bold text-[color:var(--fd-primary)]">
                {last.pass.ticketCode}
              </p>
              <p className="mt-1 text-xs text-[color:var(--fd-muted)]">
                {last.previousStatus} - {last.presenceStatus}
              </p>
            </div>
          ) : null}
        </div>

        <div className="min-w-0 space-y-3">
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
                Salle
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-2xl font-black text-amber-800">{counts.outside}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                Dehors
              </p>
            </div>
          </div>
          <PersonList title="Absents" people={roster.absent} tone="text-stone-500" />
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
