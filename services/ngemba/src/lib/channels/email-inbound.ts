import { runTriage } from "@/lib/ai/triage";
import { runChannelAccompaniment } from "@/lib/channels/accompaniment-chat";
import { createChatMessage, NGEMBA_ACTOR } from "@/lib/sessions/chat";
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

export type EmailInboundInput = {
  idempotencyKey: string;
  from: string;
  subject?: string | null;
  text: string;
  messageId?: string | null;
  sessionId?: string | null;
  locale: string;
};

export type EmailInboundResult = {
  sessionId: string;
  created: boolean;
  from: string;
  replySubject: string;
  inReplyTo: string | null;
  replies: Array<{ body: string; role: "assistant" }>;
  suggestHumanHandoff: boolean;
  urgency: AlertSessionRecord["urgency"];
};

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function normalizeEmail(raw: string): string {
  const m = raw.match(/<([^>]+)>/);
  return (m?.[1] ?? raw).trim().toLowerCase();
}

function sessionIdFromSubject(subject: string | null | undefined): string | null {
  if (!subject) return null;
  const hit = subject.match(UUID_RE);
  return hit?.[0] ?? null;
}

function findOpenSessionByEmail(from: string): AlertSessionRecord | null {
  const open = listSessions(400).filter(
    (s) =>
      s.status !== "closed" &&
      s.status !== "cancelled" &&
      s.routingMeta?.emailFrom === from,
  );
  return open.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null;
}

function accompanimentPhase(
  humanRequired: boolean,
): "awaiting_operator" | "ai_accompaniment" {
  return humanRequired ? "awaiting_operator" : "ai_accompaniment";
}

export async function handleEmailInbound(
  input: EmailInboundInput,
): Promise<EmailInboundResult | { error: string; status: number }> {
  const text = input.text.trim();
  const from = normalizeEmail(input.from);
  if (!from.includes("@")) {
    return { error: "invalid_from", status: 400 };
  }
  if (!text) {
    return { error: "empty_text", status: 400 };
  }

  let session: AlertSessionRecord | null = null;
  let created = false;

  const hinted =
    input.sessionId || sessionIdFromSubject(input.subject);
  if (hinted) {
    session = getSession(hinted);
  }
  if (!session) {
    session = findOpenSessionByEmail(from);
  }

  if (
    session?.routingMeta?.lastInboundIdempotencyKey === input.idempotencyKey
  ) {
    return {
      sessionId: session.id,
      created: false,
      from,
      replySubject: "Re: NGEMBA",
      inReplyTo: input.messageId ?? null,
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

  const routingExtra = {
    emailFrom: from,
    emailMessageId: input.messageId ?? null,
    primaryChannel: "email" as const,
    accompanimentPhase: accompanimentPhase(triageRun.decision.humanRequired),
    lastInboundIdempotencyKey: input.idempotencyKey,
  };

  if (!session) {
    const routingBase = buildRoutingMeta({
      commune: null,
      locationLabel: null,
      category: triageRun.triage.category,
    });
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
      aiSummary:
        triageRun.triage.summary_user_locale || triageRun.triage.summary_fr,
      aiConfidence: triageRun.triage.confidence,
      aiPayload: triageRun.triage,
      routingQueue: triageRun.routing.queue,
      autoRoute: triageRun.routing.autoRoute,
      provider: triageRun.provider,
      aiMode: triageRun.aiMode,
      routingMeta: { ...routingBase, ...routingExtra },
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
      slaDueAt: computeSlaDueAt(session.createdAt, triageRun.triage.urgency),
      routingMeta: {
        ...(session.routingMeta ??
          buildRoutingMeta({
            commune: session.commune,
            locationLabel: session.locationLabel,
            category: session.category,
          })),
        ...routingExtra,
      },
      historyNote: "Message email (triage)",
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
    surface: "email",
  });
  const reply = decision.reply;
  const alreadyNotified = Boolean(session.routingMeta?.agentsNotified);
  if (decision.alertAgents && !alreadyNotified) {
    void notifyNewAlert(session);
  }
  patchSessionAiState(session.id, {
    routingMeta: {
      ...(session.routingMeta ??
        buildRoutingMeta({
          commune: session.commune,
          locationLabel: session.locationLabel,
          category: session.category,
        })),
      emailFrom: from,
      emailMessageId: input.messageId ?? null,
      primaryChannel: "email",
      accompanimentPhase: decision.alertAgents
        ? "awaiting_operator"
        : "ai_accompaniment",
      agentsNotified: alreadyNotified || decision.alertAgents,
      lastInboundIdempotencyKey: input.idempotencyKey,
    },
  });

  const replyBody = `${reply}\n\n— Ngemba\nRéf. ${session.id}`;

  addSessionChatMessage(
    session.id,
    createChatMessage({
      role: "operator",
      body: replyBody,
      actor: NGEMBA_ACTOR,
    }),
  );

  return {
    sessionId: session.id,
    created,
    from,
    replySubject: "Re: NGEMBA",
    inReplyTo: input.messageId ?? null,
    replies: [{ body: replyBody, role: "assistant" }],
    suggestHumanHandoff: decision.alertAgents,
    urgency: triageRun.triage.urgency,
  };
}
