import { NextResponse } from "next/server";
import { gameErrorText } from "@/lib/game/game-messages";

export function gameErrorResponse(errorCode: string, status = 400) {
  return NextResponse.json(
    {
      message: gameErrorText(errorCode, false),
      messageFr: gameErrorText(errorCode, true),
      code: errorCode,
    },
    { status },
  );
}
