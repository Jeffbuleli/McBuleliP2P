import { NextResponse } from "next/server";
import { submitPartner } from "@/lib/hackathon/actions";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  try {
    const result = await submitPartner(json);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json(result);
  } catch (e) {
    console.error("[hackathon/partner]", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
