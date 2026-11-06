import { resolveAiMode } from "@/lib/ai/triage";
import { anthropicKey, claudeText } from "@/lib/ai/claude";
import type { TriageResult } from "@/lib/ai/triage-schema";
import { englishLeak } from "@/lib/channels/reply-locale";
import { isLocale, type Locale } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/sessions/chat";

const SYSTEM = `Tu es McBuleli IA pour NGEMBA RDC. Tu parles avec une personne dans l'application, sur Telegram ou par email.

Posture: croire, ralentir, proteger. Surtout si violence, VBG, ecole, denonciation ou temoignage.
- Reponds dans la langue du dernier message : francais, english, lingala, swahili, tshiluba ou kikongo. Ne melange pas.
- Varie l'ouverture. Ne repose pas une question deja posee. Adapte-toi s'il demande d'etre bref, plus simple, ou de changer de langue.
- channel=voice : deux phrases orales, sans lien ni liste.
- channel=text : deux a quatre phrases, une seule question.
- Ne demande pas de details graphiques, de noms, ni de preuves. La personne peut s'arreter.
- N'annonce pas qu'une alerte est enregistree tant que tu accompagnes.
- alert_agents=false tant que tu n'as pas compris si c'est grave maintenant.
- alert_agents=true seulement si le danger est en train d'arriver, si un enfant est en danger immediat, si la personne demande quelqu'un de l'equipe, ou si un conseil ne suffit plus.
- Si alert_agents=false: ecoute, oriente vers un service adapte (sante, ecoute, referent), pose une question.
- Si alert_agents=true: dis qu'une personne de l'equipe reprend, et rappelle un lieu sur si besoin.

Si forced_alert=true: alert_agents doit etre true.

Reponds UNIQUEMENT en JSON:
{"reply":"texte court dans la langue du message, max 80 mots","alert_agents":false,"locale":"fr","reason":"une phrase"}

Interdit: culpabiliser, minimiser, conseiller la violence ou la confrontation, avis juridique ferme, recit sexuel detaille.`;

const ASK_AGENT =
  /\b(agent|op[ée]rateur|operateur|quelqu'un de l'|parler [àa] (une )?personne|human please|operator)\b/i;

type Turn = { role: "user" | "assistant"; content: string };

function localeName(locale: Locale): string {
  const map: Record<string, string> = {
    fr: "francais",
    en: "english",
    ln: "lingala",
    sw: "swahili",
    lua: "tshiluba",
    kg: "kikongo",
  };
  return map[locale] ?? "francais";
}

function adviceReply(locale: Locale, triage: TriageResult, history: ChatMessage[]): string {
  const rawQuestion = triage.follow_up_questions?.find((q) => q.trim())?.trim();
  const question =
    rawQuestion && !englishLeak(locale, rawQuestion) ? rawQuestion : undefined;
  const already = history.some((m) => m.role !== "citizen");
  if (locale === "en") {
    if (already) {
      return question
        ? question
        : "I am with you. Tell me a bit more, and whether you want advice or a person from the team.";
    }
    return "I am here with you. Tell me what you need, at your pace. I can give advice first. If you want someone from the team, say so.";
  }
  if (locale === "ln") {
    return already
      ? "Nazali na yo. Yebisa ngai mwa makambo, na tempo na yo."
      : "Mbote. Nazali na yo. Yebisa ngai oyo ezali koleka, na tempo na yo.";
  }
  if (locale === "sw") {
    return already
      ? "Niko nawe. Niambie kidogo zaidi, kwa kasi yako."
      : "Niko hapa nawe. Niambie unachohitaji, kwa kasi yako.";
  }
  if (locale === "lua") {
    return already
      ? "Ndi nanyi. Amba kashidi, ku lungenyi webe."
      : "Ndi nanyi. Amba bualu bua kudi, ku lungenyi webe.";
  }
  if (locale === "kg") {
    return already
      ? "Mono kele ti nge. Zaba mono mwa diambu, na ntangu na nge."
      : "Mbote. Mono kele ti nge. Zaba mono nki kele na kwisa, na ntangu na nge.";
  }
  if (already) {
    return question
      ? question
      : "Je reste avec vous. Dites-m'en un peu plus, et si vous voulez un conseil ou une personne de l'équipe.";
  }
  return "Je suis avec vous. Dites ce dont vous avez besoin, à votre rythme. Je peux d'abord vous conseiller. Si vous voulez une personne de l'équipe, dites-le.";
}

