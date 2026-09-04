/** Upload local audio + photos right after alert creation. */
export async function uploadPendingMedia(opts: {
  sessionId: string;
  audio: Blob | null;
  photos: File[];
}): Promise<void> {
  const files: File[] = [];
  if (opts.audio) {
    const ext = opts.audio.type.includes("wav")
      ? "wav"
      : opts.audio.type.includes("mp4")
        ? "m4a"
        : "webm";
    files.push(
      new File([opts.audio], `voice-${Date.now()}.${ext}`, {
        type: opts.audio.type || "audio/webm",
      }),
    );
  }
  for (const photo of opts.photos.slice(0, 4)) {
    files.push(photo);
  }

  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    try {
      await fetch(`/api/alerts/${opts.sessionId}/media`, {
        method: "POST",
        body: fd,
        credentials: "include",
      });
    } catch {
      // Session is already created - media is best-effort.
    }
  }
}
