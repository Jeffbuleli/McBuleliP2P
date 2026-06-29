import { eq, and, or, desc, isNull } from "drizzle-orm";
import { getDb, aiAssistantKnowledge } from "@/db";
import { ASSISTANT_KNOWLEDGE_SEED } from "@/lib/assistant/knowledge-seed";
import type { AssistantLocale } from "@/lib/assistant/messages";
import {
  cosineSimilarity,
  embedText,
  embeddingsEnabled,
  knowledgeDocText,
} from "@/lib/assistant/embeddings";

let seeded = false;
let embeddingBackfillStarted = false;

export async function ensureAssistantKnowledgeSeeded(): Promise<void> {
  if (seeded) return;
  const db = getDb();

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
      .onConflictDoUpdate({
        target: [aiAssistantKnowledge.slug, aiAssistantKnowledge.locale],
        set: {
          category: item.category,
          title: item.title,
          content: item.content,
          tags: item.tags,
          priority: item.priority,
          published: true,
          updatedAt: new Date(),
          embedding: null,
        },
      });
  }

  seeded = true;
  void backfillMissingEmbeddings();
}

/** Embed knowledge rows missing vectors (background, non-blocking). */
export async function backfillMissingEmbeddings(): Promise<number> {
  if (!embeddingsEnabled() || embeddingBackfillStarted) return 0;
  embeddingBackfillStarted = true;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(aiAssistantKnowledge)
      .where(
        and(
          eq(aiAssistantKnowledge.published, true),
          isNull(aiAssistantKnowledge.embedding),
        ),
      )
      .limit(50);

    let done = 0;
    for (const row of rows) {
      try {
        const vec = await embedText(
          knowledgeDocText({
            title: row.title,
            content: row.content,
            tags: row.tags,
          }),
        );
        if (!vec.length) continue;
        await db
          .update(aiAssistantKnowledge)
          .set({ embedding: vec, updatedAt: new Date() })
          .where(eq(aiAssistantKnowledge.id, row.id));
        done++;
      } catch {
        /* skip row */
      }
    }
    return done;
  } finally {
    embeddingBackfillStarted = false;
  }
}

/** Embed a single knowledge row (admin save). */
export async function embedKnowledgeRow(id: string): Promise<void> {
  if (!embeddingsEnabled()) return;
  const db = getDb();
  const [row] = await db
    .select()
    .from(aiAssistantKnowledge)
    .where(eq(aiAssistantKnowledge.id, id))
    .limit(1);
  if (!row) return;

  const vec = await embedText(
    knowledgeDocText({
      title: row.title,
      content: row.content,
      tags: row.tags,
    }),
  );
  if (!vec.length) return;

  await db
    .update(aiAssistantKnowledge)
    .set({ embedding: vec, updatedAt: new Date() })
    .where(eq(aiAssistantKnowledge.id, id));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function keywordScore(
  query: string,
  doc: { title: string; content: string; tags: string[] | null },
): number {
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

function knowledgeMatchesEdition(
  tags: string[] | null | undefined,
  editionSlug: string | undefined,
): boolean {
  if (!editionSlug) return true;
  const list = tags ?? [];
  const editionTags = list.filter((t) => t.startsWith("edition:"));
  if (editionTags.length === 0) return true;
  return editionTags.some(
    (t) => t === `edition:${editionSlug}` || t === "edition:all",
  );
}

/** Hybrid keyword + semantic vector retrieval. */
export async function searchAssistantKnowledge(args: {
  query: string;
  locale: AssistantLocale;
  limit?: number;
  category?: string;
  editionSlug?: string;
}): Promise<KnowledgeHit[]> {
  await ensureAssistantKnowledgeSeeded();
  const db = getDb();
  let rows = await db
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

  if (args.category) {
    rows = rows.filter((r) => r.category === args.category);
  }
  if (args.editionSlug) {
    rows = rows.filter((r) =>
      knowledgeMatchesEdition(r.tags, args.editionSlug),
    );
  }

  const limit = args.limit ?? 5;
  let queryEmbedding: number[] | null = null;

  if (embeddingsEnabled()) {
    try {
      queryEmbedding = await embedText(args.query);
    } catch {
      queryEmbedding = null;
    }
  }

  const hasVectors = rows.some(
    (r) => Array.isArray(r.embedding) && (r.embedding as number[]).length > 0,
  );

  const scored = rows.map((r) => {
    const kw = keywordScore(args.query, r);
    const priorityBoost = (r.priority ?? 0) * 0.01;
    let vectorScore = 0;

    if (
      queryEmbedding?.length &&
      Array.isArray(r.embedding) &&
      (r.embedding as number[]).length > 0
    ) {
      vectorScore = cosineSimilarity(queryEmbedding, r.embedding as number[]);
    }

    const score =
      hasVectors && queryEmbedding?.length
        ? vectorScore * 0.75 + Math.min(kw, 5) * 0.05 + priorityBoost
        : kw + priorityBoost;

    return {
      id: r.id,
      slug: r.slug,
      category: r.category,
      title: r.title,
      content: r.content,
      score,
    };
  });

  const filtered = scored
    .filter((r) => r.score > (hasVectors && queryEmbedding?.length ? 0.35 : 0))
    .sort((a, b) => b.score - a.score);

  if (filtered.length >= 2) return filtered.slice(0, limit);

  if (filtered.length === 1) {
    const rest = scored
      .filter((r) => r.id !== filtered[0]!.id)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit - 1);
    return [...filtered, ...rest];
  }

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
