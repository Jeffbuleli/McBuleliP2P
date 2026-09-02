"use client";

import { useRef, useState } from "react";

type MediaItem = {
  id: string;
  kind: string;
  fileName: string;
  transcription: string | null;
};

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
        accept="image/*,audio/*,video/mp4,video/webm"
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
}: {
  sessionId: string;
  items: MediaItem[];
}) {
  if (!items.length) return null;
  return (
    <ul className="space-y-2">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-[var(--ng-border)] bg-ng-surface px-3 py-2 text-sm"
        >
          <a
            href={`/api/alerts/${sessionId}/media/${m.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-ng-primary underline"
          >
            {m.kind === "photo" ? "Photo" : m.kind === "audio" ? "Audio" : "Vidéo"}
            {" — "}
            {m.fileName}
          </a>
          {m.transcription ? (
            <p className="mt-1 text-xs text-ng-muted">{m.transcription}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
