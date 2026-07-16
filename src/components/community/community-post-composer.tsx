"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CommunityImageMosaic } from "@/components/community/community-image-mosaic";
import { CommunityPostTypeChip } from "@/components/community/community-post-type-chip";
import { IconImage, IconVideo } from "@/components/community/community-icons";
import {
  COMPOSER_PICKER_ITEMS,
  type FeedComposerKind,
  feedComposerConfig,
  pickerChipStyle,
} from "@/lib/community/composer-config";
import { fetchJson } from "@/lib/community/fetch-json";
import type { FeedPostView } from "@/lib/community/feed-service";
import {
  uploadCommunityImage,
  uploadCommunityVideoWithProgress,
} from "@/lib/community-media-upload";
import type { CommunityContentKind } from "@/lib/community/post-types";
import {
  UTILITY_TAG_META,
  utilityTagFromContentKind,
  type UtilityTag,
} from "@/lib/community/utility-tags";

type ImageSlot = {
  id: string;
  file: File;
  previewUrl: string;
};

type VideoSlot = {
  file: File;
  previewUrl: string;
  mediaId: string | null;
  progress: number;
  status: "uploading" | "ready" | "error";
};

function mapPublishError(code: string | undefined, fr: boolean): string {
  if (code === "community_post_length") {
    return fr ? "Texte trop court pour cette catégorie." : "Text too short for this category.";
  }
  if (code === "community_post_cooldown") {
    return fr ? "Attendez 30 s entre deux publications" : "Wait 30s between posts";
  }
  if (code === "community_content_blocked") {
    return fr
      ? "Publication refusée - respectez la charte."
      : "Post blocked - follow community guidelines.";
  }
  if (code === "invalid_media") {
    return fr ? "Média invalide" : "Invalid media";
  }
  if (code === "r2_upload_failed" || code === "r2_credentials_invalid") {
    return fr
      ? "Stockage R2 indisponible - vérifiez les clés S3 sur Render."
      : "R2 storage unavailable - check S3 API keys on Render.";
  }
  if (code?.includes("COMMUNITY_R2_SECRET") || code?.includes("API token")) {
    return fr
      ? "Mauvaise clé R2 sur Render (utilisez la clé S3, pas un token Cloudflare)."
      : "Wrong R2 key on Render (use S3 API key, not a Cloudflare API token).";
  }
  return code ?? (fr ? "Échec" : "Failed");
}

