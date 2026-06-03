import { eq } from "drizzle-orm";
import { aiAssistantKnowledge, getDb } from "@/db";
import { ACADEMY_KNOWLEDGE_SEED } from "@/lib/academy-knowledge-seed";

let academyKnowledgeSeeded = false;

export async function ensureAcademyKnowledgeSeeded(): Promise<void> {
  if (academyKnowledgeSeeded) return;
  const db = getDb();
  for (const item of ACADEMY_KNOWLEDGE_SEED) {
    const [existing] = await db
      .select({ id: aiAssistantKnowledge.id })
      .from(aiAssistantKnowledge)
      .where(eq(aiAssistantKnowledge.slug, item.slug))
      .limit(1);
    if (existing) continue;
    await db.insert(aiAssistantKnowledge).values({
      slug: item.slug,
      category: item.category,
      locale: item.locale,
      title: item.title,
      content: item.content,
      tags: [...item.tags],
      priority: item.priority,
      published: true,
    });
  }
  academyKnowledgeSeeded = true;
  const { backfillMissingEmbeddings } = await import(
    "@/lib/assistant/knowledge-search"
  );
  void backfillMissingEmbeddings();
}
