import { NextResponse } from "next/server";
import { registerParticipant } from "@/lib/hackathon/actions";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  try {
    const result = await registerParticipant(json);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          message: "message" in result ? result.message : undefined,
          ticketCode: "ticketCode" in result ? result.ticketCode : undefined,
        },
        { status: result.status },
      );
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[hackathon/register]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
