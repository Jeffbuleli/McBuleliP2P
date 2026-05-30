import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  getDb,
  aiAssistantConversations,
  aiAssistantMessages,
  aiAssistantKnowledge,
} from "@/db";
import type { AssistantLocale } from "@/lib/assistant/messages";
import {
  classifyUserIntent,
  mergeIntents,
  recommendServices,
  shouldUseSimplifiedMode,
} from "@/lib/assistant/intent";
import {
  formatKnowledgeForPrompt,
  searchAssistantKnowledge,
} from "@/lib/assistant/knowledge-search";
import {
  generateAssistantReply,
  streamAssistantReply,
} from "@/lib/assistant/openai-client";
import { buildAssistantSystemPrompt } from "@/lib/assistant/system-prompt";
import { assertAssistantDbReady } from "@/lib/assistant/db-ready";

export type AssistantMessageDto = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export type AssistantConversationDto = {
  id: string;
  locale: AssistantLocale;
  pageContext: string | null;
  detectedIntents: string[];
  simplifiedMode: boolean;
};

export type PreparedAssistantTurn = {
  locale: AssistantLocale;
  trimmed: string;
  systemPrompt: string;
  chatHistory: { role: "user" | "assistant"; content: string }[];
  mergedIntents: string[];
  simplified: boolean;
  hits: Awaited<ReturnType<typeof searchAssistantKnowledge>>;
  recommendations: { label: string; href: string; reason: string }[];
  pageContext: string | null;
  convRow: typeof aiAssistantConversations.$inferSelect;
};

const RATE_LIMIT_PER_HOUR = 40;

export async function getOrCreateConversation(args: {
  conversationId?: string | null;
  userId?: string | null;
  guestToken?: string | null;
  locale: AssistantLocale;
  pageContext?: string | null;
}): Promise<AssistantConversationDto> {
  await assertAssistantDbReady();
  const db = getDb();

  if (args.conversationId) {
    const [existing] = await db
      .select()
      .from(aiAssistantConversations)
      .where(eq(aiAssistantConversations.id, args.conversationId))
      .limit(1);
    if (existing) {
      if (args.userId && existing.userId && existing.userId !== args.userId) {
        throw new Error("assistant_forbidden");
      }
      if (
        args.guestToken &&
        existing.guestToken &&
        existing.guestToken !== args.guestToken
      ) {
        throw new Error("assistant_forbidden");
      }
      return mapConversation(existing);
    }
  }

  const [created] = await db
    .insert(aiAssistantConversations)
    .values({
      userId: args.userId ?? null,
      guestToken: args.guestToken ?? null,
      locale: args.locale,
      pageContext: args.pageContext ?? null,
    })
    .returning();

  return mapConversation(created);
}

function mapConversation(
  row: typeof aiAssistantConversations.$inferSelect,
): AssistantConversationDto {
  return {
    id: row.id,
    locale: (row.locale as AssistantLocale) || "en",
    pageContext: row.pageContext,
    detectedIntents: (row.detectedIntents as string[]) ?? [],
    simplifiedMode: row.simplifiedMode,
  };
}

export async function loadAssistantMessages(
  conversationId: string,
): Promise<AssistantMessageDto[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(aiAssistantMessages)
    .where(eq(aiAssistantMessages.conversationId, conversationId))
    .orderBy(aiAssistantMessages.createdAt)
    .limit(80);

  return rows.map((r) => ({
    id: r.id,
    role: r.role as AssistantMessageDto["role"],
    content: r.content,
    meta: (r.meta as Record<string, unknown>) ?? null,
    createdAt: r.createdAt.toISOString(),
  }));
}

async function checkRateLimit(conversationId: string): Promise<boolean> {
  const db = getDb();
  const since = new Date(Date.now() - 60 * 60_000);
  const [row] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(aiAssistantMessages)
    .where(
      and(
        eq(aiAssistantMessages.conversationId, conversationId),
        eq(aiAssistantMessages.role, "user"),
        gte(aiAssistantMessages.createdAt, since),
      ),
    );
  return (row?.n ?? 0) < RATE_LIMIT_PER_HOUR;
}

export async function prepareAssistantTurn(args: {
  conversationId: string;
  userMessage: string;
  pageContext?: string | null;
}): Promise<PreparedAssistantTurn> {
  const trimmed = args.userMessage.trim().slice(0, 4000);
  if (!trimmed) throw new Error("assistant_empty");

  const ok = await checkRateLimit(args.conversationId);
  if (!ok) throw new Error("assistant_rate_limited");

  const db = getDb();
  const [convRow] = await db
    .select()
    .from(aiAssistantConversations)
    .where(eq(aiAssistantConversations.id, args.conversationId))
    .limit(1);
  if (!convRow) throw new Error("assistant_not_found");

  const locale = (convRow.locale as AssistantLocale) || "en";
  const pageContext = args.pageContext ?? convRow.pageContext;

  const history = await loadAssistantMessages(args.conversationId);
  const chatHistory = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const intents = classifyUserIntent(trimmed);
  const mergedIntents = mergeIntents(
    (convRow.detectedIntents as string[]) ?? [],
    intents,
  );
  const simplified =
    convRow.simplifiedMode || shouldUseSimplifiedMode(chatHistory, intents);

  const hits = await searchAssistantKnowledge({
    query: trimmed,
    locale,
    limit: 5,
  });
  const knowledgeContext = formatKnowledgeForPrompt(hits);

  const systemPrompt = buildAssistantSystemPrompt({
    locale,
    pageContext,
    simplifiedMode: simplified,
    knowledgeContext,
    detectedIntents: mergedIntents,
  });

  const recommendations = recommendServices(mergedIntents, locale);

  return {
    locale,
    trimmed,
    systemPrompt,
    chatHistory,
    mergedIntents,
    simplified,
    hits,
    recommendations,
    pageContext,
    convRow,
  };
}

