"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CommunityStoryRing } from "@/lib/community/stories-service";
import {
  COMMUNITY_STORY_TEXT_BG,
  normalizeStoryTextBg,
} from "@/lib/community/story-text-colors";

const TEXT_BG = COMMUNITY_STORY_TEXT_BG;

function mapStoryError(code: string | undefined, fr: boolean): string {
  if (code === "stories_unavailable" || code === "story_server_error") {
    return fr
      ? "Statuts indisponibles — migration base de données requise."
      : "Statuses unavailable — database migration required.";
  }
  if (code === "story_limit_reached") {
    return fr ? "Limite : 8 statuts / 24 h" : "Limit: 8 statuses / 24h";
  }
  if (code === "body_required") {
    return fr ? "Écrivez un message" : "Write a message";
  }
  if (code === "invalid_media" || code === "media_required") {
    return fr ? "Média invalide" : "Invalid media";
  }
  if (code === "community_media_invalid_mime") {
    return fr ? "Format non supporté (JPEG, PNG, WebP, MP4)" : "Unsupported format (JPEG, PNG, WebP, MP4)";
  }
  if (code === "r2_not_configured" || code === "r2_upload_failed" || code === "upload_failed") {
    return fr ? "Upload impossible — stockage R2" : "Upload failed — R2 storage";
  }
  if (code === "Unauthorized") {
    return fr ? "Connectez-vous pour publier" : "Sign in to publish";
  }
  return fr ? "Échec de publication" : "Publish failed";
}

export function CommunityStoriesStrip({ fr }: { fr: boolean }) {
  const [rings, setRings] = useState<CommunityStoryRing[]>([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [viewer, setViewer] = useState<{ ringIdx: number; storyIdx: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const openRing = (ringIdx: number) => {
    setViewer({ ringIdx, storyIdx: 0 });
  };

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

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
          onPosted={(bp) => {
            setComposerOpen(false);
            if (bp > 0) {
              setToast(fr ? `+${bp} BP — statut publié !` : `+${bp} BP — status posted!`);
            }
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
          onDeleted={() => {
            setViewer(null);
            void load();
          }}
          onViewBp={(bp) => {
            if (bp > 0) setToast(fr ? `+${bp} BP` : `+${bp} BP`);
          }}
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
  onPosted: (bpGranted: number) => void;
}) {
  const [mode, setMode] = useState<"text" | "media">("text");
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
      const j = (await res.json().catch(() => ({}))) as { error?: string; bpGranted?: number };
      if (!res.ok) {
        setErr(mapStoryError(j.error, fr));
        return;
      }
      onPosted(j.bpGranted ?? 0);
    } finally {
      setBusy(false);
    }
  };

  const postMedia = async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const isVideo = file.type.startsWith("video/");
      const form = new FormData();
      form.set("file", file);
      form.set("kind", "stories");
      const up = await fetch("/api/community/media/upload", { method: "POST", body: form });
      const upJson = (await up.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!up.ok || !upJson.id) {
        setErr(mapStoryError(upJson.error, fr));
        return;
      }
      const res = await fetch("/api/community/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: isVideo ? "video" : "image",
          mediaId: upJson.id,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; bpGranted?: number };
      if (!res.ok) {
        setErr(mapStoryError(j.error, fr));
        return;
      }
      onPosted(j.bpGranted ?? 0);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#0c0a09]">
              {fr ? "Nouveau statut (24h)" : "New status (24h)"}
            </h3>
            <p className="text-[10px] text-[#78716c]">
              {fr ? "Gagnez des BP en publiant" : "Earn BP by posting"}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-sm text-[#78716c]">
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          {(["text", "media"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                mode === m ? "bg-[#305f33] text-white" : "bg-[#f5f5f4] text-[#57534e]"
              }`}
            >
              {m === "text" ? (fr ? "Texte" : "Text") : fr ? "Photo / Vidéo" : "Photo / Video"}
            </button>
          ))}
        </div>

        {mode === "text" ? (
          <>
            <div
              className="flex min-h-[160px] items-center justify-center rounded-2xl p-4 shadow-inner"
              style={{ backgroundColor: bg }}
            >
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 280))}
                placeholder={fr ? "Quoi de neuf ?" : "What's new?"}
                rows={4}
                className="w-full resize-none bg-transparent text-center text-lg font-semibold text-white placeholder:text-white/60 focus:outline-none"
              />
            </div>
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
              accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void postMedia(f);
              }}
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-[#dce8e0] py-10 text-sm font-semibold text-[#305f33]"
            >
              {busy ? "…" : fr ? "Choisir photo ou vidéo" : "Choose photo or video"}
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
  onDeleted,
  onViewBp,
}: {
  fr: boolean;
  rings: CommunityStoryRing[];
  ringIdx: number;
  storyIdx: number;
  onClose: () => void;
  onNavigate: (ringIdx: number, storyIdx: number) => void;
  onDeleted: () => void;
  onViewBp: (bp: number) => void;
}) {
  const ring = rings[ringIdx];
  const story = ring?.stories[storyIdx];
  const viewedRef = useRef<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!story?.id || ring.isMe) return;
    if (viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    void fetch(`/api/community/stories/${story.id}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((j: { viewerBp?: number }) => {
        if (typeof j.viewerBp === "number" && j.viewerBp > 0) onViewBp(j.viewerBp);
      })
      .catch(() => {});
  }, [story?.id, ring?.isMe, onViewBp]);

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

  const deleteStory = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/stories/${story.id}`, { method: "DELETE" });
      if (res.ok) onDeleted();
    } finally {
      setDeleting(false);
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
        <div className="flex items-center gap-2">
          {ring.isMe ? (
            <button
              type="button"
              disabled={deleting}
              onClick={() => void deleteStory()}
              className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-bold uppercase"
            >
              {deleting ? "…" : fr ? "Supprimer" : "Delete"}
            </button>
          ) : null}
          <button type="button" onClick={onClose} aria-label="Close" className="text-lg">
            ✕
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4">
        <button type="button" className="absolute inset-y-0 left-0 w-1/3" onClick={prev} aria-hidden />
        <button type="button" className="absolute inset-y-0 right-0 w-1/3" onClick={next} aria-hidden />

        {story.type === "text" ? (
          <div
            className="flex max-h-[70vh] w-full max-w-sm items-center justify-center rounded-2xl p-8 text-center text-lg font-semibold text-white"
            style={{ backgroundColor: normalizeStoryTextBg(story.bgColor) }}
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
        {fr ? "Expire dans 24h · +BP si quelqu'un regarde" : "Expires in 24h · +BP when viewed"}
      </p>
    </div>
  );
}
