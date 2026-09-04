import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import { resolveAiMode } from "@/lib/ai/triage";

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
}): Promise<{ text: string; provider: "openai" | "local" }> {
  const trimmed = input.text.trim().slice(0, POLISH_MAX_CHARS);
  if (trimmed.length < 3) {
    return { text: input.text, provider: "local" };
  }

  const mode = resolveAiMode();
  const key = readEnvKey("OPENAI_API_KEY");
  if (mode === "local" || !key) {
    return { text: trimmed, provider: "local" };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const model =
      readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.1,
      max_tokens: POLISH_MAX_TOKENS,
      messages: [
        { role: "system", content: POLISH_SYSTEM },
        {
          role: "user",
          content: JSON.stringify({
            locale: input.locale,
            text: trimmed,
          }),
        },
      ],
    });

    const out = (completion.choices[0]?.message?.content || "").trim();
    if (!out || out.length < 2) {
      return { text: trimmed, provider: "local" };
    }
    return { text: out.slice(0, POLISH_MAX_CHARS), provider: "openai" };
  } catch {
    return { text: trimmed, provider: "local" };
  }
}
