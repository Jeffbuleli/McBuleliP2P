import { runTriage } from "@/lib/ai/triage";
import { runChannelAccompaniment } from "@/lib/channels/accompaniment-chat";
import { resolveReplyLocale } from "@/lib/channels/reply-locale";
import { notifyNewAlert } from "@/lib/ops/notify";
import { computeSlaDueAt } from "@/lib/ops/sla";
import { buildRoutingMeta } from "@/lib/partners/match";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import { createChatMessage } from "@/lib/sessions/chat";
import {
  addSessionChatMessage,
  getSession,
  patchSessionAiState,
} from "@/lib/sessions/store";
import type { AlertSessionRecord } from "@/lib/sessions/types";

const RANK: Record<AlertSessionRecord["urgency"], number> = {
  info: 0,
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

function higherUrgency(
  current: AlertSessionRecord["urgency"],
  next: AlertSessionRecord["urgency"],
): AlertSessionRecord["urgency"] {
  return RANK[next] > RANK[current] ? next : current;
}

function baseMeta(session: AlertSessionRecord): SessionRoutingMeta {
  return (
    session.routingMeta ??
    buildRoutingMeta({
      commune: session.commune,
      locationLabel: session.locationLabel,
      category: session.category,
    })
  );
}

function humanAlreadyJoined(session: AlertSessionRecord): boolean {
  return session.chatMessages.some(
    (m) => m.role === "operator" && Boolean(m.actor) && m.actor !== "McBuleli IA",
  );
}

/**
 * Après un message citoyen dans l'app : Ngemba IA répond.
 * L'équipe est prévenue une seule fois, quand le triage ou le dialogue
 * juge que c'est devenu grave, ou que la personne demande un humain.
 */
export async function replyAsNgemba(
  session: AlertSessionRecord,
): Promise<AlertSessionRecord> {
  if (humanAlreadyJoined(session)) return session;
  if (session.status === "closed" || session.status === "cancelled") {
    return session;
  }

  const lastCitizen = [...session.chatMessages]
    .reverse()
    .find((m) => m.role === "citizen" && m.body.trim().length > 0);
  if (!lastCitizen) return session;

  const locale = resolveReplyLocale(lastCitizen.body, session.locale);
  const source =
    session.source === "school" || session.source === "witness"
      ? session.source
      : "chat";

  const triageRun = await runTriage({
    message: lastCitizen.body,
    locale,
    source,
  });

  const forcedAlert =
    triageRun.decision.humanRequired || session.immediateDanger;
  const decision = await runChannelAccompaniment({
    locale,
    userMessage: lastCitizen.body,
    triage: triageRun.triage,
    forcedAlert,
    history: session.chatMessages,
    channel: lastCitizen.mediaKind === "audio" ? "voice" : "text",
  });

  const alreadyNotified = Boolean(session.routingMeta?.agentsNotified);
  const alertNow = decision.alertAgents && !alreadyNotified;
  const urgency = higherUrgency(session.urgency, triageRun.triage.urgency);
  const immediate = session.immediateDanger || triageRun.triage.immediate_danger;

  patchSessionAiState(session.id, {
    locale: decision.locale,
    urgency,
    category: triageRun.triage.category,
    immediateDanger: immediate,
    aiSummary:
      triageRun.triage.summary_user_locale || triageRun.triage.summary_fr,
    aiConfidence: triageRun.triage.confidence,
    aiPayload: {
      ...triageRun.triage,
      engine_human_required: alertNow || alreadyNotified,
      engine_reason: triageRun.decision.reason,
    },
    routingQueue: alertNow ? triageRun.routing.queue : session.routingQueue,
    autoRoute: triageRun.routing.autoRoute,
    provider: triageRun.provider,
    aiMode: triageRun.aiMode,
    slaDueAt: alertNow
      ? computeSlaDueAt(session.createdAt, urgency)
      : session.slaDueAt,
    routingMeta: {
      ...baseMeta(session),
      primaryChannel: session.routingMeta?.primaryChannel ?? "app",
      accompanimentPhase: alertNow ? "awaiting_operator" : "ai_accompaniment",
      agentsNotified: alreadyNotified || alertNow,
    },
    historyNote: alertNow
      ? "Ngemba IA alerte l'équipe"
      : "Ngemba IA accompagne",
  });

  const refreshed = getSession(session.id) ?? session;
  if (alertNow) {
    void notifyNewAlert(refreshed);
  }

  const withReply = addSessionChatMessage(
    session.id,
    createChatMessage({
      role: "operator",
      actor: "McBuleli IA",
      body: decision.reply,
    }),
  );
  return withReply ?? getSession(session.id) ?? refreshed;
}
