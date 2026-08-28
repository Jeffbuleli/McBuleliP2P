"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { HACKATHON_DATES_LABEL_FR } from "@/lib/hackathon/event-content";

type EditionCtx = {
  id: string;
  nameFr: string;
  dayIndex: 1 | 2;
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

function ModeBtn({
  active,
  onClick,
  children,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  tone: "in" | "out";
}) {
  const activeCls =
    tone === "in"
      ? "bg-emerald-400 text-black shadow-sm"
      : "bg-amber-400 text-black shadow-sm";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-2xl py-4 text-sm font-black transition ${
        active ? activeCls : "bg-white/10 text-white/80 hover:bg-white/15"
      }`}
    >
      {children}
    </button>
  );
}

function CountPill({
  value,
  label,
  tone,
}: {
  value: number;
  label: string;
  tone: "muted" | "in" | "out";
}) {
  const toneCls =
    tone === "in"
      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
      : tone === "out"
        ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
        : "border-white/10 bg-white/[0.04] text-white/70";
  return (
    <div className={`rounded-xl border px-2 py-2 text-center ${toneCls}`}>
      <p className="text-xl font-black tabular-nums">{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>
    </div>
  );
}

export function HackathonScanRemote({
  initialEdition,
}: {
  initialEdition: EditionCtx;
}) {
  const editionId = initialEdition.id;
  const dayIndex = initialEdition.dayIndex;
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
  const [showLists, setShowLists] = useState(false);

  const uid = useId().replace(/:/g, "");
  const regionId = `hackathon-door-reader-${uid}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningLock = useRef(false);
  const scanCtx = useRef({
    editionId,
    mode: "in" as "in" | "out",
    dayIndex,
  });
  const onDecodeRef = useRef<(text: string) => void>(() => {});

  useEffect(() => {
    scanCtx.current = { editionId, mode, dayIndex };
  }, [editionId, mode, dayIndex]);

  const loadRoster = useCallback(async () => {
    const res = await fetch(
      `/api/admin/hackathon/scan?editionId=${encodeURIComponent(editionId)}&dayIndex=${dayIndex}`,
      { cache: "no-store" },
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
    void loadRoster().catch(() => setErr("Impossible de charger le roster."));
    const t = setInterval(() => {
      void loadRoster().catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [loadRoster]);

  const submitScan = useCallback(
    async (code: string) => {
      const ctx = scanCtx.current;
      const trimmed = code.trim();
      if (!ctx.editionId || !trimmed || scanningLock.current) return;
      scanningLock.current = true;
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
            fps: 24,
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
              width: { ideal: 1280 },
              height: { ideal: 720 },
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
              /* frame miss */
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
          console.warn("[hackathon-scan]", e);
          setCamErr("Caméra inaccessible. Saisissez le code manuellement.");
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

  return (
    <div className="mx-auto max-w-lg space-y-3 px-3 py-4 pb-8 sm:max-w-xl sm:px-4">
      <header className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90">
            Télécommande Porte
          </p>
          <p className="truncate text-xs text-white/50">
            {initialEdition.nameFr} · {HACKATHON_DATES_LABEL_FR}
          </p>
        </div>
        <Link
          href="/hackathon/mc"
          className="shrink-0 rounded-xl border border-white/15 px-3 py-2 text-xs font-black text-white/80"
        >
          Live MC
        </Link>
      </header>

      <section className="flex gap-2">
        <ModeBtn active={mode === "in"} onClick={() => setMode("in")} tone="in">
          Entrée
        </ModeBtn>
        <ModeBtn
          active={mode === "out"}
          onClick={() => setMode("out")}
          tone="out"
        >
          Sortie
        </ModeBtn>
      </section>

      <section className="grid grid-cols-3 gap-2">
        <CountPill value={counts.absent} label="Absents" tone="muted" />
        <CountPill value={counts.inside} label="Salle" tone="in" />
        <CountPill value={counts.outside} label="Dehors" tone="out" />
      </section>

      {last ? (
        <div
          className={`rounded-2xl border px-4 py-3 ${
            last.mode === "in"
              ? "border-emerald-400/40 bg-emerald-400/15"
              : "border-amber-400/40 bg-amber-400/15"
          }`}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
            {last.mode === "in" ? "Entrée validée" : "Sortie enregistrée"}
          </p>
          <p className="mt-1 text-lg font-black text-white">
            {last.pass.displayName}
          </p>
          <p className="text-xs text-white/65">
            {last.pass.subjectType === "partner" ? "Partenaire" : "Builder"} ·{" "}
            {last.pass.orgOrEmail}
          </p>
          <p className="mt-1 font-mono text-sm font-bold text-emerald-200">
            {last.pass.ticketCode}
          </p>
        </div>
      ) : null}

      {err ? (
        <p className="rounded-xl bg-rose-500/20 px-3 py-2 text-sm font-semibold text-rose-200">
          {err}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold">Scanner QR</p>
            <p className="text-[11px] text-white/45">
              {camOn
                ? aiLens
                  ? "Détection accélérée"
                  : "Caméra active"
                : "Caméra arrêtée"}
              {busy ? " · scan..." : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCamOn((v) => !v)}
            className={`rounded-xl px-3 py-2 text-xs font-black ${
              camOn
                ? "bg-white/10 text-white/80"
                : "bg-emerald-400 text-black"
            }`}
          >
            {camOn ? "Stop" : "Caméra"}
          </button>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[min(100%,320px)] overflow-hidden rounded-2xl bg-black ring-1 ring-white/10">
          <div
            id={regionId}
            className="absolute inset-0 h-full w-full overflow-hidden [&_video]:!absolute [&_video]:!inset-0 [&_video]:!h-full [&_video]:!w-full [&_video]:!object-cover [&_canvas]:!absolute [&_canvas]:!inset-0 [&_canvas]:!h-full [&_canvas]:!w-full [&_img]:!absolute [&_img]:!inset-0 [&_img]:!h-full [&_img]:!w-full [&_img]:!object-cover [&>div]:!h-full [&>div]:!w-full [&>div]:!overflow-hidden"
          />
          {camOn ? (
            <div className="pointer-events-none absolute inset-0 z-10">
              <div className="absolute inset-[12%] rounded-2xl border-2 border-emerald-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6 text-center text-xs text-white/40">
              Appuyez sur Caméra puis présentez le badge QR.
            </div>
          )}
        </div>

        {camErr ? (
          <p className="mt-2 text-xs text-rose-300">{camErr}</p>
        ) : null}

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void submitScan(manualCode);
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-emerald-400/50 focus:outline-none"
            placeholder="MBH-... ou MBP-..."
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            disabled={busy || !manualCode.trim()}
            className="shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-black text-black disabled:opacity-40"
          >
            OK
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.04]">
        <button
          type="button"
          onClick={() => setShowLists((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-3 text-left text-xs font-bold text-white/70"
        >
          <span>
            Liste · {counts.total} badge{counts.total > 1 ? "s" : ""}
          </span>
          <span>{showLists ? "−" : "+"}</span>
        </button>
        {showLists ? (
          <div className="space-y-2 border-t border-white/10 px-3 pb-3 pt-2">
            {(
              [
                ["Absents", roster.absent, "text-white/50"],
                ["Salle", roster.inside, "text-emerald-300"],
                ["Dehors", roster.outside, "text-amber-200"],
              ] as const
            ).map(([title, people, tone]) => (
              <div key={title}>
                <p className={`text-[10px] font-bold uppercase tracking-wider ${tone}`}>
                  {title} · {people.length}
                </p>
                <ul className="mt-1 max-h-28 space-y-0.5 overflow-y-auto text-xs text-white/75">
                  {people.length === 0 ? (
                    <li className="text-white/35">—</li>
                  ) : (
                    people.map((p) => (
                      <li key={`${p.subjectType}-${p.subjectId}`} className="truncate">
                        <span className="font-semibold text-white">
                          {p.displayName}
                        </span>{" "}
                        <span className="text-white/45">
                          · {p.subjectType === "partner" ? "P" : "B"}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <footer className="flex gap-2 pt-1">
        <Link
          href="/hackathon/mc"
          className="flex flex-1 items-center justify-center rounded-xl border border-white/15 py-3 text-xs font-semibold text-white/70"
        >
          Télécommande Live
        </Link>
        <Link
          href="/hackathon/live"
          target="_blank"
          rel="noreferrer"
          className="flex flex-1 items-center justify-center rounded-xl bg-white py-3 text-xs font-black text-black"
        >
          Projecteur
        </Link>
      </footer>
    </div>
  );
}
