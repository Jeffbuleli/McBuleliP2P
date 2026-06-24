"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityStoryRing } from "@/lib/community/stories-service";

const TEXT_BG = ["#305f33", "#3d8f5a", "#229ed9", "#7c3aed", "#db2777"] as const;

export function CommunityStoriesStrip({ fr }: { fr: boolean }) {
  const [rings, setRings] = useState<CommunityStoryRing[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewer, setViewer] = useState<{ ringIdx: number; storyIdx: number } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/community/stories", { cache: "no-store" });
      const json = (await res.json().catch(() => ({}))) as { rings?: CommunityStoryRing[] };
      setRings(Array.isArray(json.rings) ? json.rings : []);
    } catch {
      setRings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openRing = (ringIdx: number) => {
    setViewer({ ringIdx, storyIdx: 0 });
  };

  return (
    <>
      <div className="mb-3 -mx-1 overflow-x-auto px-1 scrollbar-none">
        <div className="flex gap-3 pb-1">
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5"
          >
            <span className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full border-2 border-dashed border-[#305f33]/40 bg-[#eaf5ee] text-xl font-bold text-[#305f33]">
              +
            </span>
            <span className="max-w-[4.5rem] truncate text-[10px] font-semibold text-[#57534e]">
              {fr ? "Votre statut" : "Your status"}
            </span>
          </button>

          {loading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5">
                  <span className="h-[3.75rem] w-[3.75rem] animate-pulse rounded-full bg-[#e7e5e4]" />
                  <span className="h-2 w-10 animate-pulse rounded bg-[#e7e5e4]" />
                </div>
              ))}
            </>
          ) : (
            rings.map((ring, idx) => (
              <button
                key={ring.userId}
                type="button"
                onClick={() => openRing(idx)}
                className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="rounded-full bg-gradient-to-tr from-[#3d8f5a] via-[#305f33] to-[#229ed9] p-[2.5px]">
                  <span className="flex h-[3.5rem] w-[3.5rem] items-center justify-center overflow-hidden rounded-full bg-white ring-2 ring-white">
                    {ring.avatarUrl ? (
                      <Image
                        src={ring.avatarUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-sm font-bold text-[#305f33]">
                        {(ring.displayName || ring.handle).slice(0, 1).toUpperCase()}
                      </span>
                    )}
                  </span>
                </span>
                <span className="max-w-[4.5rem] truncate text-[10px] font-semibold text-[#44403c]">
                  {ring.isMe ? (fr ? "Vous" : "You") : ring.displayName || ring.handle}
                </span>
              </button>
            ))
          )}
        </div>
      </div>

      {composerOpen ? (
        <StoryComposer
          fr={fr}
          onClose={() => setComposerOpen(false)}
          onPosted={() => {
            setComposerOpen(false);
            void load();
          }}
        />
      ) : null}

      {viewer && rings[viewer.ringIdx] ? (
        <StoryViewer
          fr={fr}
          rings={rings}
          ringIdx={viewer.ringIdx}
          storyIdx={viewer.storyIdx}
          onClose={() => setViewer(null)}
          onNavigate={(ringIdx, storyIdx) => setViewer({ ringIdx, storyIdx })}
        />
      ) : null}
    </>
  );
}

