import { NextResponse } from "next/server";
import { z } from "zod";
import { readCitizenToken } from "@/lib/citizen/token";
import { opsActorLabel, readOpsTokenFromCookie, requireOpsAuth } from "@/lib/ops/auth";
import { emitOpsEvent } from "@/lib/ops/events";
import { addSessionChatMessage, getSession } from "@/lib/sessions/store";
import { createChatMessage } from "@/lib/sessions/chat";
import { clientIp, rateLimit, rateLimitResponse } from "@/lib/security/rate-limit";

type Ctx = { params: Promise<{ id: string }> };

const bodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
});

export async function GET(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const auth = await requireOpsAuth(req);
  const isOps = !(auth instanceof NextResponse);
  const citizen = await readCitizenToken();
  const isCitizen = Boolean(citizen && session.citizenToken === citizen);

  if (!isOps && !isCitizen) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({ messages: session.chatMessages });
}

export async function POST(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const ip = clientIp(req);
  const rl = rateLimit(`chat:${ip}`, 20, 60_000);
  if (!rl.ok) return rateLimitResponse(rl.retryAfterSec);

  const session = getSession(id);
  if (!session) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const auth = await requireOpsAuth(req);
  let message;
  if (!(auth instanceof NextResponse)) {
    const token = (await readOpsTokenFromCookie()) || "ops";
    message = createChatMessage({
      role: "operator",
      body: parsed.data.body,
      actor: opsActorLabel(token),
    });
  } else {
    const citizen = await readCitizenToken();
    if (!citizen || session.citizenToken !== citizen) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    message = createChatMessage({ role: "citizen", body: parsed.data.body });
  }

  const updated = addSessionChatMessage(id, message);
  if (!updated) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  emitOpsEvent("chat_message", { id, messageId: message.id });

  return NextResponse.json({ message, messages: updated.chatMessages });
}
