import { randomUUID } from "crypto";
import type { MediaKind } from "@/lib/media/types";

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