function StoryComposer({
  fr,
  onClose,
  onPosted,
}: {
  fr: boolean;
  onClose: () => void;
  onPosted: () => void;
}) {
  const [mode, setMode] = useState<"text" | "photo">("text");
  const [body, setBody] = useState("");
  const [bg, setBg] = useState<string>(TEXT_BG[0]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const postText = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/community/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "text", body, bgColor: bg }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "error");
        return;
      }
      onPosted();
    } finally {
      setBusy(false);
    }
  };

  const postPhoto = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "stories");
      const up = await fetch("/api/community/media/upload", { method: "POST", body: form });
      const upJson = (await up.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!up.ok || !upJson.id) {
        setErr(upJson.error ?? "upload_failed");
        return;
      }
      const res = await fetch("/api/community/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", mediaId: upJson.id }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setErr(j.error ?? "error");
        return;
      }
      onPosted();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0c0a09]">
            {fr ? "Nouveau statut (24h)" : "New status (24h)"}
          </h3>
          <button type="button" onClick={onClose} className="text-sm text-[#78716c]">
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(["text", "photo"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === m ? "bg-[#305f33] text-white" : "bg-[#f5f5f4] text-[#57534e]"
              }`}
            >
              {m === "text" ? (fr ? "Texte" : "Text") : fr ? "Photo" : "Photo"}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 280))}
              placeholder={fr ? "Quoi de neuf ?" : "What's new?"}
              rows={4}
              className="w-full resize-none rounded-xl border border-[#dce8e0] p-3 text-sm"
            />
            <div className="mt-2 flex gap-2">
              {TEXT_BG.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  onClick={() => setBg(c)}
                  className={`h-7 w-7 rounded-full ring-2 ${bg === c ? "ring-[#305f33]" : "ring-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <button
              type="button"
              disabled={busy || !body.trim()}
              onClick={() => void postText()}
              className="mt-4 w-full rounded-xl bg-[#305f33] py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {busy ? "…" : fr ? "Publier" : "Post"}
            </button>
          </>
        ) : (
          <>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void postPhoto(f);
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#dce8e0] py-10 text-sm font-semibold text-[#305f33]"
            >
              {busy ? "…" : fr ? "Choisir une photo" : "Choose a photo"}
            </button>
          </>
        )}

        {err ? <p className="mt-2 text-xs text-rose-600">{err}</p> : null}
      </div>
    </div>
  );
}

function StoryViewer({
  fr,
  rings,
  ringIdx,
  storyIdx,
  onClose,
  onNavigate,
}: {
  fr: boolean;
  rings: CommunityStoryRing[];
  ringIdx: number;
  storyIdx: number;
  onClose: () => void;
  onNavigate: (ringIdx: number, storyIdx: number) => void;
}) {
  const ring = rings[ringIdx];
  const story = ring?.stories[storyIdx];
  if (!ring || !story) return null;

  const next = () => {
    if (storyIdx + 1 < ring.stories.length) {
      onNavigate(ringIdx, storyIdx + 1);
    } else if (ringIdx + 1 < rings.length) {
      onNavigate(ringIdx + 1, 0);
    } else {
      onClose();
    }
  };

  const prev = () => {
    if (storyIdx > 0) {
      onNavigate(ringIdx, storyIdx - 1);
    } else if (ringIdx > 0) {
      const prevRing = rings[ringIdx - 1];
      onNavigate(ringIdx - 1, Math.max(0, prevRing.stories.length - 1));
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-black">
      <div className="flex gap-1 px-3 pt-3">
        {ring.stories.map((s, i) => (
          <span
            key={s.id}
            className={`h-0.5 flex-1 rounded-full ${i <= storyIdx ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between px-4 py-2 text-white">
        <Link href={`/app/community/u/${encodeURIComponent(ring.handle)}`} className="flex items-center gap-2">
          <span className="text-sm font-bold">{ring.displayName || ring.handle}</span>
        </Link>
        <button type="button" onClick={onClose} aria-label="Close" className="text-lg">
          ✕
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        <button type="button" className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-hidden />
        <button type="button" className="absolute inset-y-0 right-0 w-1/3" onClick={next} aria-hidden />

        {story.type === "text" ? (
          <div
            className="flex max-h-[70vh] w-full max-w-sm items-center justify-center rounded-2xl p-8 text-center text-lg font-semibold text-white"
            style={{ backgroundColor: story.bgColor ?? TEXT_BG[0] }}
          >
            {story.body}
          </div>
        ) : story.mediaUrl ? (
          story.type === "video" ? (
            <video src={story.mediaUrl} className="max-h-[70vh] max-w-full rounded-xl" controls autoPlay playsInline />
          ) : (
            <Image
              src={story.mediaUrl}
              alt=""
              width={400}
              height={600}
              className="max-h-[70vh] w-auto rounded-xl object-contain"
              unoptimized
            />
          )
        ) : null}
      </div>

      <p className="pb-6 text-center text-[10px] text-white/60">
        {fr ? "Expire dans 24h" : "Expires in 24h"}
      </p>
    </div>
  );
}
