import { NextResponse } from "next/server";
import { payReservedRegistration } from "@/lib/hackathon/actions";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const json = await req.json().catch(() => null);
  try {
    const result = await payReservedRegistration(token, json);
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
    console.error("[hackathon/pay]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
