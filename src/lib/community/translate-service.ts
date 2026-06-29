import { createHash } from "crypto";
import { and, eq } from "drizzle-orm";
import { communityTranslationCache, getDb } from "@/db";
import {
  assistantModel,
  assistantOpenAiEnabled,
  completeChatJson,
} from "@/lib/assistant/openai-client";
import { detectTextLocale, type TextLocale } from "@/lib/community/text-locale";

export type TranslateLocale = "en" | "fr";

const DAILY_LIMIT = 20;
const dailyBuckets = new Map<string, { count: number; resetAt: number }>();

function contentHash(text: string, target: TranslateLocale): string {
  return createHash("sha256").update(`${target}:${text}`).digest("hex");
}

export function checkTranslateRateLimit(userId: string): boolean {
  const now = Date.now();
  const dayMs = 86_400_000;
  const bucket = dailyBuckets.get(userId);
  if (!bucket || now > bucket.resetAt) {
    dailyBuckets.set(userId, { count: 1, resetAt: now + dayMs });
    return true;
  }
  if (bucket.count >= DAILY_LIMIT) return false;
  bucket.count += 1;
  return true;
}

async function readCache(
  hash: string,
  target: TranslateLocale,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ translatedText: communityTranslationCache.translatedText })
    .from(communityTranslationCache)
    .where(
      and(
        eq(communityTranslationCache.contentHash, hash),
        eq(communityTranslationCache.targetLocale, target),
      ),
    )
    .limit(1);
  return row?.translatedText ?? null;
}

async function writeCache(args: {
  hash: string;
  sourceLocale: TextLocale;
  targetLocale: TranslateLocale;
  translatedText: string;
}): Promise<void> {
  const db = getDb();
  await db
    .insert(communityTranslationCache)
    .values({
      contentHash: args.hash,
      sourceLocale: args.sourceLocale === "unknown" ? null : args.sourceLocale,
      targetLocale: args.targetLocale,
      translatedText: args.translatedText,
    })
    .onConflictDoNothing();
}

function targetLanguageName(locale: TranslateLocale): string {
  return locale === "fr" ? "French" : "English";
}

async function translateWithOpenAi(
  text: string,
  target: TranslateLocale,
): Promise<string> {
  const targetName = targetLanguageName(target);
  const raw = await completeChatJson({
    systemPrompt: `You translate social posts for McBuleli Community (crypto, P2P, Africa).
Translate into ${targetName}. Keep @mentions, #hashtags, URLs, numbers, and emojis unchanged.
Return JSON: {"translatedText":"..."}`,
    userMessage: text.slice(0, 4000),
    maxTokens: 1200,
    temperature: 0.2,
  });

  const parsed = JSON.parse(raw) as { translatedText?: string };
  const out = parsed.translatedText?.trim();
  if (!out) throw new Error("empty_translation");
  return out;
}

function fallbackTranslate(text: string, target: TranslateLocale): string {
  if (target === "en") {
    return `${text}\n\n[Translation unavailable - configure OPENAI_API_KEY on the server.]`;
  }
  return `${text}\n\n[Traduction indisponible - configurez OPENAI_API_KEY sur le serveur.]`;
}

export async function translateCommunityText(args: {
  text: string;
  targetLocale: TranslateLocale;
}): Promise<{
  translatedText: string;
  sourceLocale: TextLocale;
  targetLocale: TranslateLocale;
  cached: boolean;
  model: string | null;
}> {
  const text = args.text.trim();
  if (text.length < 2 || text.length > 4000) {
    throw new Error("invalid_text_length");
  }

  const sourceLocale = detectTextLocale(text);
  const hash = contentHash(text, args.targetLocale);
  const cached = await readCache(hash, args.targetLocale);
  if (cached) {
    return {
      translatedText: cached,
      sourceLocale,
      targetLocale: args.targetLocale,
      cached: true,
      model: null,
    };
  }

  let translatedText: string;
  if (assistantOpenAiEnabled()) {
    translatedText = await translateWithOpenAi(text, args.targetLocale);
  } else {
    translatedText = fallbackTranslate(text, args.targetLocale);
  }

  await writeCache({
    hash,
    sourceLocale,
    targetLocale: args.targetLocale,
    translatedText,
  });

  return {
    translatedText,
    sourceLocale,
    targetLocale: args.targetLocale,
    cached: false,
    model: assistantOpenAiEnabled() ? assistantModel() : null,
  };
}
