import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import { localTriage } from "@/lib/ai/local-triage";
import {
  TRIAGE_SYSTEM_PROMPT,
  applyTriageRules,
  triageSchema,
  type TriageResult,
} from "@/lib/ai/triage-schema";

export type AiMode = "local" | "hybrid" | "openai";

/**
 * local  = 0 credit OpenAI (dev / economique)
 * hybrid = regles locales d'abord; OpenAI seulement si ambigu (recommande prod)
 * openai = toujours OpenAI si cle presente
 *
 * Defaut: local si pas de cle OU NGEMBA_AI_MODE=local; sinon hybrid.
 */
export function resolveAiMode(): AiMode {
  const raw = (readEnvKey("NGEMBA_AI_MODE") || "").toLowerCase();
  if (raw === "local" || raw === "hybrid" || raw === "openai") return raw;
  const key = readEnvKey("OPENAI_API_KEY");
  return key ? "hybrid" : "local";
}

const OPENAI_MAX_TOKENS = Number(
  readEnvKey("NGEMBA_OPENAI_MAX_TOKENS") || "350",
);

/** Seuil: si triage local >= ce score, pas d'appel OpenAI en mode hybrid. */
const LOCAL_SKIP_THRESHOLD = Number(
  readEnvKey("NGEMBA_LOCAL_SKIP_THRESHOLD") || "0.72",
);

export async function runTriage(input: {
  message: string;
  locale: string;
  source: "sos_button" | "witness" | "chat";
}): Promise<{
  triage: TriageResult;
  routing: ReturnType<typeof applyTriageRules>;
  provider: "openai" | "local";
  aiMode: AiMode;
}> {
  const mode = resolveAiMode();
  const local = localTriage(input.message, input.locale, input.source);
  const { localConfidence, ...localResult } = local;

  if (mode === "local") {
    return {
      triage: localResult,
      routing: applyTriageRules(localResult),
      provider: "local",
      aiMode: mode,
    };
  }

  if (mode === "hybrid" && localConfidence >= LOCAL_SKIP_THRESHOLD) {
    return {
      triage: localResult,
      routing: applyTriageRules(localResult),
      provider: "local",
      aiMode: mode,
    };
  }

  const key = readEnvKey("OPENAI_API_KEY");
  if (!key) {
    return {
      triage: localResult,
      routing: applyTriageRules(localResult),
      provider: "local",
      aiMode: mode,
    };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const model =
      readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: Number.isFinite(OPENAI_MAX_TOKENS) ? OPENAI_MAX_TOKENS : 350,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRIAGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            locale: input.locale,
            source: input.source,
            message: input.message.slice(0, 2000),
            local_hint: {
              category: localResult.category,
              urgency: localResult.urgency,
            },
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = triageSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return {
        triage: localResult,
        routing: applyTriageRules(localResult),
        provider: "local",
        aiMode: mode,
      };
    }

    return {
      triage: parsed.data,
      routing: applyTriageRules(parsed.data),
      provider: "openai",
      aiMode: mode,
    };
  } catch {
    return {
      triage: localResult,
      routing: applyTriageRules(localResult),
      provider: "local",
      aiMode: mode,
    };
  }
}
