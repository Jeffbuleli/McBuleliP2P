import { NextResponse } from "next/server";
import { subscribeOpsEvents } from "@/lib/ops/events";
import { requireOpsAuth } from "@/lib/ops/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireOpsAuth(req, { permission: "stream.subscribe" });
  if (auth instanceof NextResponse) return auth;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      send("connected", { ok: true, at: new Date().toISOString() });

      const unsub = subscribeOpsEvents((event, data) => {
        send(event, data);
      });

      const heartbeat = setInterval(() => {
        send("ping", { at: new Date().toISOString() });
      }, 25000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsub();
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
