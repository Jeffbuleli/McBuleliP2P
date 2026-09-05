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
/** Audio citizen upload - Whisper optional if OPENAI_API_KEY set. */
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
    // Keep unique exts for disk lookup (Set used in transcribe).
    exts: [".webm", ".mp3", ".wav", ".m4a", ".ogg", ".aac"],
  },
  video: {
    mimes: ["video/mp4", "video/webm", "video/quicktime"],
    exts: [".mp4", ".webm", ".mov"],
  },
};
