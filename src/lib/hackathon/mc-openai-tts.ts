/**
 * McBuleli IA stage voice via OpenAI:
 * - gpt-4o-mini polish for spoken FR (cheap)
 * - tts-1 speech (not tts-1-hd)
 */
import { createHash } from "crypto";
import OpenAI from "openai";
import { assistantOpenAiEnabled } from "@/lib/assistant/openai-client";

const POLISH_SYSTEM = `Tu prépares une ligne pour lecture à voix haute (MC scène, français de Kinshasa).
Règles:
- Garde le sens exact et tous les noms propres (McBuleli, partenaires, personnes).
- Français fluide, calme, phrases naturelles à l'oral.
- Pas de markdown, pas de guillemets décoratifs, une seule variante.
- Maximum 120 mots.`;

type CacheEntry = { audio: Buffer; at: number };

const audioCache = new Map<string, CacheEntry>();
const CACHE_MAX = 40;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error("openai_not_configured");
    client = new OpenAI({ apiKey: key });
  }
  return client;
}

function cacheKey(text: string): string {
  return createHash("sha256").update(text.trim()).digest("hex");
}

function remember(key: string, audio: Buffer) {
  if (audioCache.size >= CACHE_MAX) {
    const oldest = [...audioCache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) audioCache.delete(oldest[0]);
  }
  audioCache.set(key, { audio, at: Date.now() });
}

export function mcOpenAiTtsEnabled(): boolean {
  return assistantOpenAiEnabled();
}

async function polishForSpeech(text: string): Promise<string> {
  const openai = getClient();
  const model =
    process.env.OPENAI_MC_POLISH_MODEL?.trim() || "gpt-4o-mini";
  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: POLISH_SYSTEM },
      { role: "user", content: text.slice(0, 1200) },
    ],
    temperature: 0.35,
    max_tokens: 320,
  });
  const out = res.choices[0]?.message?.content?.trim();
  return out && out.length > 8 ? out : text;
}

export async function synthesizeMcStageAudio(
  rawText: string,
): Promise<{ audio: Buffer; contentType: string }> {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("empty_text");
  if (text.length > 900) throw new Error("text_too_long");

  const key = cacheKey(text);
  const hit = audioCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { audio: hit.audio, contentType: "audio/mpeg" };
  }

  const openai = getClient();
  const spoken = await polishForSpeech(text);
  const voice =
    (process.env.OPENAI_MC_TTS_VOICE?.trim() as
      | "alloy"
      | "echo"
      | "fable"
      | "onyx"
      | "nova"
      | "shimmer"
      | undefined) || "nova";
  const speedRaw = Number(process.env.OPENAI_MC_TTS_SPEED ?? "0.95");
  const speed = Number.isFinite(speedRaw)
    ? Math.min(1.2, Math.max(0.75, speedRaw))
    : 0.95;

  const speech = await openai.audio.speech.create({
    model: process.env.OPENAI_MC_TTS_MODEL?.trim() || "tts-1",
    voice,
    input: spoken.slice(0, 900),
    response_format: "mp3",
    speed,
  });

  const audio = Buffer.from(await speech.arrayBuffer());
  remember(key, audio);
  return { audio, contentType: "audio/mpeg" };
}
