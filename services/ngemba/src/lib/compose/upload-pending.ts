/** Upload local audio + photos after alert creation - awaited before navigate. */

function resolveAudioFile(audio: Blob): File {
  const type = (audio.type || "").toLowerCase();
  const base = type.split(";")[0].trim();
  const name = audio instanceof File ? audio.name.toLowerCase() : "";
  let ext = "webm";
  let mime = base || "audio/webm";

  if (base.includes("mpeg") || base === "audio/mp3" || name.endsWith(".mp3")) {
    ext = "mp3";
    mime = "audio/mpeg";
  } else if (base.includes("wav") || name.endsWith(".wav")) {
    ext = "wav";
    mime = "audio/wav";
  } else if (
    base.includes("mp4") ||
    base.includes("m4a") ||
    base.includes("aac") ||
    name.endsWith(".m4a")
  ) {
    ext = "m4a";
    mime = "audio/mp4";
  } else if (base.includes("ogg") || name.endsWith(".ogg")) {
    ext = "ogg";
    mime = "audio/ogg";
  } else if (base.includes("webm") || name.endsWith(".webm") || !base) {
    ext = "webm";
    mime = "audio/webm";
  }

  return new File([audio], `voice-${Date.now()}.${ext}`, { type: mime });
}

export async function uploadPendingMedia(opts: {
  sessionId: string;
  audio: Blob | null;
  photos: File[];
  /** Per-file timeout ms (default 90s for critical SOS audio). */
  timeoutMs?: number;
}): Promise<{ uploaded: number; failed: number }> {
  const timeoutMs = opts.timeoutMs ?? 90_000;
  const files: File[] = [];
  if (opts.audio && opts.audio.size > 0) {
    const file = resolveAudioFile(opts.audio);
    console.info("[ngemba] AUDIO UPLOAD", {
      name: file.name,
      type: file.type,
      size: file.size,
      sessionId: opts.sessionId,
    });
    files.push(file);
  }
  for (const photo of opts.photos.slice(0, 4)) {
    files.push(photo);
  }

  let uploaded = 0;
  let failed = 0;

  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(`/api/alerts/${opts.sessionId}/media`, {
        method: "POST",
        body: fd,
        credentials: "include",
        signal: controller.signal,
      });
      if (res.ok) {
        uploaded += 1;
      } else {
        failed += 1;
        console.warn("[ngemba] media upload rejected", res.status, file.name);
      }
    } catch (err) {
      failed += 1;
      console.warn("[ngemba] media upload failed", file.name, err);
    } finally {
      clearTimeout(timer);
    }
  }

  return { uploaded, failed };
}
