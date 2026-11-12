import { readEnvKey } from "@/lib/env";

export function openaiKey(): string | null {
  return readEnvKey("OPENAI_API_KEY");
}

export function openaiModel(): string {
  return readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";
}

/** Chat Completions. Remplace Claude quand la clé Anthropic ne répond plus. */
export async function openaiText(input: {
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string | null> {
  const key = openaiKey();
  if (!key) return null;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: openaiModel(),
      max_tokens: input.maxTokens,
      temperature: 0.3,
      messages: [
        { role: "system", content: input.system },
        { role: "user", content: input.user },
      ],
    }),
  });

  if (!res.ok) {
    console.warn("[ngemba] openai", res.status);
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  const text = data.choices?.[0]?.message?.content?.trim() ?? "";
  return text || null;
}
