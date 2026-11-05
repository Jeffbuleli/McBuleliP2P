import { runTriage } from "@/lib/ai/triage";
import { createChatMessage } from "@/lib/sessions/chat";
import {
  addSessionChatMessage,
  createSession,
  getSession,
  listSessions,
  patchSessionSla,
} from "@/lib/sessions/store";
import type { AlertSessionRecord } from "@/lib/sessions/types";
import { computeSlaDueAt } from "@/lib/ops/sla";
import { buildRoutingMeta } from "@/lib/partners/match";

export type TelegramInboundInput = {
  idempotencyKey: string;
  telegramUserId: string;
  telegramChatId: string;
  text: string;
  locale: string;
  sessionId?: string | null;
};

export type TelegramInboundResult = {
  sessionId: string;
  created: boolean;
  telegramChatId: string;
  replies: Array<{ body: string; role: "assistant" }>;
  suggestHumanHandoff: boolean;
  urgency: AlertSessionRecord["urgency"];
};

function findOpenSessionByTelegramChatId(
  chatId: string,
): AlertSessionRecord | null {
  const open = listSessions(400).filter(
    (s) =>
      s.status !== "closed" &&
      s.status !== "cancelled" &&
      s.routingMeta?.telegramChatId === chatId,
  );
  return open.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function assistantReply(
  locale: string,
  urgency: AlertSessionRecord["urgency"],
  humanRequired: boolean,
): string {
  if (urgency === "critical") {
    return locale === "en"
      ? "This sounds urgent. If you are in immediate danger, call local emergency numbers. A NGEMBA operator is being alerted. You can also use SOS on https://ngemba-rdc.org/sos"
      : "Cela semble urgent. Si vous êtes en danger immédiat, appelez les numéros d'urgence locaux. Un opérateur NGEMBA est alerté. Vous pouvez aussi utiliser SOS sur https://ngemba-rdc.org/sos";
  }
  if (humanRequired) {
    return locale === "en"
      ? "Thank you. Your message is recorded. A trained operator will follow up as soon as possible during pilot hours. For immediate danger, use SOS on the app."
      : "Merci. Votre message est enregistré. Un opérateur formé reprendra dès que possible aux heures du pilote. En danger immédiat, utilisez SOS dans l'application.";
  }
  return locale === "en"
    ? "Thank you for reaching NGEMBA. McBuleli IA is assisting you. Share what you need (listening, orientation, safety). If danger rises, write SOS or use the SOS button on ngemba-rdc.org."
    : "Merci d'avoir contacté NGEMBA. McBuleli IA vous accompagne. Dites ce dont vous avez besoin (écoute, orientation, sécurité). Si le danger augmente, écrivez SOS ou le bouton SOS sur ngemba-rdc.org.";
}

export async function handleTelegramInbound(
  input: TelegramInboundInput,
): Promise<TelegramInboundResult | { error: string; status: number }> {
  const text = input.text.trim();
  if (!text) {
    return { error: "empty_text", status: 400 };
  }

  let session: AlertSessionRecord | null = null;
  let created = false;

  if (input.sessionId) {
    session = getSession(input.sessionId);
  }
  if (!session) {
    session = findOpenSessionByTelegramChatId(input.telegramChatId);
  }

  if (
    session?.routingMeta?.lastInboundIdempotencyKey === input.idempotencyKey
  ) {
    return {
      sessionId: session.id,
      created: false,
      telegramChatId: input.telegramChatId,
      replies: [],
      suggestHumanHandoff: Boolean(session.aiPayload?.engine_human_required),
      urgency: session.urgency,
    };
  }

  const triageRun = await runTriage({
    message: text,
    locale: input.locale,
    source: "chat",
  });

  if (!session) {
    const routingBase = buildRoutingMeta({
      commune: null,
      locationLabel: null,
      category: triageRun.triage.category,
    });
    const routingMeta = {
      ...routingBase,
      telegramChatId: input.telegramChatId,
      telegramUserId: input.telegramUserId,
      primaryChannel: "telegram" as const,
      accompanimentPhase: triageRun.decision.humanRequired
        ? "awaiting_operator"
        : "ai_accompaniment",
      lastInboundIdempotencyKey: input.idempotencyKey,
    };

    const createdAt = new Date().toISOString();
    session = createSession({
      source: "chat",
      locale: input.locale,
      message: text,
      urgency: triageRun.triage.urgency,
      category: triageRun.triage.category,
      immediateDanger: triageRun.triage.immediate_danger,
      lat: null,
      lng: null,
      locationLabel: null,
      commune: null,
      locationSource: null,
      locationConsentAt: null,
      aiSummary: triageRun.triage.summary_user_locale || triageRun.triage.summary_fr,
      aiConfidence: triageRun.triage.confidence,
      aiPayload: triageRun.triage,
      routingQueue: triageRun.routing.queue,
      autoRoute: triageRun.routing.autoRoute,
      provider: triageRun.provider,
      aiMode: triageRun.aiMode,
      routingMeta,
      slaDueAt: computeSlaDueAt(createdAt, triageRun.triage.urgency),
      chatMessages: [createChatMessage({ role: "citizen", body: text })],
    });
    created = true;
  } else {
    addSessionChatMessage(
      session.id,
      createChatMessage({ role: "citizen", body: text }),
    );
    session = getSession(session.id)!;
    patchSessionSla(session.id, {
      routingMeta: {
        ...(session.routingMeta ?? buildRoutingMeta({
          commune: session.commune,
          locationLabel: session.locationLabel,
          category: session.category,
        })),
        telegramChatId: input.telegramChatId,
        telegramUserId: input.telegramUserId,
        primaryChannel: "telegram",
        lastInboundIdempotencyKey: input.idempotencyKey,
      },
      historyNote: "Message Telegram",
    });
    session = getSession(session.id)!;
  }

  const replyBody = assistantReply(
    input.locale,
    session.urgency,
    Boolean(session.aiPayload?.engine_human_required ?? triageRun.decision.humanRequired),
  );

  addSessionChatMessage(
    session.id,
    createChatMessage({ role: "operator", body: replyBody, actor: "McBuleli IA" }),
  );

  return {
    sessionId: session.id,
    created,
    telegramChatId: input.telegramChatId,
    replies: [{ body: replyBody, role: "assistant" }],
    suggestHumanHandoff: Boolean(
      session.aiPayload?.engine_human_required ?? triageRun.decision.humanRequired,
    ),
    urgency: session.urgency,
  };
}
