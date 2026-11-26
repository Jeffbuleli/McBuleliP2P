import { chatText } from "@/lib/ai/llm-text";
import { readEnvKey } from "@/lib/env";

export function openaiKey(): string | null {
  return readEnvKey("OPENAI_API_KEY");
}

export function openaiModel(): string {
  return readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";
}

/** Triage / polish — route via chatText (OpenAI ou NVIDIA NIM selon env). */
export async function openaiText(input: {
  system: string;
  user: string;
  maxTokens: number;
}): Promise<string | null> {
  const { text } = await chatText({ ...input, temperature: 0.3 });
  return text;
}
