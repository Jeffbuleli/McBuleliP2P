import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  ngembaMediaKey,
  ngembaPublicUrl,
  putNgembaObject,
} from "@/lib/media/r2";
import {
  ALLOWED_MEDIA,
  AUDIO_MAX_BYTES,
  MEDIA_MAX_BYTES,
  type MediaAttachment,
  type MediaKind,
} from "@/lib/media/types";

const MEDIA_ROOT = path.join(process.cwd(), "data", "media");

/** Strip "audio/webm;codecs=opus" → "audio/webm". */
export function normalizeMime(raw: string): string {
  const base = (raw || "").split(";")[0].trim().toLowerCase();
  if (base === "audio/mp3") return "audio/mpeg";
  if (base === "audio/x-wav" || base === "audio/wave") return "audio/wav";
  if (base === "audio/m4a" || base === "audio/x-m4a") return "audio/mp4";
  return base;
}

function kindFromMime(mime: string): MediaKind | null {
  const normalized = normalizeMime(mime);
  for (const [kind, cfg] of Object.entries(ALLOWED_MEDIA) as [
    MediaKind,
    (typeof ALLOWED_MEDIA)[MediaKind],
  ][]) {
    if (cfg.mimes.includes(normalized)) return kind;
  }
  return null;
}

function mimeFromFileName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".webm")) return "audio/webm";
  if (lower.endsWith(".ogg")) return "audio/ogg";
  if (lower.endsWith(".aac")) return "audio/aac";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp4")) return "video/mp4";
  if (lower.endsWith(".mov")) return "video/quicktime";
  return null;
}

function extFromMime(mime: string): string {
  const normalized = normalizeMime(mime);
  if (normalized.startsWith("image/jpeg")) return ".jpg";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "audio/mpeg" || normalized === "audio/mp3") return ".mp3";
  if (normalized === "audio/wav") return ".wav";
  if (
    normalized === "audio/mp4" ||
    normalized === "audio/m4a" ||
    normalized === "audio/aac" ||
    normalized === "audio/x-m4a"
  )
    return ".m4a";
  if (normalized === "audio/ogg") return ".ogg";
  if (normalized === "audio/webm") return ".webm";
  if (normalized === "video/mp4") return ".mp4";
  if (normalized === "video/webm") return ".webm";
  if (normalized === "video/quicktime") return ".mov";
  if (normalized.startsWith("audio/")) return ".webm";
  return ".bin";
}

export function mediaFilePath(sessionId: string, mediaId: string, ext: string) {
  return path.join(MEDIA_ROOT, sessionId, `${mediaId}${ext}`);
}

export async function saveMedia(params: {
  sessionId: string;
  file: File;
}): Promise<MediaAttachment> {
  const rawMime = params.file.type || "";
  const mime =
    normalizeMime(rawMime) ||
    mimeFromFileName(params.file.name) ||
    "application/octet-stream";
  const kind = kindFromMime(mime);
  if (!kind) {
    console.warn("[ngemba] unsupported_media_type", {
      rawMime,
      mime,
      name: params.file.name,
      size: params.file.size,
    });
    throw new Error("unsupported_media_type");
  }
  if (params.file.size > MEDIA_MAX_BYTES) {
    throw new Error("file_too_large");
  }
  if (kind === "audio" && params.file.size > AUDIO_MAX_BYTES) {
    throw new Error("file_too_large");
  }

  const buf = Buffer.from(await params.file.arrayBuffer());
  const mediaId = randomUUID();
  const ext = extFromMime(mime);
  const storageKey = ngembaMediaKey(params.sessionId, mediaId, ext);

  // Always keep a local copy (Whisper + ops fallback), even when R2 succeeds.
  const dir = path.join(MEDIA_ROOT, params.sessionId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(mediaFilePath(params.sessionId, mediaId, ext), buf);

  const publicUrl = await putNgembaObject({
    objectKey: storageKey,
    body: new Uint8Array(buf),
    mimeType: mime,
  });

  return {
    id: mediaId,
    kind,
    mimeType: mime,
    fileName: params.file.name.slice(0, 120) || `${kind}${ext}`,
    sizeBytes: buf.length,
    createdAt: new Date().toISOString(),
    transcription: null,
    storageKey: publicUrl ? storageKey : null,
    publicUrl,
  };
}

export function readMediaFile(
  sessionId: string,
  attachment: MediaAttachment,
): Buffer | null {
  for (const ext of ALLOWED_MEDIA[attachment.kind].exts) {
    const p = mediaFilePath(sessionId, attachment.id, ext);
    if (fs.existsSync(p)) return fs.readFileSync(p);
  }
  const fallback = mediaFilePath(
    sessionId,
    attachment.id,
    extFromMime(attachment.mimeType),
  );
  if (fs.existsSync(fallback)) return fs.readFileSync(fallback);
  return null;
}

export function mediaPublicUrl(attachment: MediaAttachment): string | null {
  if (attachment.publicUrl) return attachment.publicUrl;
  if (attachment.storageKey) return ngembaPublicUrl(attachment.storageKey);
  return null;
}
