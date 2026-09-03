import OpenAI from "openai";
import { readEnvKey } from "@/lib/env";
import type { Locale } from "@/lib/i18n";
import { getYouthScenario, type YouthScenarioId } from "@/lib/youth/scenarios";

export const YOUTH_SYSTEM_PROMPT = `Tu es NGEMBA Jeunesse, guide educatif interactif pour jeunes en RDC (14-25 ans).

Sujets autorises : respect, consentement, harcelement, cyberharcelement, corruption, discrimination, protection des enfants.

Format : reponses courtes (max 120 mots), bienveillantes, questions ouvertes, debrief sans jugement.

Si danger reel ou violence imminente → suggest_sos=true et inviter le bouton SOS NGEMBA.

Interdit : culpabiliser, conseiller la violence, parler de sujets hors securite/education.

Reponds en JSON strict : { "reply": "...", "suggest_sos": false }`;

const DANGER_KEYWORDS =
  /\b(danger|viol|agresse|mort|sang|peur|hatari|likama|urgence|aide)\b/i;

type ChatTurn = { role: "user" | "assistant"; content: string };

function fallbackReply(locale: Locale, suggestSos: boolean): string {
  if (suggestSos) {
    if (locale === "en") {
      return "This sounds serious. Use the NGEMBA SOS button now or tell a trusted adult. You are not alone.";
    }
    if (locale === "sw") {
      return "Hii inaonekana hatari. Tumia kitufe cha SOS cha NGEMBA sasa au mwambie mtu unayemwamini.";
    }
    return "Cela semble serieux. Utilise le bouton SOS NGEMBA maintenant ou parle a un adulte de confiance.";
  }
  if (locale === "en") {
    return "Thank you for sharing. What matters most to you in this situation? There is no single perfect answer.";
  }
  if (locale === "sw") {
    return "Asante kwa kushiriki. Nini muhimu zaidi kwako katika hali hii? Hakuna jibu moja kamili.";
  }
  return "Merci d'avoir partage. Qu'est-ce qui compte le plus pour toi dans cette situation ? Il n'y a pas une seule bonne reponse.";
}

export async function runYouthChat(input: {
  scenarioId: YouthScenarioId;
  locale: Locale;
  history: ChatTurn[];
}): Promise<{ reply: string; suggestSos: boolean; provider: "openai" | "local" }> {
  const scenario = getYouthScenario(input.scenarioId);
  const lastUser = [...input.history].reverse().find((m) => m.role === "user");
  const suggestSosLocal = lastUser
    ? DANGER_KEYWORDS.test(lastUser.content)
    : false;

  const key = readEnvKey("OPENAI_API_KEY");
  const mode = (readEnvKey("NGEMBA_AI_MODE") || "hybrid").toLowerCase();
  if (!key || mode === "local") {
    return {
      reply: fallbackReply(input.locale, suggestSosLocal),
      suggestSos: suggestSosLocal,
      provider: "local",
    };
  }

  try {
    const client = new OpenAI({ apiKey: key });
    const model =
      readEnvKey("OPENAI_ASSISTANT_MODEL") || "gpt-4o-mini";

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: YOUTH_SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify({
          locale: input.locale,
          scenario: scenario?.intro[input.locale] ?? input.scenarioId,
          history: input.history.slice(-8),
        }),
      },
    ];

    const completion = await client.chat.completions.create({
      model,
      temperature: 0.4,
      max_tokens: 220,
      response_format: { type: "json_object" },
      messages,
    });

    const raw = completion.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(raw) as {
      reply?: string;
      suggest_sos?: boolean;
    };
    return {
      reply:
        typeof parsed.reply === "string" && parsed.reply.trim()
          ? parsed.reply.trim()
          : fallbackReply(input.locale, suggestSosLocal),
      suggestSos: Boolean(parsed.suggest_sos) || suggestSosLocal,
      provider: "openai",
    };
  } catch {
    return {
      reply: fallbackReply(input.locale, suggestSosLocal),
      suggestSos: suggestSosLocal,
      provider: "local",
    };
  }
}
