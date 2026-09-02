import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import {
  ALLOWED_MEDIA,
  MEDIA_MAX_BYTES,
  type MediaAttachment,
  type MediaKind,
} from "@/lib/media/types";

const MEDIA_ROOT = path.join(process.cwd(), "data", "media");

function kindFromMime(mime: string): MediaKind | null {
  for (const [kind, cfg] of Object.entries(ALLOWED_MEDIA) as [
    MediaKind,
    (typeof ALLOWED_MEDIA)[MediaKind],
  ][]) {
    if (cfg.mimes.includes(mime)) return kind;
  }
  return null;
}

function extFromMime(mime: string): string {
  for (const cfg of Object.values(ALLOWED_MEDIA)) {
    const i = cfg.mimes.indexOf(mime);
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
  const mime = params.file.type || "application/octet-stream";
  const kind = kindFromMime(mime);
  if (!kind) {
    throw new Error("unsupported_media_type");
  }
  if (params.file.size > MEDIA_MAX_BYTES) {
    throw new Error("file_too_large");
  }

  const buf = Buffer.from(await params.file.arrayBuffer());
  const mediaId = randomUUID();
  const ext = extFromMime(mime);
  const dir = path.join(MEDIA_ROOT, params.sessionId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(mediaFilePath(params.sessionId, mediaId, ext), buf);

  return {
    id: mediaId,
    kind,
    mimeType: mime,
    fileName: params.file.name.slice(0, 120) || `${kind}${ext}`,
    sizeBytes: buf.length,
    createdAt: new Date().toISOString(),
    transcription: null,
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