export function CommunityPostComposer({
  fr,
  open,
  onClose,
  onPublished,
}: {
  fr: boolean;
  open: boolean;
  onClose: () => void;
  onPublished: (post: FeedPostView) => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"pick" | "compose">("pick");
  const [kind, setKind] = useState<FeedComposerKind | null>(null);
  const [utilityTag, setUtilityTag] = useState<UtilityTag>("create");
  const [body, setBody] = useState("");
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([]);
  const [videoSlot, setVideoSlot] = useState<VideoSlot | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replaceImageId, setReplaceImageId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const cfg = kind ? feedComposerConfig(kind) : null;
  const minChars = cfg?.minChars ?? 20;

  useEffect(() => {
    if (!open) {
      setStep("pick");
      setKind(null);
      setBody("");
      setReplaceImageId(null);
      setImageSlots((slots) => {
        for (const s of slots) URL.revokeObjectURL(s.previewUrl);
        return [];
      });
      setVideoSlot((v) => {
        if (v?.previewUrl) URL.revokeObjectURL(v.previewUrl);
        return null;
      });
      setError(null);
    }
  }, [open]);

  const resetCompose = () => {
    setStep("pick");
    setKind(null);
    setUtilityTag("create");
    setBody("");
    setImageSlots((slots) => {
      for (const s of slots) URL.revokeObjectURL(s.previewUrl);
      return [];
    });
    if (videoSlot?.previewUrl) URL.revokeObjectURL(videoSlot.previewUrl);
    setVideoSlot(null);
    setError(null);
  };

  const pickCategory = (item: (typeof COMPOSER_PICKER_ITEMS)[number]) => {
    if (item.mode === "redirect") {
      router.push(item.href);
      onClose();
      return;
    }
    setKind(item.kind);
    setUtilityTag(utilityTagFromContentKind(item.kind));
    setStep("compose");
    setError(null);
  };

  const addImages = (files: FileList | File[] | null) => {
    if (!files?.length || videoSlot) return;
    const list = Array.from(files);
    const room = 4 - imageSlots.length;
    if (room <= 0) return;

    if (replaceImageId) {
      const file = list[0];
      if (!file) return;
      const rid = replaceImageId;
      setImageSlots((slots) =>
        slots.map((s) => {
          if (s.id !== rid) return s;
          URL.revokeObjectURL(s.previewUrl);
          return {
            id: s.id,
            file,
            previewUrl: URL.createObjectURL(file),
          };
        }),
      );
      setReplaceImageId(null);
      return;
    }

    const next: ImageSlot[] = [];
    for (const file of list.slice(0, room)) {
      next.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    setImageSlots((slots) => [...slots, ...next]);
  };

  const removeImage = (id: string) => {
    setImageSlots((slots) => {
      const target = slots.find((s) => s.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return slots.filter((s) => s.id !== id);
    });
  };

  const replaceImage = (id: string) => {
    setReplaceImageId(id);
    setTimeout(() => imageInputRef.current?.click(), 0);
  };

  const onVideoPick = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setImageSlots((slots) => {
      for (const s of slots) URL.revokeObjectURL(s.previewUrl);
      return [];
    });

    const previewUrl = URL.createObjectURL(file);
    setVideoSlot({
      file,
      previewUrl,
      mediaId: null,
      progress: 0,
      status: "uploading",
    });

    try {
      const uploaded = await uploadCommunityVideoWithProgress(file, "posts", (pct) => {
        setVideoSlot((v) => (v ? { ...v, progress: pct } : v));
      });
      setVideoSlot((v) =>
        v
          ? {
              ...v,
              mediaId: uploaded.id,
              progress: 100,
              status: "ready",
            }
          : v,
      );
    } catch (e) {
      const code = e instanceof Error ? e.message : "upload_failed";
      setVideoSlot((v) => (v ? { ...v, status: "error" } : v));
      setError(
        code === "timeout"
          ? fr
            ? "Délai dépassé - réessayez"
            : "Timed out - try again"
          : fr
            ? "Échec upload vidéo"
            : "Video upload failed",
      );
    }
  };

  const removeVideo = () => {
    if (videoSlot?.previewUrl) URL.revokeObjectURL(videoSlot.previewUrl);
    setVideoSlot(null);
  };

  const publish = async () => {
    if (!kind || !cfg) return;
    if (body.trim().length < minChars) {
      setError(
        fr
          ? `Minimum ${minChars} caractères pour cette catégorie.`
          : `Minimum ${minChars} characters for this category.`,
      );
      return;
    }
    if (videoSlot?.status === "uploading") {
      setError(
        fr ? "Attendez la fin de l'upload vidéo." : "Wait for video upload to finish.",
      );
      return;
    }

    setPublishing(true);
    setError(null);
    try {
      let mediaIds: string[] | undefined;
      let postType: "text" | "image" | "video" = "text";

      if (videoSlot?.mediaId) {
        mediaIds = [videoSlot.mediaId];
        postType = "video";
      } else if (imageSlots.length) {
        const uploaded = await Promise.all(
          imageSlots.map((s) => uploadCommunityImage(s.file, "posts")),
        );
        mediaIds = uploaded.map((u) => u.id);
        postType = "image";
      }

      const { ok, data } = await fetchJson<{
        error?: string;
        post?: FeedPostView;
        bpGranted?: { granted?: boolean; points?: number };
      }>("/api/community/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: body.trim(),
          contentKind: kind,
          utilityTag,
          postType,
          mediaIds,
        }),
      });

      if (!ok || !data.post) {
        setError(mapPublishError(data.error, fr));
        return;
      }

      onPublished(data.post);
      resetCompose();
      onClose();
    } catch {
      setError(fr ? "Échec publication" : "Publish failed");
    } finally {
      setPublishing(false);
    }
  };

  if (!open) return null;

  return (
    <section className="mb-4 rounded-2xl border border-[#f0f4f2] bg-white p-4 shadow-sm">
      {step === "pick" ? (
        <>
          <p className="mb-3 text-sm font-bold text-[#0c0a09]">
            {fr ? "Que souhaitez-vous publier ?" : "What would you like to publish?"}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {COMPOSER_PICKER_ITEMS.map((item) => {
              const style = pickerChipStyle(item.kind as CommunityContentKind);
              return (
                <button
                  key={`${item.mode}-${item.kind}`}
                  type="button"
                  onClick={() => pickCategory(item)}
                  className="rounded-xl border border-[#e8f3ee] px-3 py-3 text-left active:scale-[0.99]"
                  style={{ backgroundColor: style.backgroundColor }}
                >
                  <span
                    className="text-sm font-bold"
                    style={{ color: style.color }}
                  >
                    {fr ? item.labelFr : item.labelEn}
                  </span>
                  <p className="mt-1 text-[11px] text-[#57534e]">
                    {fr ? item.hintFr : item.hintEn}
                  </p>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl border border-[#e8f3ee] py-2 text-sm font-semibold text-[#57534e]"
          >
            {fr ? "Annuler" : "Cancel"}
          </button>
        </>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between gap-2">
            {kind ? <CommunityPostTypeChip kind={kind} fr={fr} /> : null}
            <button
              type="button"
              onClick={resetCompose}
              className="text-xs font-semibold text-[#78716c] hover:text-[#305f33]"
            >
              {fr ? "← Changer catégorie" : "← Change category"}
            </button>
          </div>

          <p className="mb-1.5 text-[11px] font-semibold text-[#78716c]">
            {fr ? "Tag d'utilité" : "Utility tag"}
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5">
            {UTILITY_TAG_META.filter((t) => t.tag !== "signal").map((t) => {
              const selected = utilityTag === t.tag;
              return (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => setUtilityTag(t.tag)}
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                    selected
                      ? "bg-[#305f33] text-white"
                      : "border border-[#e8f3ee] bg-white text-[#57534e]"
                  }`}
                >
                  {fr ? t.labelFr : t.labelEn}
                </button>
              );
            })}
          </div>

          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder={fr ? cfg?.placeholderFr : cfg?.placeholderEn}
            className="w-full resize-none rounded-xl border border-[#e8f3ee] bg-white px-3 py-2 text-sm"
          />
          <p
            className={`mt-1 text-[11px] ${
              body.trim().length >= minChars ? "text-[#78716c]" : "text-amber-700"
            }`}
          >
            {body.trim().length}/{minChars}
          </p>

          {imageSlots.length > 0 ? (
            <div className="mt-3">
              <CommunityImageMosaic
                images={imageSlots.map((s) => ({ id: s.id, src: s.previewUrl }))}
                editable
                onRemove={removeImage}
                onReplace={replaceImage}
              />
            </div>
          ) : null}

          {videoSlot ? (
            <div className="relative mt-3 overflow-hidden rounded-xl bg-[#0c0a09]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <video
                src={videoSlot.previewUrl}
                className="max-h-48 w-full object-cover opacity-90"
                muted
                playsInline
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                {videoSlot.status === "uploading" ? (
                  <>
                    <p className="text-xs font-semibold text-white">
                      {fr ? "Préparation vidéo…" : "Preparing video…"}{" "}
                      {videoSlot.progress}%
                    </p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
                      <div
                        className="h-full rounded-full bg-[#305f33] transition-all"
                        style={{ width: `${videoSlot.progress}%` }}
                      />
                    </div>
                  </>
                ) : videoSlot.status === "ready" ? (
                  <p className="text-xs font-semibold text-emerald-300">
                    {fr ? "Vidéo prête - publiez !" : "Video ready - post now!"}
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-red-300">
                    {fr ? "Échec upload - réessayez" : "Upload failed - retry"}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={removeVideo}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-sm font-bold text-white"
              >
                ×
              </button>
            </div>
          ) : null}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple={!replaceImageId}
            className="hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/webm"
            className="hidden"
            onChange={(e) => {
              void onVideoPick(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!!videoSlot || imageSlots.length >= 4 || publishing}
              onClick={() => {
                setReplaceImageId(null);
                imageInputRef.current?.click();
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8f3ee] active:scale-95 disabled:opacity-40 ${
                imageSlots.length ? "bg-[#e8f3ee] text-[#305f33]" : "bg-white text-[#305f33]"
              }`}
              aria-label={fr ? "Ajouter une image" : "Add image"}
            >
              <IconImage size={20} />
            </button>
            <button
              type="button"
              disabled={!!imageSlots.length || !!videoSlot || publishing}
              onClick={() => videoInputRef.current?.click()}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border border-[#e8f3ee] active:scale-95 disabled:opacity-40 ${
                videoSlot ? "bg-[#e8f3ee] text-[#305f33]" : "bg-white text-[#305f33]"
              }`}
              aria-label={fr ? "Ajouter une vidéo" : "Add video"}
            >
              <IconVideo size={20} />
            </button>
            {imageSlots.length > 0 && imageSlots.length < 4 ? (
              <span className="text-[11px] text-[#78716c]">
                {fr
                  ? `${imageSlots.length}/4 photos`
                  : `${imageSlots.length}/4 photos`}
              </span>
            ) : null}
            <button
              type="button"
              disabled={
                publishing ||
                body.trim().length < minChars ||
                videoSlot?.status === "uploading"
              }
              onClick={() => void publish()}
              className="ml-auto min-h-[44px] rounded-xl bg-[#305f33] px-5 text-sm font-bold text-white disabled:opacity-50 active:scale-95"
            >
              {publishing ? "…" : fr ? "Publier" : "Post"}
            </button>
          </div>

          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </>
      )}
    </section>
  );
}
