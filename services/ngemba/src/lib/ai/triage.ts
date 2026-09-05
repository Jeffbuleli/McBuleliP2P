import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import { localTriage } from "@/lib/ai/local-triage";
import {
  TRIAGE_PROMPT_VERSION,
  TRIAGE_SYSTEM_PROMPT,
  normalizeTriageResult,
  triageSchema,
  type TriageResult,
} from "@/lib/ai/triage-schema";
import {
  evaluateResponse,
  type ResponseDecision,
} from "@/lib/response-engine";

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
  readEnvKey("NGEMBA_OPENAI_MAX_TOKENS") || "450",
);

/** Seuil: si triage local >= ce score, pas d'appel OpenAI en mode hybrid. */
const LOCAL_SKIP_THRESHOLD = Number(
  readEnvKey("NGEMBA_LOCAL_SKIP_THRESHOLD") || "0.72",
);

export type TriageRunResult = {
  triage: TriageResult;
  /** Decision moteur (file + services) - pas l'IA. */
  decision: ResponseDecision;
  /** Compat Phase 1. */
  routing: { queue: ResponseDecision["queue"]; autoRoute: boolean };
  provider: "openai" | "local";
  aiMode: AiMode;
  promptVersion: string;
};

function withEngine(
  triage: TriageResult,
  provider: "openai" | "local",
  aiMode: AiMode,
  source: string,
): TriageRunResult {
  const normalized = normalizeTriageResult(triage);
  const decision = evaluateResponse({ triage: normalized, source });
  const triageOut: TriageResult = {
    ...normalized,
    required_services:
      normalized.required_services.length > 0
        ? normalized.required_services
        : decision.requiredServices,
    prompt_version: TRIAGE_PROMPT_VERSION,
    engine_policy_version: decision.policyVersion,
    engine_reason: decision.reason,
    engine_human_required: decision.humanRequired,
  };
  return {
    triage: triageOut,
    decision,
    routing: { queue: decision.queue, autoRoute: decision.autoRoute },
    provider,
    aiMode,
    promptVersion: TRIAGE_PROMPT_VERSION,
  };
}

export async function runTriage(input: {
  message: string;
  locale: string;
  source: "sos_button" | "witness" | "chat" | "shake" | "school";
}): Promise<TriageRunResult> {
  const mode = resolveAiMode();
  const local = localTriage(input.message, input.locale, input.source);
  const { localConfidence, ...localResult } = local;

  if (mode === "local") {
    return withEngine(localResult, "local", mode, input.source);
  }

  if (mode === "hybrid" && localConfidence >= LOCAL_SKIP_THRESHOLD) {
    return withEngine(localResult, "local", mode, input.source);
  }

  const key = readEnvKey("OPENAI_API_KEY");
  if (!key) {
    return withEngine(localResult, "local", mode, input.source);
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const model =
      readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";

    const messageForModel =
      input.message.trim() === "·" || input.message.trim().length === 0
        ? `[Citizen sent audio and/or photos without written text. Orient for human review. Do not invent facts. Locale=${input.locale}; source=${input.source}]`
        : input.message.slice(0, 500);

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.2,
      max_tokens: Number.isFinite(OPENAI_MAX_TOKENS) ? OPENAI_MAX_TOKENS : 450,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TRIAGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: JSON.stringify({
            locale: input.locale,
            source: input.source,
            message: messageForModel,
            prompt_version: TRIAGE_PROMPT_VERSION,
            local_hint: {
              category: localResult.category,
              urgency: localResult.urgency,
              required_services: localResult.required_services,
            },
          }),
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = triageSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return withEngine(localResult, "local", mode, input.source);
    }

    return withEngine(parsed.data, "openai", mode, input.source);
  } catch {
    return withEngine(localResult, "local", mode, input.source);
  }
}
