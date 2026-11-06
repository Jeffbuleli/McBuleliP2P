import { anthropicKey, claudeText, parseJsonObject } from "@/lib/ai/claude";
import { readEnvKey } from "@/lib/env";
import type { Locale } from "@/lib/i18n";
import { getYouthScenario, type YouthScenarioId } from "@/lib/youth/scenarios";

export const YOUTH_SYSTEM_PROMPT = `Tu es NGEMBA Jeunesse, une personne calme qui parle avec un jeune en RDC (14-25 ans).

Sujets: respect, consentement, harcelement, cyberharcelement, corruption, discrimination, protection.

Posture: croire, ne pas juger, ne pas interroger. Une question ouverte. Reponse courte (max 100 mots).
Le jeune peut repondre en peu de mots. Il n'y a pas de mauvaise reponse.

suggest_sos=true seulement si quelqu'un est en danger maintenant (violence en cours, blessure, menace immediate).
Une peur, un doute ou un scenario d'entrainement ne suffisent pas.

Interdit: culpabiliser, demander un recit graphique, conseiller la violence, parler hors protection.

Reponds en JSON strict : { "reply": "...", "suggest_sos": false }`;

const DANGER_KEYWORDS =
  /\b(viol|agress|il est l[àa]|elle est l[àa]|sang|arme|hatari|likama|mbila|urgence maintenant)\b/i;

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
}): Promise<{ reply: string; suggestSos: boolean; provider: "anthropic" | "local" }> {
  const scenario = getYouthScenario(input.scenarioId);
  const lastUser = [...input.history].reverse().find((m) => m.role === "user");
  const suggestSosLocal = lastUser
    ? DANGER_KEYWORDS.test(lastUser.content)
    : false;

  const mode = (readEnvKey("NGEMBA_AI_MODE") || "hybrid").toLowerCase();
  if (!anthropicKey() || mode === "local") {
    return {
      reply: fallbackReply(input.locale, suggestSosLocal),
      suggestSos: suggestSosLocal,
      provider: "local",
    };
  }

  try {
    const raw = await claudeText({
      system: `${YOUTH_SYSTEM_PROMPT}\nReponds uniquement en JSON.`,
      user: JSON.stringify({
        locale: input.locale,
        scenario: scenario?.intro[input.locale] ?? input.scenarioId,
        history: input.history.slice(-8),
      }),
      maxTokens: 400,
    });
    const parsed = (raw ? parseJsonObject(raw) : null) as {
      reply?: string;
      suggest_sos?: boolean;
    } | null;
    return {
      reply:
        typeof parsed?.reply === "string" && parsed.reply.trim()
          ? parsed.reply.trim()
          : fallbackReply(input.locale, suggestSosLocal),
      suggestSos: Boolean(parsed?.suggest_sos) || suggestSosLocal,
      provider: "anthropic",
    };
  } catch {
    return {
      reply: fallbackReply(input.locale, suggestSosLocal),
      suggestSos: suggestSosLocal,
      provider: "local",
    };
  }
}
