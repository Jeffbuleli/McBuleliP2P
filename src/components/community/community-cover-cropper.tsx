"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Wide cover frame (~profile banner). */
const COVER_ASPECT = 3;
const COVER_OUTPUT_WIDTH = 1200;

type Props = {
  file: File;
  fr: boolean;
  busy?: boolean;
  /** Frame aspect width/height. Cover=3, avatar=1. */
  aspectRatio?: number;
  outputWidth?: number;
  /** Circular mask for avatar. */
  round?: boolean;
  title?: string;
  subtitle?: string;
  fileSuffix?: string;
  onCancel: () => void;
  onConfirm: (file: File) => void;
};

/**
 * Pan + zoom image adjuster. Crops before upload so tall images
 * are not auto-cut from the middle.
 */
export function CommunityCoverCropper({
  file,
  fr,
  busy,
  aspectRatio = COVER_ASPECT,
  outputWidth,
  round = false,
  title,
  subtitle,
  fileSuffix = "cover",
  onCancel,
  onConfirm,
}: Props) {
  const outW =
    outputWidth ??
    (aspectRatio === 1 ? 400 : COVER_OUTPUT_WIDTH);
  const outH = Math.round(outW / aspectRatio);
  const frameRef = useRef<HTMLDivElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [frameSize, setFrameSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    active: boolean;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  }>({ active: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    setNatural({ w: 0, h: 0 });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () =>
      setFrameSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [src]);

  const layout = useCallback(() => {
    const { w: fw, h: fh } = frameSize;
    const { w: nw, h: nh } = natural;
    if (!fw || !fh || !nw || !nh) {
      return { dw: 0, dh: 0, left: 0, top: 0, scale: 1 };
    }
    const scale = Math.max(fw / nw, fh / nh) * zoom;
    const dw = nw * scale;
    const dh = nh * scale;
    const maxX = Math.max(0, (dw - fw) / 2);
    const maxY = Math.max(0, (dh - fh) / 2);
    const x = Math.max(-maxX, Math.min(maxX, offset.x));
    const y = Math.max(-maxY, Math.min(maxY, offset.y));
    return {
      dw,
      dh,
      left: (fw - dw) / 2 + x,
      top: (fh - dh) / 2 + y,
      scale,
      x,
      y,
      maxX,
      maxY,
    };
  }, [frameSize, natural, offset.x, offset.y, zoom]);

  const L = layout();

  useEffect(() => {
    if (!L.maxX && !L.maxY) return;
    if (L.x !== offset.x || L.y !== offset.y) {
      setOffset({ x: L.x ?? 0, y: L.y ?? 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- clamp when zoom/frame changes
  }, [zoom, frameSize.w, frameSize.h, natural.w, natural.h]);

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: offset.x,
      origY: offset.y,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const { w: fw, h: fh } = frameSize;
    const { w: nw, h: nh } = natural;
    if (!fw || !nw) return;
    const scale = Math.max(fw / nw, fh / nh) * zoom;
    const dw = nw * scale;
    const dh = nh * scale;
    const maxX = Math.max(0, (dw - fw) / 2);
    const maxY = Math.max(0, (dh - fh) / 2);
    setOffset({
      x: Math.max(-maxX, Math.min(maxX, drag.current.origX + dx)),
      y: Math.max(-maxY, Math.min(maxY, drag.current.origY + dy)),
    });
  };

  const onPointerUp = () => {
    drag.current.active = false;
  };

  const exportCrop = () => {
    if (!src || !natural.w || !frameSize.w) return;
    const { left, top, scale } = layout();
    const fw = frameSize.w;
    const fh = frameSize.h;
    const sx = -left / scale;
    const sy = -top / scale;
    const sw = fw / scale;
    const sh = fh / scale;

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(0, 0, outW, outH);
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const name = file.name.replace(/\.\w+$/, "") || fileSuffix;
          onConfirm(
            new File([blob], `${name}-${fileSuffix}.jpg`, {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        0.9,
      );
    };
    img.src = src;
  };

  const ready = natural.w > 0 && frameSize.w > 0;
  const frameAspectClass =
    aspectRatio === 1 ? "aspect-square max-w-[280px] mx-auto" : "aspect-[3/1]";

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onCancel}
        disabled={busy}
      />
      <div className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white p-4 shadow-xl sm:rounded-3xl">
        <p className="text-sm font-bold text-[#0c0a09]">
          {title ?? (fr ? "Ajuster la couverture" : "Adjust cover")}
        </p>
        <p className="mt-0.5 text-[11px] text-[#78716c]">
          {subtitle ??
            (fr
              ? "Glisse pour choisir la zone visible"
              : "Drag to choose the visible area")}
        </p>

        <div
          ref={frameRef}
          className={`relative mt-3 w-full cursor-grab touch-none overflow-hidden bg-[#1c1917] active:cursor-grabbing ${frameAspectClass} ${
            round ? "rounded-full" : "rounded-xl"
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={src}
              alt=""
              draggable={false}
              className="pointer-events-none absolute max-w-none select-none"
              style={{
                left: L.left,
                top: L.top,
                width: L.dw || undefined,
                height: L.dh || undefined,
              }}
              onLoad={(e) => {
                setNatural({
                  w: e.currentTarget.naturalWidth,
                  h: e.currentTarget.naturalHeight,
                });
              }}
            />
          ) : null}
          <div
            className={`pointer-events-none absolute inset-0 ring-2 ring-inset ring-white/35 ${
              round ? "rounded-full" : ""
            }`}
          />
        </div>

        <label className="mt-3 flex items-center gap-3">
          <span className="text-[10px] font-bold uppercase text-[#a8a29e]">
            Zoom
          </span>
          <input
            type="range"
            min={1}
            max={2.5}
            step={0.05}
            value={zoom}
            disabled={!ready || busy}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[#305f33]"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-[44px] flex-1 rounded-xl border border-[#e8f3ee] text-sm font-bold text-[#57534e]"
          >
            {fr ? "Annuler" : "Cancel"}
          </button>
          <button
            type="button"
            disabled={!ready || busy}
            onClick={exportCrop}
            className="min-h-[44px] flex-[2] rounded-xl bg-[#305f33] text-sm font-bold text-white disabled:opacity-40"
          >
            {busy ? "…" : fr ? "Enregistrer" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
