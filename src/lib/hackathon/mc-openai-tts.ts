/**
 * McBuleli IA stage voice via OpenAI:
 * - gpt-4o-mini polish for spoken FR (cheap)
 * - tts-1 speech (not tts-1-hd)
 */
import { createHash } from "crypto";
import OpenAI from "openai";
import { assistantOpenAiEnabled } from "@/lib/assistant/openai-client";
import { applyMcPronunciation } from "@/lib/hackathon/mc-pronunciation";

const POLISH_SYSTEM = `Tu es le rédacteur oral de McBuleli IA, MC du McBuleli Hackathon (Kinshasa, Silikin Village).
Tu reformules une ligne pour lecture TTS en français fluide, calme, naturel.

## Connaissance McBuleli (utilise si la ligne présente l'entreprise ou ses produits)
McBuleli (mcbuleli.org) est une entreprise tech congolaise à Kinshasa.
Services / réalisations à garder exacts si mentionnés :
- McBuleli P2P : marketplace crypto ↔ mobile money avec escrow (sécurité des échanges).
- McBuleli ISP : accès internet / connectivité.
- McBuleli Meet : visio (ex. partenaires à distance).
- Cyber Alert DRC + SafeFind : vigilance cyber / alertes.
- Africa Insight : lecture du terrain / insights.
- Academy & Community : formation et communauté.
- Wallet (USDT, Pi), staking, AVEC / tontines, bots trading (si cités).
Vision : innovation numérique au service des gens. Mission : plateformes sûres et accessibles (finance, connectivité, confiance digitale).
Hackathon : builders à Silikin Village ; Ir Jeff Buleli = fondateur et développeur principal.

## Prononciation / noms (écris la forme orale dans le texte final)
- McBuleli → « Mac Bouléli » ; McBuleli IA → « Mac Bouléli I A » ; McBuleli P2P → « Mac Bouléli Pé deux Pé » ; McBuleli ISP → « Mac Bouléli I S P » ; McBuleli Meet → « Mac Bouléli Meet ».
- TYTS → toujours « The Young Technology Service » (ne pas épeler T-Y-T-S). Domaine : tech / cyber & réseaux ; présentateur Aaron Nsomone.
- Mme Patty Basoga / Patty B. → « Madame Patty Basoga » (hôtesse ouverture & clôture McBuleli).
- Autres : Silikin → Silikine ; IA Académie → I A Académie ; Kilelo → Kilélo ; ILOKWE → Ilokoué ; Ir Jeff Buleli → Ingénieur Jeff Bouléli.

## Remerciements partenaires (anti-monotonie)
Si la ligne est un remerciement après intervention partenaire :
- Une seule phrase courte (max ~12 mots). Pas d'amplification (« Un grand merci… », « ce fut un honneur… », « pour cette riche contribution… »).
- Ne pas ajouter d'applaudissements ni de transition « on enchaîne » si absents du texte source.
- Ne pas reformuler en discours de clôture.

## Règles générales
- Garde le sens exact ; ne invente pas de faits hors du texte + connaissance ci-dessus.
- Pas de markdown, pas de guillemets décoratifs, une seule variante.
- Maximum 110 mots (sauf remerciement : beaucoup plus court).`;

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
  return createHash("sha256").update(`v2:${text.trim()}`).digest("hex");
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
    temperature: 0.3,
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
  const polished = await polishForSpeech(text);
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
