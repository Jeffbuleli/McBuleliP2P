import {
  assistantModel,
  assistantOpenAiEnabled,
  completeChatJson,
} from "@/lib/assistant/openai-client";
import { moderateDmText } from "@/lib/community/dm-moderation";

export type ModerationResult = {
  allowed: boolean;
  score: number;
  categories: string[];
  reason?: string;
  reviewQueue: boolean;
};

const BLOCK_SCORE = 0.7;
const REVIEW_SCORE = 0.3;

const MODERATION_SYSTEM = `You moderate McBuleli Community: digital finance, crypto, Web3, P2P, mobile money, Africa.
Accept: market analysis, crypto news, questions, respectful debate, McBuleli product discussion.
Reject or flag: scams, NSFW, hate, harassment, off-topic politics, spam, phishing, wallet drainers.
Respond ONLY with JSON: {"score":0.0,"categories":["ok"],"reason":""}
score is 0.0 (safe) to 1.0 (severe). categories: ok, scam, nsfw, hate, spam, off_topic.`;

function parseAiModeration(raw: string): { score: number; categories: string[]; reason?: string } {
  try {
    const parsed = JSON.parse(raw) as {
      score?: number;
      categories?: string[];
      reason?: string;
    };
    const score = Math.min(1, Math.max(0, Number(parsed.score) || 0));
    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.map((c) => String(c).slice(0, 24))
      : ["ok"];
    return { score, categories, reason: parsed.reason?.slice(0, 200) };
  } catch {
    return { score: 0, categories: ["ok"] };
  }
}

async function moderateWithAi(body: string): Promise<{
  score: number;
  categories: string[];
  reason?: string;
}> {
  const raw = await completeChatJson({
    systemPrompt: MODERATION_SYSTEM,
    userMessage: body.slice(0, 2000),
    maxTokens: 200,
    temperature: 0.1,
  });
  return parseAiModeration(raw);
}

/** Rule-based + optional AI moderation for public posts and comments. */
export async function moderateCommunityText(
  body: string,
): Promise<ModerationResult> {
  const rules = moderateDmText(body);
  if (!rules.allowed) {
    return {
      allowed: false,
      score: 1,
      categories: [rules.reason ?? "scam"],
      reason: rules.reason,
      reviewQueue: false,
    };
  }

  if (!assistantOpenAiEnabled()) {
    return { allowed: true, score: 0, categories: [], reviewQueue: false };
  }

  try {
    const ai = await moderateWithAi(body);
    const allowed = ai.score < BLOCK_SCORE;
    const reviewQueue = allowed && ai.score >= REVIEW_SCORE;
    return {
      allowed,
      score: ai.score,
      categories: ai.categories,
      reason: ai.reason,
      reviewQueue,
    };
  } catch {
    return { allowed: true, score: 0, categories: [], reviewQueue: false };
  }
}

export function moderationModel(): string | null {
  return assistantOpenAiEnabled() ? assistantModel() : null;
}
