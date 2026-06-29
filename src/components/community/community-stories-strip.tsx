"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { CommunityAvatar } from "@/components/community/community-avatar";
import { CommunityMediaImage } from "@/components/community/community-media-image";
import { CommunityVideoPlayer } from "@/components/community/community-video-player";
import { resolveMediaSrc } from "@/lib/media-url";
import { COMMUNITY_STORY_VIDEO_MAX_SEC } from "@/lib/community/config";
import type {
  CommunityStoryRing,
  StoryEngagement,
  StoryEngagementUser,
} from "@/lib/community/story-types";
import { STORY_REACTION_EMOJIS } from "@/lib/community/story-types";
import {
  COMMUNITY_STORY_TEXT_BG,
  normalizeStoryTextBg,
} from "@/lib/community/story-text-colors";
import {
  COMMUNITY_MODAL_PANEL,
  COMMUNITY_STORY_CREATE,
  COMMUNITY_STORY_RING,
  COMMUNITY_STORY_SKELETON,
} from "@/lib/community/community-ui";
import {
  uploadCommunityImage,
  uploadCommunityVideoWithProgress,
} from "@/lib/community-media-upload";

const TEXT_BG = COMMUNITY_STORY_TEXT_BG;

type MediaDraft = {
  file: File;
  previewUrl: string;
  isVideo: boolean;
  mediaId: string | null;
  uploadProgress: number;
  uploadStatus: "idle" | "uploading" | "ready" | "error";
};

async function readVideoDurationSec(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    const url = URL.createObjectURL(file);
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(v.duration);
    };
    v.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("invalid"));
    };
    v.src = url;
  });
}

