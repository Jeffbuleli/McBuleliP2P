import type { TriageResult } from "@/lib/ai/triage-schema";
import type { RoutingQueue } from "@/lib/response-engine/types";
import type { MediaAttachment } from "@/lib/media/types";
import type { ChatMessage } from "@/lib/sessions/chat";
import type { SchoolContext } from "@/lib/school/types";
import type { SessionRoutingMeta } from "@/lib/partners/types";
import type { SessionEscalation } from "@/lib/ops/sla";
import type { TrustedContact } from "@/lib/trusted-contacts/types";

export type { ChatMessage };

export type StatusHistoryEntry = {
  at: string;
  status: AlertSessionRecord["status"];
  actor: string | null;
  note?: string;
};

export type AlertSessionRecord = {
  id: string;
  status: "opened" | "active" | "oriented" | "closed" | "cancelled";
  source: "sos_button" | "witness" | "chat" | "shake" | "school";
  locale: string;
  message: string;
  urgency: TriageResult["urgency"];
  category: TriageResult["category"];
  immediateDanger: boolean;
  lat: number | null;
  lng: number | null;
  locationLabel: string | null;
  commune: string | null;
  locationSource: string | null;
  locationConsentAt: string | null;
  aiSummary: string;
  aiConfidence: number;
  aiPayload: TriageResult;
  routingQueue: RoutingQueue;
  autoRoute: boolean;
  provider: "openai" | "local";
  aiMode: string;
  operatorNotes: string | null;
  assignedTo: string | null;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  orientedAt: string | null;
  closedAt: string | null;
  citizenToken: string | null;
  /** IP capturee a la creation - OPS only. */
  clientIp: string | null;
  userAgent: string | null;
  discreteMode: boolean;
  trustedContacts: TrustedContact[];
  schoolContext: SchoolContext | null;
  routingMeta: SessionRoutingMeta | null;
  slaDueAt: string | null;
  escalation: SessionEscalation | null;
  media: MediaAttachment[];
  chatMessages: ChatMessage[];
};

export type IncidentEventType =
  | "created"
  | "status_change"
  | "sla"
  | "escalation"
  | "media"
  | "chat"
  | "note"
  | "system";

export type IncidentEventRecord = {
  id: string;
  sessionId: string;
  at: string;
  eventType: IncidentEventType | string;
  status: string | null;
  actor: string | null;
  note: string | null;
  payload: unknown;
};
