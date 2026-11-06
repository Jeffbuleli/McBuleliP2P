import { resolveAiMode } from "@/lib/ai/triage";
import { anthropicKey, claudeText } from "@/lib/ai/claude";
import type { TriageResult } from "@/lib/ai/triage-schema";
import { englishLeak } from "@/lib/channels/reply-locale";
import { isLocale, type Locale } from "@/lib/i18n";
import type { ChatMessage } from "@/lib/sessions/chat";

const SYSTEM = `Tu es Ngemba, l'assistant de NGEMBA RDC. Tu n'es pas McBuleli. Ne dis jamais McBuleli.

Posture: professionnel, calme, precis. Tu restes sur le sujet du fil. Tu n'ouvres pas un autre sujet. Pas de bavardage, pas de plaisanterie, pas de conversation hors de la situation.
Langues: francais, english, lingala, swahili, tshiluba, kikongo. Tu reponds dans la langue du DERNIER message. Si la personne change de langue, tu changes avec elle et tu l'aides.
- Application (surface=app): reponse ecrite, claire, 2 a 4 phrases, une seule question nouvelle.
- Telegram (surface=telegram): proche, humain, bref, 1 a 3 phrases. Si channel=voice, deux phrases orales, sans lien ni liste. Si channel=text, un court message.
- Garde le fil: les tours recents sont la conversation en cours. Ne les contredis pas. Ne melange pas deux situations.
- Ne demande pas de details graphiques, de noms, ni de preuves. La personne peut s'arreter.
- N'annonce pas qu'une alerte est enregistree tant que tu accompagnes.
- alert_agents=false tant que la situation n'est pas grave maintenant.
- alert_agents=true seulement si le danger est en train d'arriver, si un enfant est en danger immediat, si la personne demande quelqu'un de l'equipe, ou si un conseil ne suffit plus.
- Interdit: repondre seulement par "Etes-vous en securite maintenant ?" ou repeter ta reponse precedente.
- Si alert_agents=true: dis qu'une personne de l'equipe Ngemba reprend.

Si forced_alert=true: alert_agents doit etre true.

Reponds UNIQUEMENT en JSON:
{"reply":"texte dans la langue du dernier message","alert_agents":false,"locale":"fr","reason":"une phrase"}

Interdit: culpabiliser, minimiser, conseiller la violence ou la confrontation, avis juridique ferme, recit sexuel detaille.`;

const ASK_AGENT =
  /\b(agent|op[ée]rateur|operateur|quelqu'un de l'|parler [àa] (une )?personne|human please|operator)\b/i;

type Turn = { role: "user" | "assistant"; content: string };

function asNgemba(reply: string): string {
  return reply.replace(/\bMcBuleli IA\b/gi, "Ngemba").replace(/\bMcBuleli\b/gi, "Ngemba");
}

function threadTurns(history: ChatMessage[]): Turn[] {
  const kept: ChatMessage[] = [];
  let users = 0;
  for (let i = history.length - 1; i >= 0 && users < 40; i -= 1) {
    const message = history[i];
    if (!message.body.trim()) continue;
    kept.push(message);
    if (message.role === "citizen") users += 1;
  }
  return kept.reverse().map((message) => ({
    role: (message.role === "citizen" ? "user" : "assistant") as Turn["role"],
    content: message.body.trim().slice(0, 320),
  }));
}

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

const STOCK_SAFETY =
  /^(êtes-vous en sécurité maintenant\s*\??|are you safe right now\s*\??)$/i;

function stockReply(text: string): boolean {
  return STOCK_SAFETY.test(text.trim());
}

function adviceReply(locale: Locale, _triage: TriageResult, history: ChatMessage[]): string {
  const turn = history.filter((m) => m.role === "citizen").length;
  const last = [...history].reverse().find((m) => m.role !== "citizen")?.body ?? "";
  const fr = [
    "Je vous écoute. Dites ce qui se passe, avec vos mots, sans vous presser.",
    "Merci de me l'avoir dit. Je peux vous conseiller, ou simplement rester là. Que préférez-vous ?",
    "D'accord. Je reste avec vous. Continuez, une chose à la fois.",
    "Je vous suis. Souhaitez-vous un conseil, ou parler à quelqu'un de l'équipe ?",
  ];
  const en = [
    "I am listening. Tell me what is happening, in your own words.",
    "Thank you for saying that. I can give advice, or just stay with you. What do you prefer?",
    "All right. I am still here. Go on, one thing at a time.",
    "I am with you. Do you want advice, or someone from the team?",
  ];
  const pools: Partial<Record<Locale, string[]>> = {
    fr,
    en,
    ln: [
      "Nazali koyoka yo. Yebisa ngai oyo ezali koleka, na maloba na yo.",
      "Matondi. Nakoki kopesa toli, to kaka kovanda na yo. Olingi nini?",
    ],
    sw: [
      "Nakusikiliza. Niambie kinachoendelea, kwa maneno yako.",
      "Asante. Naweza kukushauri, au kubaki nawe. Unapendelea nini?",
    ],
    lua: [
      "Ndi nanyi. Amba bualu buambi, ku malu a webe.",
      "Tuasakidila. Ndi mua kupa lubilu, ne kuikala nanyi.",
    ],
    kg: [
      "Mono ke wa nge. Zaba mono nki kele na kwisa, na ndinga na nge.",
      "Matondo. Mono lenda pesa ndongisila, to kubikala ti nge.",
    ],
  };
  const pool = pools[locale] ?? fr;
  const pick = pool[turn % pool.length] ?? pool[0];
  if (pick !== last) return pick;
  return pool[(turn + 1) % pool.length] ?? pick;
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
  surface?: "app" | "telegram" | "email";
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

  const turns = threadTurns(input.history);

  try {
    const raw = await claudeText({
      system: SYSTEM,
      user: JSON.stringify({
        locale: localeName(input.locale),
        surface: input.surface ?? "app",
        channel: input.channel ?? "text",
        forced_alert: false,
        triage_urgency: input.triage.urgency,
        triage_category: input.triage.category,
        recent_turns: turns,
        latest_message: input.userMessage,
      }),
      maxTokens: 900,
    });
    const parsed = raw ? parseDecision(raw) : null;
    const spoken = parsed?.locale ?? input.locale;
    if (
      parsed &&
      !stockReply(parsed.reply) &&
      !englishLeak(spoken, parsed.reply)
    ) {
      return {
        ...parsed,
        reply: asNgemba(parsed.reply),
        locale: spoken,
        provider: "anthropic",
      };
    }
    const prose = raw && !raw.trim().startsWith("{") ? raw.trim() : "";
    if (prose.length >= 12 && prose.length <= 900 && !stockReply(prose) && !englishLeak(input.locale, prose)) {
      return {
        reply: prose,
        alertAgents: false,
        provider: "anthropic",
        locale: input.locale,
      };
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
