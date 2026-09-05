import fs from "fs";
import os from "os";
import path from "path";
import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import type { MediaAttachment } from "@/lib/media/types";
import { mediaFilePath } from "@/lib/media/store";
import { ALLOWED_MEDIA } from "@/lib/media/types";

function extForAttachment(attachment: MediaAttachment): string {
  const mime = (attachment.mimeType || "").toLowerCase();
  if (mime.includes("mpeg") || mime.includes("mp3")) return ".mp3";
  if (mime.includes("wav")) return ".wav";
  if (mime.includes("mp4") || mime.includes("m4a") || mime.includes("aac"))
    return ".m4a";
  if (mime.includes("ogg")) return ".ogg";
  const fromName = path.extname(attachment.fileName || "");
  if (fromName) return fromName;
  return ".webm";
}

export async function transcribeAudioIfConfigured(
  sessionId: string,
  attachment: MediaAttachment,
): Promise<string | null> {
  if (attachment.kind !== "audio") return null;
  const key = readEnvKey("OPENAI_API_KEY");
  if (!key) return null;

  let filePath: string | null = null;
  let tmpPath: string | null = null;

  for (const ext of [...new Set(ALLOWED_MEDIA.audio.exts)]) {
    const p = mediaFilePath(sessionId, attachment.id, ext);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
    }
  }

  if (!filePath && attachment.publicUrl) {
    try {
      const res = await fetch(attachment.publicUrl);
      if (res.ok) {
        const buf = Buffer.from(await res.arrayBuffer());
        tmpPath = path.join(
          os.tmpdir(),
          `ngemba-whisper-${attachment.id}${extForAttachment(attachment)}`,
        );
        fs.writeFileSync(tmpPath, buf);
        filePath = tmpPath;
      }
    } catch (err) {
      console.warn("[ngemba] whisper fetch remote audio failed", err);
    }
  }

  if (!filePath) return null;

  try {
    const client = new OpenAI({ apiKey: key });
    const res = await client.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: readEnvKey("OPENAI_WHISPER_MODEL") || "whisper-1",
    });
    const text = res.text?.trim();
    return text || null;
  } catch (err) {
    console.warn("[ngemba] whisper failed", err);
    return null;
  } finally {
    if (tmpPath) {
      try {
        fs.unlinkSync(tmpPath);
      } catch {
        // ignore
      }
    }
  }
}
