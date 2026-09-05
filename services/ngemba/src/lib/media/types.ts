export type MediaKind = "photo" | "audio" | "video";

export type MediaAttachment = {
  id: string;
  kind: MediaKind;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
  createdAt: string;
  transcription: string | null;
  storageKey?: string | null;
  publicUrl?: string | null;
};

export const MEDIA_MAX_BYTES = 10 * 1024 * 1024;
/** Audio citizen upload (SOS) - humains ecoutent, pas de Whisper. */
export const AUDIO_MAX_BYTES = 10 * 1024 * 1024;
/** Total attachments per session (photos + audio + video). */
export const MEDIA_MAX_PER_SESSION = 5;
/** Citizen compose: max photos before / after send. */
export const MEDIA_MAX_PHOTOS = 4;

export const ALLOWED_MEDIA: Record<
  MediaKind,
  { mimes: string[]; exts: string[] }
> = {
  photo: {
    mimes: ["image/jpeg", "image/png", "image/webp"],
    exts: [".jpg", ".jpeg", ".png", ".webp"],
  },
  audio: {
    mimes: [
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/x-wav",
      "audio/wave",
      "audio/mp4",
      "audio/ogg",
      "audio/aac",
      "audio/x-m4a",
      "audio/m4a",
    ],
    exts: [
      ".webm",
      ".mp3",
      ".mp3",
      ".wav",
      ".wav",
      ".wav",
      ".m4a",
      ".ogg",
      ".aac",
      ".m4a",
      ".m4a",
    ],
  },
  video: {
    mimes: ["video/mp4", "video/webm", "video/quicktime"],
    exts: [".mp4", ".webm", ".mov"],
  },
};
