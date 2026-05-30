import OpenAI from "openai";

let embedClient: OpenAI | null = null;

export function embeddingsEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

function getEmbedClient(): OpenAI {
  if (!embedClient) {
    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) throw new Error("openai_not_configured");
    embedClient = new OpenAI({ apiKey: key });
  }
  return embedClient;
}

export function embeddingModel(): string {
  return (
    process.env.OPENAI_EMBEDDING_MODEL?.trim() || "text-embedding-3-small"
  );
}

/** OpenAI embedding for semantic RAG retrieval. */
export async function embedText(text: string): Promise<number[]> {
  if (!embeddingsEnabled()) return [];
  const openai = getEmbedClient();
  const input = text.trim().slice(0, 8000);
  if (!input) return [];

  const res = await openai.embeddings.create({
    model: embeddingModel(),
    input,
  });

  const vec = res.data[0]?.embedding;
  if (!vec?.length) throw new Error("empty_embedding");
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom > 0 ? dot / denom : 0;
}

export function knowledgeDocText(args: {
  title: string;
  content: string;
  tags?: string[] | null;
}): string {
  const tags = (args.tags ?? []).join(", ");
  return `${args.title}\n${args.content}${tags ? `\nTags: ${tags}` : ""}`;
}
