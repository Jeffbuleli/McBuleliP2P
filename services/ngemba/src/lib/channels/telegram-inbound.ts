import { runTriage } from "@/lib/ai/triage";
import { runChannelAccompaniment } from "@/lib/channels/accompaniment-chat";
import { createChatMessage } from "@/lib/sessions/chat";
import {
  addSessionChatMessage,
  createSession,
  getSession,
  listSessions,
  patchSessionAiState,
} from "@/lib/sessions/store";
import type { AlertSessionRecord } from "@/lib/sessions/types";
import { notifyNewAlert } from "@/lib/ops/notify";
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

function accompanimentPhase(
  humanRequired: boolean,
): "awaiting_operator" | "ai_accompaniment" {
  return humanRequired ? "awaiting_operator" : "ai_accompaniment";
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
      accompanimentPhase: accompanimentPhase(triageRun.decision.humanRequired),
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
    const routingMeta = {
      ...(session.routingMeta ?? buildRoutingMeta({
        commune: session.commune,
        locationLabel: session.locationLabel,
        category: session.category,
      })),
      telegramChatId: input.telegramChatId,
      telegramUserId: input.telegramUserId,
      primaryChannel: "telegram" as const,
      accompanimentPhase: accompanimentPhase(triageRun.decision.humanRequired),
      lastInboundIdempotencyKey: input.idempotencyKey,
    };
    patchSessionAiState(session.id, {
      urgency: triageRun.triage.urgency,
      category: triageRun.triage.category,
      immediateDanger: triageRun.triage.immediate_danger,
      aiSummary:
        triageRun.triage.summary_user_locale || triageRun.triage.summary_fr,
      aiConfidence: triageRun.triage.confidence,
      aiPayload: triageRun.triage,
      routingQueue: triageRun.routing.queue,
      autoRoute: triageRun.routing.autoRoute,
      provider: triageRun.provider,
      aiMode: triageRun.aiMode,
      slaDueAt: computeSlaDueAt(
        session.createdAt,
        triageRun.triage.urgency,
      ),
      routingMeta,
      historyNote: "Message Telegram (triage)",
    });
    session = getSession(session.id)!;
  }

  const forcedAlert = triageRun.decision.humanRequired;
  const decision = await runChannelAccompaniment({
    locale: input.locale as "fr" | "en",
    userMessage: text,
    triage: triageRun.triage,
    forcedAlert,
    history: session.chatMessages ?? [],
  });
  const replyBody = decision.reply;
  const alreadyNotified = Boolean(session.routingMeta?.agentsNotified);
  if (decision.alertAgents && !alreadyNotified) {
    void notifyNewAlert(session);
  }
  patchSessionAiState(session.id, {
    routingMeta: {
      ...(session.routingMeta ?? buildRoutingMeta({
        commune: session.commune,
        locationLabel: session.locationLabel,
        category: session.category,
      })),
      telegramChatId: input.telegramChatId,
      telegramUserId: input.telegramUserId,
      primaryChannel: "telegram",
      accompanimentPhase: decision.alertAgents
        ? "awaiting_operator"
        : "ai_accompaniment",
      agentsNotified: alreadyNotified || decision.alertAgents,
      lastInboundIdempotencyKey: input.idempotencyKey,
    },
  });

  addSessionChatMessage(
    session.id,
    createChatMessage({ role: "operator", body: replyBody, actor: "McBuleli IA" }),
  );

  return {
    sessionId: session.id,
    created,
    telegramChatId: input.telegramChatId,
    replies: [{ body: replyBody, role: "assistant" }],
    suggestHumanHandoff: decision.alertAgents,
    urgency: triageRun.triage.urgency,
  };
}
