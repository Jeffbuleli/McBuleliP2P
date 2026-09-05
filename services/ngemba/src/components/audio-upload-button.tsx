"use client";

import { useEffect, useId, useRef, useState } from "react";
import { IconDownload, IconWaveform } from "@/components/icons";
import { AUDIO_MAX_BYTES } from "@/lib/media/types";

const ACCEPT =
  "audio/mpeg,audio/mp4,audio/wav,audio/webm,audio/ogg,audio/aac,audio/x-m4a,.mp3,.m4a,.wav,.webm,.ogg,.aac";

type Props = {
  label: string;
  changeLabel?: string;
  tooLargeLabel: string;
  unsupportedLabel: string;
  onAudioChange: (blob: Blob | null) => void;
  discrete?: boolean;
  className?: string;
};

export function AudioUploadButton({
  label,
  changeLabel = "Changer",
  tooLargeLabel,
  unsupportedLabel,
  onAudioChange,
  discrete = false,
  className = "",
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sizeLabel, setSizeLabel] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clear() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setFileName(null);
    setSizeLabel(null);
    setError(null);
    onAudioChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onPick(file: File | null) {
    setError(null);
    if (!file) {
      clear();
      return;
    }

    const mime = (file.type || "").toLowerCase();
    const okMime =
      !mime ||
      mime.startsWith("audio/") ||
      /\.(mp3|m4a|wav|webm|ogg|aac)$/i.test(file.name);
    if (!okMime) {
      setError(unsupportedLabel);
      clear();
      return;
    }

    if (file.size > AUDIO_MAX_BYTES) {
      setError(tooLargeLabel);
      clear();
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setFileName(file.name);
    const mb = file.size / (1024 * 1024);
    setSizeLabel(mb >= 1 ? `${mb.toFixed(1)} Mo` : `${Math.max(1, Math.round(file.size / 1024))} Ko`);
    onAudioChange(file);
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
          <IconDownload className="size-5 shrink-0" />
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
                discrete ? "text-[#c9a0bc] hover:bg-white/10" : "text-ng-muted hover:bg-ng-primary-muted"
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
            controls
            preload="metadata"
            className="mt-2 w-full"
            src={previewUrl}
          />
        </div>
      )}

      {error ? (
        <p className="text-xs font-medium text-ng-urgent">{error}</p>
      ) : null}
    </div>
  );
}
