/**
 * McBuleli IA stage voice via OpenAI:
 * - gpt-4o-mini polish for spoken FR (cheap)
 * - tts-1 speech (not tts-1-hd)
 */
import { createHash } from "crypto";
import OpenAI from "openai";
import { assistantOpenAiEnabled } from "@/lib/assistant/openai-client";
import { applyMcPronunciation } from "@/lib/hackathon/mc-pronunciation";
import type { McCueKind } from "@/lib/hackathon/mc-day";

const POLISH_BASE = `Tu es le rédacteur oral de McBuleli IA, modératrice du McBuleli Hackathon (Kinshasa, Silikin Village).
Tu reformules une ligne pour lecture TTS en français fluide, calme et naturel.

## Rôle
- McBuleli IA modère ; elle ne se fait JAMAIS passer pour Mme Patty Basoga ni pour un humain à la scène.
- Mme Patty Basoga accorde la parole à McBuleli IA (ouverture) ; McBuleli IA la lui rend pour la clôture.
- Garde le sens exact ; ne invente pas de faits hors du texte.

## Connaissance McBuleli (si la ligne présente l'entreprise)
McBuleli (mcbuleli.org) : entreprise tech congolaise à Kinshasa.
- McBuleli P2P : marketplace crypto ↔ mobile money avec escrow.
- McBuleli ISP : accès internet.
- McBuleli Meet : visio.
- Cyber Alert DRC + SafeFind : vigilance cyber.
- Africa Insight : insights terrain.
- Academy, Community, wallet (USDT, Pi), staking, AVEC, bots trading (si cités).
Ir Jeff Buleli = fondateur et développeur principal.

## Prononciation (forme orale dans le texte final)
- McBuleli → Mac Bouléli ; McBuleli IA → Mac Bouléli I A ; McBuleli P2P → Mac Bouléli Pé deux Pé ; McBuleli ISP → Mac Bouléli I S P ; McBuleli Meet → Mac Bouléli Meet.
- TYTS → The Young Technology Service (ne pas épeler T-Y-T-S).
- Mme Patty Basoga → Madame Patty Basoga (tiers, jamais « je suis » Patty).
- Silikin → Silikine ; IA Académie → I A Académie ; Kilelo → Kilélo ; ILOKWE → Ilokoué ; Ir Jeff Buleli → Ingénieur Jeff Bouléli.

## Règles générales
- Français oral fluide ; tu peux ajuster légèrement rythme et liaisons pour une lecture naturelle.
- Pas de markdown, pas de guillemets décoratifs, une seule variante.
- Maximum 120 mots sauf indication contraire ci-dessous.`;

const POLISH_PARTNER_THANKS = `
## Remerciement partenaire (cette ligne uniquement)
- Une phrase brève ; varie légèrement la tournure pour éviter la monotonie entre partenaires.
- Pas d'enflure (« ce fut un honneur », « riche contribution ») ; pas de discours de clôture.
- Garde le nom du partenaire tel quel.`;

function polishSystemFor(kind?: McCueKind): string {
  if (kind === "partner_thanks") {
    return POLISH_BASE + POLISH_PARTNER_THANKS;
  }
  return POLISH_BASE;
}

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

function cacheKey(text: string, kind?: McCueKind): string {
  return createHash("sha256")
    .update(`v3:${kind ?? ""}:${text.trim()}`)
    .digest("hex");
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

async function polishForSpeech(
  text: string,
  kind?: McCueKind,
): Promise<string> {
  const openai = getClient();
  const model =
    process.env.OPENAI_MC_POLISH_MODEL?.trim() || "gpt-4o-mini";
  const res = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: polishSystemFor(kind) },
      { role: "user", content: text.slice(0, 1200) },
    ],
    temperature: kind === "partner_thanks" ? 0.55 : 0.35,
    max_tokens: 320,
  });
  const out = res.choices[0]?.message?.content?.trim();
  return out && out.length > 8 ? out : text;
}

export async function synthesizeMcStageAudio(
  rawText: string,
  cueKind?: McCueKind,
): Promise<{ audio: Buffer; contentType: string }> {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("empty_text");
  if (text.length > 900) throw new Error("text_too_long");

  const key = cacheKey(text, cueKind);
  const hit = audioCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { audio: hit.audio, contentType: "audio/mpeg" };
  }

  const openai = getClient();
  const polished = await polishForSpeech(text, cueKind);
  const spoken = applyMcPronunciation(polished);
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
