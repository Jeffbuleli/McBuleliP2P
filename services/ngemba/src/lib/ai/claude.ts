import { readEnvKey } from "@/lib/env";

/** Clé telle qu'écrite dans le .env racine (ANTROPIC_KEY). */
export function anthropicKey(): string | null {
  return (
    readEnvKey("ANTROPIC_KEY") ||
    readEnvKey("ANTHROPIC_API_KEY") ||
    readEnvKey("ANTHROPIC_KEY")
  );
}

/** Haiku 5.5 : le Claude le plus rapide, pour le triage et le chat. */
export function anthropicModel(): string {
  return (
    readEnvKey("NGEMBA_ANTHROPIC_MODEL") ||
    readEnvKey("ANTHROPIC_MODEL") ||
    "claude-haiku-5-5"
  );
}

type ContentBlock = { type?: string; text?: string };

/** Appel Messages API. Retourne le texte, sans le raisonnement interne. */
export async function claudeText(input: {
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string | null> {
  const key = anthropicKey();
  if (!key) return null;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: anthropicModel(),
      max_tokens: input.maxTokens,
      system: input.system,
      messages: [{ role: "user", content: input.user }],
    }),
  });

  if (!res.ok) {
    console.warn("[ngemba] claude", res.status);
    return null;
  }

  const data = (await res.json()) as { content?: ContentBlock[] };
  const text = (data.content ?? [])
    .filter((b) => b.type === "text" && b.text)
    .map((b) => b.text)
    .join("\n")
    .trim();
  return text || null;
}

export function parseJsonObject(raw: string): unknown | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(raw.slice(start, end + 1));
  } catch {
    return null;
  }
}
