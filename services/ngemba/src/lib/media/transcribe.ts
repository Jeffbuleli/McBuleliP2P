import fs from "fs";
import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import type { MediaAttachment } from "@/lib/media/types";
import { mediaFilePath } from "@/lib/media/store";
import { ALLOWED_MEDIA } from "@/lib/media/types";

export async function transcribeAudioIfConfigured(
  sessionId: string,
  attachment: MediaAttachment,
): Promise<string | null> {
  if (attachment.kind !== "audio") return null;
  const key = readEnvKey("OPENAI_API_KEY");
  if (!key) return null;

  let filePath: string | null = null;
  for (const ext of ALLOWED_MEDIA.audio.exts) {
    const p = mediaFilePath(sessionId, attachment.id, ext);
    if (fs.existsSync(p)) {
      filePath = p;
      break;
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
  }
}
