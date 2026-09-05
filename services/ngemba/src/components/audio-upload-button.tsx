"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconUpload, IconWaveform } from "@/components/icons";
import { AUDIO_MAX_BYTES } from "@/lib/media/types";

const ACCEPT = "audio/*,.mp3,.wav,.m4a,.ogg,.webm,.aac";

function mimeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".aac")) return "audio/aac";
  return null;
}

function normalizeAudioFile(file: File): File {
  const fromName = mimeFromName(file.name);
  const mime = (file.type || "").toLowerCase();
  const resolved =
    mime === "audio/mp3" || mime === "audio/mpeg"
      ? "audio/mpeg"
      : mime === "audio/wave" || mime === "audio/x-wav"
        ? "audio/wav"
        : mime.startsWith("audio/")
          ? mime
          : fromName || "audio/mpeg";
  if (file.type === resolved) return file;
  return new File([file], file.name, {
    type: resolved,
    lastModified: file.lastModified,
  });
}

type Props = {
  label: string;
  changeLabel?: string;
  tooLargeLabel: string;
  unsupportedLabel: string;
  onAudioChange: (blob: Blob | null) => void;
  discrete?: boolean;
  className?: string;
  /** Parent clears this side when the other audio source is used. */
  resetToken?: number;
};

export function AudioUploadButton({
  label,
  changeLabel = "Changer",
  tooLargeLabel,
  unsupportedLabel,
  onAudioChange,
  discrete = false,
  className = "",
  resetToken = 0,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const urlRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizeLabel, setSizeLabel] = useState<string | null>(null);

  function revokeUrl() {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  }

  useEffect(() => {
    return () => revokeUrl();
  }, []);

  useEffect(() => {
    if (resetToken === 0) return;
    revokeUrl();
    setPreviewUrl(null);
    setFileName(null);
    setSizeLabel(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }, [resetToken]);

  function clear() {
    revokeUrl();
    setPreviewUrl(null);
    setFileName(null);
    setSizeLabel(null);
    setError(null);
    onAudioChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(raw: File | null) {
    setError(null);
    if (!raw) {
      clear();
      return;
    }

    const mime = (raw.type || "").toLowerCase();
    const okMime =
      !mime ||
      mime.startsWith("audio/") ||
      Boolean(mimeFromName(raw.name));
    if (!okMime) {
      setError(unsupportedLabel);
      clear();
      return;
    }

    if (raw.size > AUDIO_MAX_BYTES) {
      setError(tooLargeLabel);
      clear();
      return;
    }

    const file = normalizeAudioFile(raw);
    revokeUrl();
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setPreviewUrl(url);
    setFileName(file.name);
    const mb = file.size / (1024 * 1024);
    setSizeLabel(
      mb >= 1
        ? `${mb.toFixed(1)} Mo`
        : `${Math.max(1, Math.round(file.size / 1024))} Ko`,
    );
    onAudioChange(file);

    // Force metadata load after DOM paints (helps large mp3 / Safari).
    requestAnimationFrame(() => {
      const el = audioRef.current;
      if (!el) return;
      el.load();
    });
  }

  const btnClass = discrete
    ? "border-white/15 bg-white/5 text-[#e8d4e3] hover:bg-white/10"
    : "border-[var(--ng-border)] bg-ng-surface text-ng-primary hover:bg-ng-primary-muted/60";

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />

      {!previewUrl ? (
        <label
          htmlFor={inputId}
          className={`inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition ${btnClass}`}
        >
          <IconUpload className="size-5 shrink-0" />
          <span>{label}</span>
        </label>
      ) : (
        <div
          className={`rounded-2xl border px-3 py-3 ${
            discrete
              ? "border-white/15 bg-white/5"
              : "border-[var(--ng-border)] bg-ng-surface"
          }`}
        >
          <div className="flex items-center gap-2">
            <IconWaveform
              className={`size-8 shrink-0 ${discrete ? "text-[#c9a0bc]" : "text-ng-primary"}`}
            />
            <div className="min-w-0 flex-1">
              <p
                className={`truncate text-xs font-semibold ${
                  discrete ? "text-[#e8d4e3]" : "text-ng-text"
                }`}
              >
                {fileName}
              </p>
              {sizeLabel ? (
                <p
                  className={`text-[11px] ${
                    discrete ? "text-[#c9a0bc]" : "text-ng-muted"
                  }`}
                >
                  {sizeLabel} - max 10 Mo
                </p>
              ) : null}
            </div>
            <label
              htmlFor={inputId}
              className={`cursor-pointer text-[11px] font-semibold underline ${
                discrete ? "text-[#e8d4e3]" : "text-ng-primary"
              }`}
            >
              {changeLabel}
            </label>
            <button
              type="button"
              onClick={clear}
              className={`inline-flex size-8 items-center justify-center rounded-lg ${
                discrete
                  ? "text-[#c9a0bc] hover:bg-white/10"
                  : "text-ng-muted hover:bg-ng-primary-muted"
              }`}
              aria-label="Retirer"
            >
              <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
          <audio
            key={previewUrl}
            ref={audioRef}
            controls
            preload="auto"
            playsInline
            className="mt-2 w-full"
            src={previewUrl}
            onError={() =>
              setError("Lecture audio impossible - reessayez un autre fichier")
            }
          />
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-ng-urgent">{error}</p>
      ) : null}
    </div>
  );
}
