import { desc, eq } from "drizzle-orm";
import { gameAdvisorLogs, getDb } from "@/db";
import {
  assistantModel,
  assistantOpenAiEnabled,
  generateAssistantReply,
} from "@/lib/assistant/openai-client";
import { getPlayerDashboard } from "@/lib/game/player-state";
import { listMarketPrices } from "@/lib/game/market-seeder";

const BULELI_SYSTEM = `You are BULELI AI, the McBuleli Congo Mining Simulator economic advisor.
You help artisanal miners and entrepreneurs in the DRC mining supply chain.
Give practical, culturally grounded advice about mining, transport, market timing, and McB utility token management.
Be concise (max 120 words). Never promise guaranteed profits. Emphasize risk management and reinvestment.
Respond in the same language as the user's question (French or English).`;

function fallbackAdvice(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("cobalt") || q.includes("cobalt")) {
    return "Le cobalt est volatil - diversifiez vers cuivre quand les prix montent. Gardez 20% McB pour le carburant.";
  }
  if (q.includes("transport") || q.includes("moto")) {
    return "Ne surchargez pas la moto. Transportez par petits lots fréquents pour réduire les pertes sur routes boueuses.";
  }
  return "Concentrez-vous d'abord sur l'extraction cobalt/cuivre, vendez aux pics du marché, réinvestissez dans un dépôt avant d'embaucher.";
}

export async function askBuleziAdvisor(args: {
  playerId: string;
  question: string;
}): Promise<{ answer: string; model: string }> {
  const question = args.question.trim().slice(0, 500);
  if (question.length < 3) throw new Error("question_too_short");

  const [dashboard, prices] = await Promise.all([
    getPlayerDashboard(args.playerId),
    listMarketPrices(),
  ]);

  const context = JSON.stringify({
    role: dashboard.player.role,
    mcbBalance: dashboard.player.mcbBalance,
    energy: dashboard.player.energy,
    xp: dashboard.player.xp,
    stocks: dashboard.stocks,
    sites: dashboard.sites.map((s) => ({
      name: s.name,
      mineral: s.mineralKey,
      richness: s.richness,
    })),
    market: prices.map((p) => ({
      mineral: p.mineralKey,
      price: p.currentPriceMcb,
      demand: p.demandIndex,
    })),
  });

  let answer: string;
  const model = assistantOpenAiEnabled() ? assistantModel() : "fallback";

  if (assistantOpenAiEnabled()) {
    answer = await generateAssistantReply({
      systemPrompt: `${BULELI_SYSTEM}\n\nPlayer context:\n${context}`,
      history: [],
      userMessage: question,
    });
  } else {
    answer = fallbackAdvice(question);
  }

  const db = getDb();
  await db.insert(gameAdvisorLogs).values({
    playerId: args.playerId,
    question,
    answer,
    model,
    tokensUsed: 0,
  });

  return { answer, model };
}

export async function listAdvisorHistory(playerId: string, limit = 10) {
  const db = getDb();
  return db
    .select()
    .from(gameAdvisorLogs)
    .where(eq(gameAdvisorLogs.playerId, playerId))
    .orderBy(desc(gameAdvisorLogs.createdAt))
    .limit(limit);
}