function alertReply(locale: Locale): string {
  if (locale === "en") {
    return "I hear you. I am asking someone from the NGEMBA team to take this up. If you are in immediate danger, use SOS: https://ngemba-rdc.org/sos";
  }
  if (locale === "ln") {
    return "Nayoki yo. Nasengi moto moko ya ekipi NGEMBA azwa likambo oyo. Soki likama ezali sikoyo: SOS https://ngemba-rdc.org/sos";
  }
  if (locale === "sw") {
    return "Nakusikia. Naomba mtu wa timu ya NGEMBA achukue hili. Hatari sasa hivi: SOS https://ngemba-rdc.org/sos";
  }
  if (locale === "lua") {
    return "Nayuka. Ndi mujinga muntu wa ekipi NGEMBA. Dikama lelu: SOS https://ngemba-rdc.org/sos";
  }
  if (locale === "kg") {
    return "Mono me wa. Mono ke lomba muntu ya ekipi NGEMBA kubaka diambu yai. Nkatu bubu: SOS https://ngemba-rdc.org/sos";
  }
  return "Je vous entends. Je demande à une personne de l'équipe NGEMBA de reprendre cet échange. En danger immédiat : SOS https://ngemba-rdc.org/sos";
}

function parseDecision(raw: string): {
  reply: string;
  alertAgents: boolean;
  locale?: Locale;
} | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const data = JSON.parse(raw.slice(start, end + 1)) as {
      reply?: unknown;
      alert_agents?: unknown;
      locale?: unknown;
    };
    const reply = typeof data.reply === "string" ? data.reply.trim() : "";
    if (reply.length < 5) return null;
    const locale =
      typeof data.locale === "string" && isLocale(data.locale)
        ? data.locale
        : undefined;
    return {
      reply: reply.slice(0, 900),
      alertAgents: data.alert_agents === true,
      locale,
    };
  } catch {
    return null;
  }
}

export async function runChannelAccompaniment(input: {
  locale: Locale;
  userMessage: string;
  triage: TriageResult;
  forcedAlert: boolean;
  history: ChatMessage[];
  channel?: "text" | "voice";
}): Promise<{
  reply: string;
  alertAgents: boolean;
  provider: "anthropic" | "local";
  locale: Locale;
}> {
  const asked = ASK_AGENT.test(input.userMessage);
  if (input.forcedAlert || asked) {
    return {
      reply: alertReply(input.locale),
      alertAgents: true,
      provider: "local",
      locale: input.locale,
    };
  }

  const mode = resolveAiMode();
  if (!anthropicKey() || mode === "local") {
    return {
      reply: adviceReply(input.locale, input.triage, input.history),
      alertAgents: false,
      provider: "local",
      locale: input.locale,
    };
  }

  const turns: Turn[] = input.history.slice(-10).map((m) => ({
    role: (m.role === "citizen" ? "user" : "assistant") as Turn["role"],
    content: m.body,
  }));

  try {
    const raw = await claudeText({
      system: SYSTEM,
      user: JSON.stringify({
        locale: localeName(input.locale),
        channel: input.channel ?? "text",
        forced_alert: false,
        triage_urgency: input.triage.urgency,
        triage_category: input.triage.category,
        recent_turns: turns,
        latest_message: input.userMessage,
      }),
      maxTokens: 500,
    });
    const parsed = raw ? parseDecision(raw) : null;
    const spoken = parsed?.locale ?? input.locale;
    if (parsed && !englishLeak(spoken, parsed.reply)) {
      return { ...parsed, locale: spoken, provider: "anthropic" };
    }
  } catch (err) {
    console.warn("[ngemba] accompaniment chat failed", err);
  }

  return {
    reply: adviceReply(input.locale, input.triage, input.history),
    alertAgents: false,
    provider: "local",
    locale: input.locale,
  };
}
