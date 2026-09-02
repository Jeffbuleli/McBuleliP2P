import { randomUUID } from "crypto";

export type ChatMessage = {
  id: string;
  role: "citizen" | "operator";
  body: string;
  createdAt: string;
  actor?: string;
};

export function createChatMessage(input: {
  role: ChatMessage["role"];
  body: string;
  actor?: string;
}): ChatMessage {
  return {
    id: randomUUID(),
    role: input.role,
    body: input.body.trim(),
    createdAt: new Date().toISOString(),
    actor: input.actor,
  };
}
