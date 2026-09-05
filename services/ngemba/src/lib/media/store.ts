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

function kindFromMime(mime: string): MediaKind | null {
  const normalized =
    mime === "audio/mp3"
      ? "audio/mpeg"
      : mime === "audio/x-wav" || mime === "audio/wave"
        ? "audio/wav"
        : mime === "audio/m4a"
          ? "audio/mp4"
          : mime;
  for (const [kind, cfg] of Object.entries(ALLOWED_MEDIA) as [
    MediaKind,
    (typeof ALLOWED_MEDIA)[MediaKind],
  ][]) {
    if (cfg.mimes.includes(normalized) || cfg.mimes.includes(mime)) return kind;
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
  const normalized =
    mime === "audio/mp3" ? "audio/mpeg" : mime === "audio/x-wav" ? "audio/wav" : mime;
  for (const cfg of Object.values(ALLOWED_MEDIA)) {
    const i = cfg.mimes.indexOf(normalized);
    if (i >= 0) return cfg.exts[i] ?? ".bin";
  }
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
    (rawMime === "audio/mp3" ? "audio/mpeg" : rawMime) ||
    mimeFromFileName(params.file.name) ||
    "application/octet-stream";
  const kind = kindFromMime(mime);
  if (!kind) {
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
  let publicUrl = await putNgembaObject({
    objectKey: storageKey,
    body: new Uint8Array(buf),
    mimeType: mime,
  });

  if (!publicUrl) {
    const dir = path.join(MEDIA_ROOT, params.sessionId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(mediaFilePath(params.sessionId, mediaId, ext), buf);
    publicUrl = null;
  }

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
