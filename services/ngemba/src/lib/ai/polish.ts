import { resolveAiMode } from "@/lib/ai/triage";
import { anthropicKey, claudeText } from "@/lib/ai/claude";

const POLISH_MAX_CHARS = 500;
const POLISH_MAX_TOKENS = 400;

const POLISH_SYSTEM = `You clarify citizen alert text for NGEMBA / Ngemba IA.
Rules:
- Fix spelling, accents, grammar, and punctuation only.
- Keep the same language as the input.
- Do not summarize, shorten, expand, or invent facts.
- Do not judge, advise, or change meaning.
- Return ONLY the clarified text, no quotes or commentary.`;

export async function polishCitizenText(input: {
  text: string;
  locale: string;
}): Promise<{ text: string; provider: "anthropic" | "local" }> {
  const trimmed = input.text.trim().slice(0, POLISH_MAX_CHARS);
  if (trimmed.length < 3) {
    return { text: input.text, provider: "local" };
  }

  const mode = resolveAiMode();
  if (mode === "local" || !anthropicKey()) {
    return { text: trimmed, provider: "local" };
  }

  try {
    const out = (
      (await claudeText({
        system: POLISH_SYSTEM,
        user: JSON.stringify({ locale: input.locale, text: trimmed }),
        maxTokens: POLISH_MAX_TOKENS,
      })) || ""
    ).trim();
    if (!out || out.length < 2) {
      return { text: trimmed, provider: "local" };
    }
    return { text: out.slice(0, POLISH_MAX_CHARS), provider: "anthropic" };
  } catch {
    return { text: trimmed, provider: "local" };
  }
}