function mapStoryError(code: string | undefined, fr: boolean): string {
  if (code === "stories_unavailable" || code === "story_server_error") {
    return fr
      ? "Statuts indisponibles - migration base de données requise."
      : "Statuses unavailable - database migration required.";
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
  if (code === "story_video_too_long" || code === "video_too_long") {
    return fr
      ? `Vidéo trop longue (max ${COMMUNITY_STORY_VIDEO_MAX_SEC}s)`
      : `Video too long (max ${COMMUNITY_STORY_VIDEO_MAX_SEC}s)`;
  }
  if (code === "r2_not_configured" || code === "r2_upload_failed" || code === "upload_failed") {
    return fr ? "Upload impossible - stockage R2" : "Upload failed - R2 storage";
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
  const [viewerAvatar, setViewerAvatar] = useState<{
    url: string | null;
    label: string;
  } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(
        (d: {
          user?: {
            avatarUrl?: string | null;
            displayName?: string | null;
            email?: string;
          } | null;
        }) => {
          if (!d.user) return;
          const raw = d.user.avatarUrl ?? null;
          setViewerAvatar({
            url: raw ? resolveMediaSrc(raw) ?? raw : null,
            label: d.user.displayName || d.user.email || "?",
          });
        },
      )
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const openRing = (ringIdx: number) => {
    setViewer({ ringIdx, storyIdx: 0 });
  };

  const scrollStrip = (dir: -1 | 1) => {
    scrollRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  return (
    <>
      {toast ? (
        <div className="fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-full bg-[#305f33] px-4 py-2 text-xs font-bold text-white shadow-lg">
          {toast}
        </div>
      ) : null}

      <div className="relative mb-3">
        {rings.length > 2 ? (
          <>
            <button
              type="button"
              onClick={() => scrollStrip(-1)}
              className="absolute left-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/55 text-white shadow-md"
              aria-label={fr ? "Précédent" : "Previous"}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => scrollStrip(1)}
              className="absolute right-0 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[#229ed9] bg-black/55 text-white shadow-md"
              aria-label={fr ? "Suivant" : "Next"}
            >
              ›
            </button>
          </>
        ) : null}

        <div
          ref={scrollRef}
          className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none"
        >
          <button
            type="button"
            onClick={() => setComposerOpen(true)}
            className={COMMUNITY_STORY_CREATE}
          >
            <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl" aria-hidden>
              {viewerAvatar?.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={viewerAvatar.url}
                  alt=""
                  className="absolute left-1/2 top-[42%] h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full object-cover opacity-[0.18] blur-[0.3px]"
                />
              ) : viewerAvatar ? (
                <span className="absolute left-1/2 top-[42%] flex h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 items-center justify-center opacity-[0.14]">
                  <CommunityAvatar
                    label={viewerAvatar.label}
                    avatarUrl={null}
                    sizeClass="h-full w-full text-4xl"
                    textClass="text-4xl"
                  />
                </span>
              ) : null}
              <span className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(5,8,16,0.15)_0%,rgba(5,8,16,0.78)_72%)]" />
            </span>
            <span className="absolute inset-0 z-[1] flex flex-col items-center justify-center gap-2 text-cyan-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/25 bg-[rgba(10,16,24,0.9)] text-xl font-bold shadow-[0_0_16px_rgba(34,211,238,0.15)]">
                +
              </span>
              <span className="px-2 text-center text-[10px] font-bold leading-tight">
                {fr ? "Créer un statut" : "Create status"}
              </span>
            </span>
          </button>

          {loading ? (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={COMMUNITY_STORY_SKELETON}
                />
              ))}
            </>
          ) : (
            rings.map((ring, idx) => (
              <StoryRingCard
                key={ring.userId}
                ring={ring}
                fr={fr}
                onClick={() => openRing(idx)}
              />
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
              setToast(fr ? `+${bp} BP - statut publié !` : `+${bp} BP - status posted!`);
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

function StoryRingCard({
  ring,
  fr,
  onClick,
}: {
  ring: CommunityStoryRing;
  fr: boolean;
  onClick: () => void;
}) {
  const label = ring.isMe ? (fr ? "Vous" : "You") : ring.displayName || ring.handle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={COMMUNITY_STORY_RING}
    >
      {ring.previewType === "text" ? (
        <div
          className="absolute inset-0 flex items-center justify-center p-2"
          style={{ backgroundColor: ring.previewBg ?? TEXT_BG[0] }}
        >
          <p className="line-clamp-5 text-center text-[10px] font-semibold leading-snug text-white">
            {ring.previewText}
          </p>
        </div>
      ) : ring.previewUrl ? (
        ring.previewType === "video" ? (
          <video
            src={ring.previewUrl}
            className="absolute inset-0 h-full w-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <CommunityMediaImage src={ring.previewUrl} fill objectFit="cover" />
        )
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#305f33] to-[#229ed9]" />
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2 pb-2 pt-10">
        <p className="line-clamp-2 text-left text-[11px] font-bold leading-tight text-white">
          {label}
        </p>
      </div>

      <div
        className={`absolute left-2 top-2 rounded-full p-[2.5px] ${
          ring.hasUnseen ? "bg-[#229ed9]" : "bg-white/40"
        }`}
      >
        <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
          <CommunityAvatar
            label={label}
            avatarUrl={ring.avatarUrl}
            sizeClass="h-8 w-8"
            textClass="text-[10px]"
          />
        </span>
      </div>
    </button>
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
  const [mediaDraft, setMediaDraft] = useState<MediaDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (mediaDraft?.previewUrl) URL.revokeObjectURL(mediaDraft.previewUrl);
    };
  }, [mediaDraft?.previewUrl]);

  const clearMediaDraft = () => {
    setMediaDraft((d) => {
      if (d?.previewUrl) URL.revokeObjectURL(d.previewUrl);
      return null;
    });
    if (fileRef.current) fileRef.current.value = "";
  };

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

  const startVideoUpload = (file: File) => {
    void uploadCommunityVideoWithProgress(file, "stories", (pct) => {
      setMediaDraft((d) =>
        d ? { ...d, uploadProgress: pct, uploadStatus: "uploading" } : d,
      );
    })
      .then((uploaded) => {
        setMediaDraft((d) =>
          d
            ? {
                ...d,
                mediaId: uploaded.id,
                uploadProgress: 100,
                uploadStatus: "ready",
              }
            : d,
        );
      })
      .catch(() => {
        setMediaDraft((d) => (d ? { ...d, uploadStatus: "error" } : d));
        setErr(fr ? "Échec upload vidéo" : "Video upload failed");
      });
  };

  const onMediaPick = async (file: File | null) => {
    if (!file) return;
    setErr(null);

    const isVideo = file.type.startsWith("video/");
    if (isVideo) {
      try {
        const dur = await readVideoDurationSec(file);
        if (!Number.isFinite(dur) || dur > COMMUNITY_STORY_VIDEO_MAX_SEC) {
          setErr(mapStoryError("story_video_too_long", fr));
          return;
        }
      } catch {
        setErr(fr ? "Vidéo invalide" : "Invalid video");
        return;
      }
    }

    const previewUrl = URL.createObjectURL(file);
    const draft: MediaDraft = {
      file,
      previewUrl,
      isVideo,
      mediaId: null,
      uploadProgress: 0,
      uploadStatus: isVideo ? "uploading" : "ready",
    };
    setMediaDraft((prev) => {
      if (prev?.previewUrl) URL.revokeObjectURL(prev.previewUrl);
      return draft;
    });
    if (isVideo) startVideoUpload(file);
  };

  const publishMedia = async () => {
    if (!mediaDraft || busy) return;
    if (mediaDraft.isVideo && mediaDraft.uploadStatus === "uploading") {
      setErr(fr ? "Attendez la fin de l'upload." : "Wait for upload to finish.");
      return;
    }
    if (mediaDraft.isVideo && mediaDraft.uploadStatus === "error") {
      setErr(fr ? "Réessayez l'upload vidéo." : "Retry video upload.");
      return;
    }

    setBusy(true);
    setErr(null);
    try {
      let mediaId = mediaDraft.mediaId;
      if (!mediaDraft.isVideo) {
        const up = await uploadCommunityImage(mediaDraft.file, "stories");
        mediaId = up.id;
      }
      if (!mediaId) {
        setErr(mapStoryError("upload_failed", fr));
        return;
      }

      const res = await fetch("/api/community/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mediaDraft.isVideo ? "video" : "image",
          mediaId,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string; bpGranted?: number };
      if (!res.ok) {
        setErr(mapStoryError(j.error, fr));
        return;
      }
      onPosted(j.bpGranted ?? 0);
    } catch (e) {
      setErr(mapStoryError(e instanceof Error ? e.message : undefined, fr));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className={COMMUNITY_MODAL_PANEL}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-100">
              {fr ? "Nouveau statut (24h)" : "New status (24h)"}
            </h3>
            <p className="text-[10px] text-stone-400">
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
              onClick={() => {
                setMode(m);
                if (m === "text") clearMediaDraft();
              }}
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
        ) : mediaDraft ? (
          <>
            <div className="overflow-hidden rounded-2xl bg-[#0c0a09]">
              {mediaDraft.isVideo ? (
                <CommunityVideoPlayer
                  src={mediaDraft.previewUrl}
                  fr={fr}
                  variant="reels"
                />
              ) : (
                <div className="relative mx-auto aspect-[9/16] max-h-[min(52vh,480px)] w-full max-w-[280px]">
                  <CommunityMediaImage
                    src={mediaDraft.previewUrl}
                    fill
                    objectFit="contain"
                  />
                </div>
              )}
            </div>
            {mediaDraft.isVideo && mediaDraft.uploadStatus === "uploading" ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-[#e7e5e4]">
                  <div
                    className="h-full bg-[#305f33] transition-all"
                    style={{ width: `${mediaDraft.uploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-center text-[10px] text-[#78716c]">
                  {fr ? "Upload…" : "Uploading…"} {mediaDraft.uploadProgress}%
                </p>
              </div>
            ) : null}
            <p className="mt-2 text-center text-[10px] text-[#78716c]">
              {fr
                ? "Vérifiez avant publication - vous pouvez changer le fichier."
                : "Review before posting - you can change the file."}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => fileRef.current?.click()}
                className="flex-1 rounded-xl border border-[#dce8e0] py-2.5 text-xs font-bold text-[#305f33]"
              >
                {fr ? "Changer" : "Change"}
              </button>
              <button
                type="button"
                disabled={
                  busy ||
                  (mediaDraft.isVideo &&
                    (mediaDraft.uploadStatus === "uploading" ||
                      mediaDraft.uploadStatus === "error"))
                }
                onClick={() => void publishMedia()}
                className="flex-1 rounded-xl bg-[#305f33] py-2.5 text-xs font-bold text-white disabled:opacity-50"
              >
                {busy ? "…" : fr ? "Publier" : "Post"}
              </button>
            </div>
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
                void onMediaPick(f ?? null);
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
            <p className="mt-2 text-center text-[10px] text-[#78716c]">
              {fr
                ? `Vidéo max ${COMMUNITY_STORY_VIDEO_MAX_SEC}s - aperçu avant publication`
                : `Video max ${COMMUNITY_STORY_VIDEO_MAX_SEC}s - preview before posting`}
            </p>
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
  const router = useRouter();
  const ring = rings[ringIdx];
  const story = ring?.stories[storyIdx];
  const viewedRef = useRef<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [engagement, setEngagement] = useState<StoryEngagement | null>(null);
  const [reactBusy, setReactBusy] = useState(false);
  const [dmBusy, setDmBusy] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);

  const loadEngagement = useCallback(async (storyId: string) => {
    const res = await fetch(`/api/community/stories/${storyId}/engagement`);
    if (!res.ok) return;
    const j = (await res.json()) as StoryEngagement;
    setEngagement(j);
  }, []);

  useEffect(() => {
    if (!story?.id) return;
    setInsightsOpen(false);
    void loadEngagement(story.id);
  }, [story?.id, loadEngagement]);

  useEffect(() => {
    if (!story?.id || ring.isMe) return;
    if (viewedRef.current.has(story.id)) return;
    viewedRef.current.add(story.id);
    void fetch(`/api/community/stories/${story.id}/view`, { method: "POST" })
      .then((r) => r.json())
      .then((j: { viewerBp?: number; viewCount?: number }) => {
        if (typeof j.viewerBp === "number" && j.viewerBp > 0) onViewBp(j.viewerBp);
        if (typeof j.viewCount === "number") {
          setEngagement((e) =>
            e ? { ...e, viewCount: j.viewCount! } : { viewCount: j.viewCount!, reactions: [], myReaction: null },
          );
        }
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

  const react = async (emoji: string) => {
    if (reactBusy) return;
    setReactBusy(true);
    try {
      const res = await fetch(`/api/community/stories/${story.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) await loadEngagement(story.id);
      setShowEmojiBar(false);
    } finally {
      setReactBusy(false);
    }
  };

  const shareStory = async () => {
    const url = `${window.location.origin}/app/community/u/${encodeURIComponent(ring.handle)}`;
    const text = fr
      ? `Statut de ${ring.displayName || ring.handle} sur McBuleli`
      : `${ring.displayName || ring.handle}'s status on McBuleli`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "McBuleli", text, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* cancelled */
    }
  };

  const messageAuthor = async () => {
    if (dmBusy || ring.isMe) return;
    setDmBusy(true);
    try {
      const res = await fetch("/api/community/dm/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: ring.handle }),
      });
      const j = (await res.json()) as { threadId?: string };
      if (res.ok && j.threadId) {
        const preview =
          story.type === "text"
            ? (story.body ?? "").trim().slice(0, 100)
            : story.type === "image"
              ? fr
                ? "[Photo]"
                : "[Photo]"
              : fr
                ? "[Vidéo]"
                : "[Video]";
        const q = new URLSearchParams({
          draft: fr
            ? `💬 Réaction à votre statut : « ${preview} »`
            : `💬 About your status: "${preview}"`,
          storyId: story.id,
        });
        router.push(`/app/community/inbox/${j.threadId}?${q}`);
        onClose();
      }
    } finally {
      setDmBusy(false);
    }
  };

  const totalReactions =
    engagement?.reactions.reduce((sum, r) => sum + r.count, 0) ?? 0;

  const reactionSummary = engagement?.reactions?.length
    ? engagement.reactions.map((r) => `${r.emoji}${r.count > 1 ? r.count : ""}`).join(" ")
    : null;

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
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white/20">
            <CommunityAvatar
              label={ring.displayName || ring.handle}
              avatarUrl={ring.avatarUrl}
              sizeClass="h-8 w-8"
              textClass="text-xs"
            />
          </span>
          <span className="text-sm font-bold">{ring.displayName || ring.handle}</span>
        </Link>
        <div className="flex items-center gap-2">
          {ring.isMe && engagement ? (
            <button
              type="button"
              onClick={() => setInsightsOpen(true)}
              className="rounded-lg bg-white/15 px-2 py-1 text-[10px] font-semibold text-white/90"
            >
              {engagement.viewCount} {fr ? "vues" : "views"}
              {totalReactions > 0
                ? ` · ${totalReactions} ${fr ? "réactions" : "likes"}`
                : ""}
            </button>
          ) : null}
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
            className="flex max-h-[min(58vh,520px)] w-full max-w-[min(92vw,340px)] items-center justify-center rounded-2xl p-8 text-center text-lg font-semibold text-white"
            style={{ backgroundColor: normalizeStoryTextBg(story.bgColor) }}
          >
            {story.body}
          </div>
        ) : story.mediaUrl ? (
          story.type === "video" ? (
            <div onClick={(e) => e.stopPropagation()}>
              <CommunityVideoPlayer src={story.mediaUrl} fr={fr} variant="reels" />
            </div>
          ) : (
            <div className="relative mx-auto aspect-[9/16] max-h-[min(58vh,520px)] w-full max-w-[min(92vw,340px)] overflow-hidden rounded-2xl bg-black/30">
              <CommunityMediaImage src={story.mediaUrl} fill objectFit="contain" />
            </div>
          )
        ) : null}
      </div>

      <div className="border-t border-white/10 px-4 pb-6 pt-3">
        {reactionSummary ? (
          <p className="mb-2 text-center text-sm">{reactionSummary}</p>
        ) : null}

        {showEmojiBar ? (
          <div className="mb-3 flex justify-center gap-2">
            {STORY_REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                disabled={reactBusy}
                onClick={() => void react(emoji)}
                className={`text-2xl transition active:scale-110 ${
                  engagement?.myReaction === emoji ? "scale-125" : ""
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        ) : null}

        <div className="flex items-center justify-around gap-2">
          <button
            type="button"
            onClick={() => setShowEmojiBar((v) => !v)}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white/90"
          >
            <span className="text-xl">{engagement?.myReaction ?? "❤️"}</span>
            {fr ? "Réagir" : "React"}
          </button>
          <button
            type="button"
            onClick={() => void shareStory()}
            className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white/90"
          >
            <span className="text-xl">↗</span>
            {fr ? "Partager" : "Share"}
          </button>
          {!ring.isMe ? (
            <button
              type="button"
              disabled={dmBusy}
              onClick={() => void messageAuthor()}
              className="flex flex-col items-center gap-0.5 text-[10px] font-semibold text-white/90 disabled:opacity-50"
            >
              <span className="text-xl">💬</span>
              {fr ? "Message" : "Message"}
            </button>
          ) : null}
        </div>
      </div>

      {insightsOpen && ring.isMe && engagement ? (
        <StoryInsightsPanel
          fr={fr}
          engagement={engagement}
          onClose={() => setInsightsOpen(false)}
        />
      ) : null}
    </div>
  );
}

function StoryInsightsPanel({
  fr,
  engagement,
  onClose,
}: {
  fr: boolean;
  engagement: StoryEngagement;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end bg-black/50" onClick={onClose}>
      <div
        className="max-h-[55vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 text-[#0c0a09] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-bold">
            {fr ? "Statistiques du statut" : "Status insights"}
          </h4>
          <button type="button" onClick={onClose} className="text-sm text-[#78716c]">
            ✕
          </button>
        </div>

        <p className="mb-2 text-xs font-bold text-[#57534e]">
          {fr ? "Vues" : "Views"} ({engagement.viewCount})
        </p>
        {engagement.viewers?.length ? (
          <ul className="mb-4 space-y-2">
            {engagement.viewers.map((u) => (
              <li key={u.userId}>
                <StoryInsightUserRow user={u} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mb-4 text-xs text-[#78716c]">
            {fr ? "Personne pour l'instant." : "No viewers yet."}
          </p>
        )}

        <p className="mb-2 text-xs font-bold text-[#57534e]">
          {fr ? "Réactions" : "Reactions"}
        </p>
        {engagement.reactors?.length ? (
          <ul className="space-y-2">
            {engagement.reactors.map((u) => (
              <li key={`${u.userId}-${u.emoji}`} className="flex items-center gap-2">
                <StoryInsightUserRow user={u} />
                <span className="ml-auto text-lg">{u.emoji}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-[#78716c]">
            {fr ? "Aucune réaction." : "No reactions yet."}
          </p>
        )}
      </div>
    </div>
  );
}

function StoryInsightUserRow({
  user,
}: {
  user: StoryEngagementUser;
  fr?: boolean;
}) {
  const label = user.displayName || user.handle;
  return (
    <Link
      href={`/app/community/u/${encodeURIComponent(user.handle)}`}
      className="flex min-w-0 flex-1 items-center gap-2"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf5ee]">
        <CommunityAvatar
          label={label}
          avatarUrl={user.avatarUrl}
          sizeClass="h-8 w-8"
          textClass="text-[10px]"
        />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-bold">{label}</span>
        <span className="block truncate text-[10px] text-[#78716c]">@{user.handle}</span>
      </span>
    </Link>
  );
}
