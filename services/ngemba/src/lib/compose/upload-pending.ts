/** Upload local audio + photos right after alert creation. */
export async function uploadPendingMedia(opts: {
  sessionId: string;
  audio: Blob | null;
  photos: File[];
}): Promise<void> {
  const files: File[] = [];
  if (opts.audio) {
    const type = (opts.audio.type || "").toLowerCase();
    const name =
      opts.audio instanceof File ? opts.audio.name.toLowerCase() : "";
    let ext = "webm";
    let mime = type || "audio/webm";
    if (type.includes("mpeg") || type === "audio/mp3" || name.endsWith(".mp3")) {
      ext = "mp3";
      mime = "audio/mpeg";
    } else if (type.includes("wav") || name.endsWith(".wav")) {
      ext = "wav";
      mime = "audio/wav";
    } else if (
      type.includes("mp4") ||
      type.includes("m4a") ||
      name.endsWith(".m4a")
    ) {
      ext = "m4a";
      mime = "audio/mp4";
    } else if (type.includes("ogg") || name.endsWith(".ogg")) {
      ext = "ogg";
      mime = "audio/ogg";
    } else if (type.includes("aac") || name.endsWith(".aac")) {
      ext = "aac";
      mime = "audio/aac";
    } else if (type.includes("webm") || name.endsWith(".webm")) {
      ext = "webm";
      mime = "audio/webm";
    }
    files.push(
      new File([opts.audio], `voice-${Date.now()}.${ext}`, {
        type: mime,
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
