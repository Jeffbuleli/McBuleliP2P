import { randomUUID } from "crypto";
import type { MediaKind } from "@/lib/media/types";

export const NGEMBA_ACTOR = "Ngemba";
export const THREAD_USER_LIMIT = 40;

export function isNgembaActor(actor?: string | null): boolean {
  return actor === NGEMBA_ACTOR || actor === "McBuleli IA";
}

export type ChatMessage = {
  id: string;
  role: "citizen" | "operator";
  body: string;
  createdAt: string;
  actor?: string;
  mediaId?: string | null;
  mediaKind?: MediaKind | null;
  mediaFileName?: string | null;
};

export function createChatMessage(input: {
  role: ChatMessage["role"];
  body: string;
  actor?: string;
  mediaId?: string | null;
  mediaKind?: MediaKind | null;
  mediaFileName?: string | null;
}): ChatMessage {
  return {
    id: randomUUID(),
    role: input.role,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    actor: input.actor,
    mediaId: input.mediaId ?? null,
    mediaKind: input.mediaKind ?? null,
    mediaFileName: input.mediaFileName ?? null,
  };
}

export function citizenTurnCount(messages: ChatMessage[]): number {
  return messages.filter((m) => m.role === "citizen" && m.body.trim()).length;
}
