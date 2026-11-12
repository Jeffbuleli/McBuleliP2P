import { resolveAiMode } from "@/lib/ai/triage";
import { openaiKey, openaiText } from "@/lib/ai/openai";

const POLISH_MAX_CHARS = 500;
const POLISH_MAX_TOKENS = 400;

const POLISH_SYSTEM = `Tu es Ngemba. Tu reformules le texte d'une personne avant qu'elle l'envoie.
- Garde la meme langue.
- Rends la phrase claire, en une ou deux phrases, sans depasser 500 caracteres.
- Ne change pas les faits. N'invente rien. Ne conseille pas. Ne juge pas.
- Reponds uniquement par le texte reformule.`;

export async function polishCitizenText(input: {
  text: string;
  locale: string;
}): Promise<{ text: string; provider: "openai" | "local" }> {
  const trimmed = input.text.trim().slice(0, POLISH_MAX_CHARS);
  if (trimmed.length < 3) {
    return { text: input.text, provider: "local" };
  }

  const mode = resolveAiMode();
  if (mode === "local" || !openaiKey()) {
    return { text: trimmed, provider: "local" };
  }

  try {
    const out = (
      (await openaiText({
        system: POLISH_SYSTEM,
        user: JSON.stringify({ locale: input.locale, text: trimmed }),
        maxTokens: POLISH_MAX_TOKENS,
      })) || ""
    ).trim();
    if (!out || out.length < 2) {
      return { text: trimmed, provider: "local" };
    }
    return { text: out.slice(0, POLISH_MAX_CHARS), provider: "openai" };
  } catch {
    return { text: trimmed, provider: "local" };
  }
}
