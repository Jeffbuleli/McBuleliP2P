import { eq, and, or, desc } from "drizzle-orm";
import { getDb, aiAssistantKnowledge } from "@/db";
import { ASSISTANT_KNOWLEDGE_SEED } from "@/lib/assistant/knowledge-seed";
import type { AssistantLocale } from "@/lib/assistant/messages";

let seeded = false;

export async function ensureAssistantKnowledgeSeeded(): Promise<void> {
  if (seeded) return;
  const db = getDb();
  const [row] = await db
    .select({ id: aiAssistantKnowledge.id })
    .from(aiAssistantKnowledge)
    .limit(1);
  if (row) {
    seeded = true;
    return;
  }
  for (const item of ASSISTANT_KNOWLEDGE_SEED) {
    await db
      .insert(aiAssistantKnowledge)
      .values({
        slug: item.slug,
        category: item.category,
        locale: item.locale,
        title: item.title,
        content: item.content,
        tags: item.tags,
        priority: item.priority,
        published: true,
      })
      .onConflictDoNothing();
  }
  seeded = true;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreMatch(query: string, doc: { title: string; content: string; tags: string[] | null }): number {
  const qTokens = new Set(tokenize(query));
  if (qTokens.size === 0) return 0;
  const hay = `${doc.title} ${doc.content} ${(doc.tags ?? []).join(" ")}`.toLowerCase();
  let score = 0;
  for (const t of qTokens) {
    if (hay.includes(t)) score += 1;
  }
  return score;
}

export type KnowledgeHit = {
  id: string;
  slug: string;
  category: string;
  title: string;
  content: string;
  score: number;
};

/** Keyword + tag retrieval (RAG-lite). Upgrade to vector search when embeddings populated. */
export async function searchAssistantKnowledge(args: {
  query: string;
  locale: AssistantLocale;
  limit?: number;
}): Promise<KnowledgeHit[]> {
  await ensureAssistantKnowledgeSeeded();
  const db = getDb();
  const rows = await db
    .select()
    .from(aiAssistantKnowledge)
    .where(
      and(
        eq(aiAssistantKnowledge.published, true),
        or(
          eq(aiAssistantKnowledge.locale, "all"),
          eq(aiAssistantKnowledge.locale, args.locale),
        ),
      ),
    )
    .orderBy(desc(aiAssistantKnowledge.priority));

  const scored = rows
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      category: r.category,
      title: r.title,
      content: r.content,
      score: scoreMatch(args.query, r) + (r.priority ?? 0) * 0.01,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score);

  const limit = args.limit ?? 5;
  if (scored.length >= 2) return scored.slice(0, limit);

  // Fallback: top priority docs for cold start
  return rows.slice(0, limit).map((r) => ({
    id: r.id,
    slug: r.slug,
    category: r.category,
    title: r.title,
    content: r.content,
    score: r.priority ?? 0,
  }));
}

export function formatKnowledgeForPrompt(hits: KnowledgeHit[]): string {
  if (hits.length === 0) return "";
  return hits
    .map(
      (h, i) =>
        `[${i + 1}] ${h.title} (${h.category})\n${h.content.slice(0, 800)}`,
    )
    .join("\n\n---\n\n");
}
