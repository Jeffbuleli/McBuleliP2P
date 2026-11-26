import { readEnvKey } from "@/lib/env";
import { openaiKey, openaiModel } from "@/lib/ai/openai";

export type LlmProvider = "openai" | "nvidia" | "none";

const DEFAULT_TIMEOUT_MS = Number(
  readEnvKey("NGEMBA_LLM_TIMEOUT_MS") || "14000",
);

export function resolveLlmProvider(): LlmProvider {
  const pref = (readEnvKey("NGEMBA_LLM_PROVIDER") || "auto").toLowerCase();
  const nvidiaKey = readEnvKey("NGEMBA_NVIDIA_API_KEY");
  const openKey = openaiKey();

  if (pref === "nvidia" && nvidiaKey) return "nvidia";
  if (pref === "openai" && openKey) return "openai";
  if (pref === "nvidia" && !nvidiaKey && openKey) return "openai";
  if (pref === "openai" && !openKey && nvidiaKey) return "nvidia";
  if (openKey) return "openai";
  if (nvidiaKey) return "nvidia";
  return "none";
}

export function llmProviderForHealth(): {
  provider: LlmProvider;
  model: string | null;
} {
  const provider = resolveLlmProvider();
  if (provider === "nvidia") {
    return {
      provider,
      model:
        readEnvKey("NGEMBA_NVIDIA_MODEL") ||
        "meta/llama-3.1-8b-instruct",
    };
  }
  if (provider === "openai") {
    return { provider, model: openaiModel() };
  }
  return { provider, model: null };
}

/** Triage + accompagnement : même pile LLM (OpenAI ou NVIDIA NIM). */
export async function chatText(input: {
  system: string;
  user: string;
  maxTokens: number;
  temperature?: number;
}): Promise<{ text: string | null; provider: LlmProvider }> {
  const provider = resolveLlmProvider();
  if (provider === "none") return { text: null, provider };

  const temperature = input.temperature ?? 0.3;
  const timeoutMs = DEFAULT_TIMEOUT_MS;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  const messages = [
    { role: "system" as const, content: input.system },
    { role: "user" as const, content: input.user },
  ];

  try {
    if (provider === "openai") {
      const key = openaiKey();
      if (!key) return { text: null, provider: "none" };
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: openaiModel(),
          max_tokens: input.maxTokens,
          temperature,
          messages,
        }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        console.warn("[ngemba] openai", res.status);
        return { text: null, provider };
      }
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string | null } }>;
      };
      const text = data.choices?.[0]?.message?.content?.trim() ?? "";
      return { text: text || null, provider };
    }

    const key = readEnvKey("NGEMBA_NVIDIA_API_KEY");
    const model =
      readEnvKey("NGEMBA_NVIDIA_MODEL") || "meta/llama-3.1-8b-instruct";
    const res = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          max_tokens: input.maxTokens,
          temperature,
          messages,
        }),
        signal: ctrl.signal,
      },
    );
    if (!res.ok) {
      console.warn("[ngemba] nvidia nim", res.status);
      return { text: null, provider };
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
    const text = data.choices?.[0]?.message?.content?.trim() ?? "";
    return { text: text || null, provider };
  } catch (err) {
    console.warn("[ngemba] llm request failed", provider, err);
    return { text: null, provider };
  } finally {
    clearTimeout(timer);
  }
}