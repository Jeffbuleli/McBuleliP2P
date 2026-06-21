import { NextResponse } from "next/server";
import { runEventReminders } from "@/lib/events/reminders";
import { walletCronSecret } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const out = await runEventReminders();
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("[events/reminders]", message);
    return NextResponse.json({ ok: false, error: "event_reminders_failed", message }, { status: 500 });
  }
}