async function persistAssistantTurn(args: {
  conversationId: string;
  turn: PreparedAssistantTurn;
  reply: string;
}): Promise<{
  userMessage: AssistantMessageDto;
  assistantMessage: AssistantMessageDto;
  recommendations: { label: string; href: string; reason: string }[];
}> {
  const db = getDb();
  const now = new Date();
  const { turn } = args;

  const [userRow] = await db
    .insert(aiAssistantMessages)
    .values({
      conversationId: args.conversationId,
      role: "user",
      content: turn.trimmed,
      meta: { intents: classifyUserIntent(turn.trimmed) },
    })
    .returning();

  const [assistantRow] = await db
    .insert(aiAssistantMessages)
    .values({
      conversationId: args.conversationId,
      role: "assistant",
      content: args.reply,
      meta: {
        intents: turn.mergedIntents,
        recommendations: turn.recommendations,
        knowledgeSlugs: turn.hits.map((h) => h.slug),
        simplifiedMode: turn.simplified,
      },
    })
    .returning();

  await db
    .update(aiAssistantConversations)
    .set({
      detectedIntents: turn.mergedIntents,
      simplifiedMode: turn.simplified,
      pageContext: turn.pageContext ?? turn.convRow.pageContext,
      updatedAt: now,
    })
    .where(eq(aiAssistantConversations.id, args.conversationId));

  return {
    userMessage: {
      id: userRow.id,
      role: "user",
      content: userRow.content,
      meta: (userRow.meta as Record<string, unknown>) ?? null,
      createdAt: userRow.createdAt.toISOString(),
    },
    assistantMessage: {
      id: assistantRow.id,
      role: "assistant",
      content: assistantRow.content,
      meta: (assistantRow.meta as Record<string, unknown>) ?? null,
      createdAt: assistantRow.createdAt.toISOString(),
    },
    recommendations: turn.recommendations,
  };
}

export async function sendAssistantMessage(args: {
  conversationId: string;
  userMessage: string;
  pageContext?: string | null;
}): Promise<{
  userMessage: AssistantMessageDto;
  assistantMessage: AssistantMessageDto;
  recommendations: { label: string; href: string; reason: string }[];
}> {
  const turn = await prepareAssistantTurn(args);
  const reply = await generateAssistantReply({
    systemPrompt: turn.systemPrompt,
    history: turn.chatHistory,
    userMessage: turn.trimmed,
  });
  return persistAssistantTurn({
    conversationId: args.conversationId,
    turn,
    reply,
  });
}

export async function* streamAssistantMessage(args: {
  conversationId: string;
  userMessage: string;
  pageContext?: string | null;
}): AsyncGenerator<
  | { type: "token"; content: string }
  | {
      type: "done";
      userMessage: AssistantMessageDto;
      assistantMessage: AssistantMessageDto;
      recommendations: { label: string; href: string; reason: string }[];
    },
  void,
  unknown
> {
  const turn = await prepareAssistantTurn(args);
  let full = "";

  for await (const token of streamAssistantReply({
    systemPrompt: turn.systemPrompt,
    history: turn.chatHistory,
    userMessage: turn.trimmed,
  })) {
    full += token;
    yield { type: "token", content: token };
  }

  const result = await persistAssistantTurn({
    conversationId: args.conversationId,
    turn,
    reply: full.trim() || "…",
  });

  yield {
    type: "done",
    userMessage: result.userMessage,
    assistantMessage: result.assistantMessage,
    recommendations: result.recommendations,
  };
}

/** Admin: list knowledge entries */
export async function listAssistantKnowledge() {
  await import("@/lib/assistant/knowledge-search").then((m) =>
    m.ensureAssistantKnowledgeSeeded(),
  );
  const db = getDb();
  return db
    .select()
    .from(aiAssistantKnowledge)
    .orderBy(desc(aiAssistantKnowledge.priority));
}

/** Admin analytics: top categories from recent messages */
export async function assistantAnalyticsSummary() {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60_000);

  const [convCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(aiAssistantConversations)
    .where(gte(aiAssistantConversations.createdAt, since));

  const [msgCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(aiAssistantMessages)
    .where(
      and(
        eq(aiAssistantMessages.role, "user"),
        gte(aiAssistantMessages.createdAt, since),
      ),
    );

  const recent = await db
    .select({
      content: aiAssistantMessages.content,
      createdAt: aiAssistantMessages.createdAt,
    })
    .from(aiAssistantMessages)
    .where(
      and(
        eq(aiAssistantMessages.role, "user"),
        gte(aiAssistantMessages.createdAt, since),
      ),
    )
    .orderBy(desc(aiAssistantMessages.createdAt))
    .limit(50);

  return {
    conversations7d: convCount?.n ?? 0,
    messages7d: msgCount?.n ?? 0,
    recentQuestions: recent.map((r) => ({
      content: r.content.slice(0, 200),
      createdAt: r.createdAt.toISOString(),
    })),
  };
}
