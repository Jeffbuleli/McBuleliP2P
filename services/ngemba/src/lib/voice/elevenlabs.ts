import { readEnvKey } from "@/lib/env";

const STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const TTS_MODEL = "eleven_multilingual_v2";
/** Charlotte, voix calme multilingue. Remplaçable par ELEVENLABS_VOICE_ID. */
const DEFAULT_VOICE = "XB0fDUnXU5powFXDhCwa";

export function elevenLabsKey(): string | null {
  return readEnvKey("ELEVEN_LABS") || readEnvKey("ELEVENLABS_API_KEY");
}

function voiceId(): string {
  return readEnvKey("ELEVENLABS_VOICE_ID") || DEFAULT_VOICE;
}

export async function transcribeWithEleven(
  audio: Buffer,
  mimeType: string,
  fileName = "audio.webm",
): Promise<string | null> {
  const key = elevenLabsKey();
  if (!key || audio.length < 200) return null;

  const form = new FormData();
  form.append(
    "file",
    new Blob([new Uint8Array(audio)], { type: mimeType || "audio/webm" }),
    fileName,
  );
  form.append("model_id", readEnvKey("ELEVENLABS_STT_MODEL") || "scribe_v1");

  try {
    const res = await fetch(STT_URL, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
    });
    if (!res.ok) {
      console.warn("[ngemba] elevenlabs stt", res.status);
      return null;
    }
    const data = (await res.json()) as { text?: string };
    const text = data.text?.trim();
    return text || null;
  } catch (err) {
    console.warn("[ngemba] elevenlabs stt failed", err);
    return null;
  }
}

/** Réponse parlée, mp3. Texte court : une réponse de chat, pas un discours. */
export async function synthesizeSpeech(text: string): Promise<Buffer | null> {
  const key = elevenLabsKey();
  const spoken = text.replace(/\s+/g, " ").trim().slice(0, 700);
  if (!key || spoken.length < 2) return null;

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId()}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: spoken,
          model_id: TTS_MODEL,
          voice_settings: {
            stability: 0.55,
            similarity_boost: 0.75,
            style: 0.15,
          },
        }),
      },
    );
    if (!res.ok) {
      console.warn("[ngemba] elevenlabs tts", res.status);
      return null;
    }
    return Buffer.from(await res.arrayBuffer());
  } catch (err) {
    console.warn("[ngemba] elevenlabs tts failed", err);
    return null;
  }
}
