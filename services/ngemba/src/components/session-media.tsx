"use client";

import { useRef, useState } from "react";

export type MediaItem = {
  id: string;
  kind: string;
  fileName: string;
  transcription: string | null;
  publicUrl?: string | null;
};

function mediaHref(sessionId: string, m: MediaItem): string {
  return m.publicUrl || `/api/alerts/${sessionId}/media/${m.id}`;
}

export function SessionMediaUpload({
  sessionId,
  labels,
  onUploaded,
}: {
  sessionId: string;
  labels: {
    addMedia: string;
    mediaHint: string;
    mediaUploading: string;
  };
  onUploaded: (media: MediaItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/alerts/${sessionId}/media`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "upload_failed");
        setBusy(false);
        return;
      }
      onUploaded(data.media ?? []);
    } catch {
      setError("upload_failed");
    }
    setBusy(false);
  }

  return (
    <div className="rounded-2xl border border-[var(--ng-border)] bg-ng-surface p-4">
      <p className="text-sm font-semibold text-ng-primary">{labels.addMedia}</p>
      <p className="mt-1 text-xs text-ng-muted">{labels.mediaHint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,audio/*,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
      />
      <button
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        className="mt-3 min-h-10 w-full rounded-xl border border-[var(--ng-border)] bg-ng-primary-muted px-3 text-sm font-semibold text-ng-primary disabled:opacity-50"
      >
        {busy ? labels.mediaUploading : labels.addMedia}
      </button>
      {error ? (
        <p className="mt-2 text-xs font-medium text-ng-urgent">{error}</p>
      ) : null}
    </div>
  );
}

export function SessionMediaList({
  sessionId,
  items,
  dense = false,
}: {
  sessionId: string;
  items: MediaItem[];
  dense?: boolean;
}) {
  if (!items.length) return null;

  const photos = items.filter((m) => m.kind === "photo");
  const audio = items.filter((m) => m.kind === "audio");
  const other = items.filter((m) => m.kind !== "photo" && m.kind !== "audio");

  return (
    <div className={dense ? "space-y-3" : "space-y-4"}>
      {photos.length ? (
        <ul
          className={`grid gap-2 ${
            photos.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {photos.map((m) => {
            const href = mediaHref(sessionId, m);
            return (
              <li key={m.id} className="overflow-hidden rounded-xl border border-[var(--ng-border)] bg-black/5">
                <a href={href} target="_blank" rel="noopener noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={href}
                    alt={m.fileName}
                    className={`w-full object-cover ${dense ? "max-h-40" : "max-h-56"}`}
                  />
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}

      {audio.length ? (
        <ul className="space-y-2">
          {audio.map((m) => {
            const href = mediaHref(sessionId, m);
            return (
              <li
                key={m.id}
                className="rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-3"
              >
                <p className="mb-2 text-xs font-semibold text-ng-muted">
                  Audio - {m.fileName}
                </p>
                <audio controls preload="metadata" className="w-full" src={href}>
                  <a href={href} target="_blank" rel="noopener noreferrer">
                    Ouvrir l&apos;audio
                  </a>
                </audio>
                {m.transcription ? (
                  <p className="mt-2 text-xs leading-relaxed text-ng-muted">
                    {m.transcription}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}

      {other.length ? (
        <ul className="space-y-2">
          {other.map((m) => {
            const href = mediaHref(sessionId, m);
            return (
              <li
                key={m.id}
                className="rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm"
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-ng-primary underline"
                >
                  {m.kind === "video" ? "Video" : m.kind} - {m.fileName}
                </a>
                {m.kind === "video" ? (
                  <video
                    controls
                    preload="metadata"
                    className="mt-2 max-h-56 w-full rounded-lg"
                    src={href}
                  />
                ) : null}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
