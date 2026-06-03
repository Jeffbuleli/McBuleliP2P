import { NextResponse } from "next/server";
import { runAcademySessionReminders } from "@/lib/academy-reminders";
import { walletCronSecret } from "@/lib/usdt-wallet-features";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = req.headers.get("x-cron-secret") ?? "";
  if (!walletCronSecret() || secret !== walletCronSecret()) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  try {
    const out = await runAcademySessionReminders();
    return NextResponse.json({ ok: true, ...out });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    const hint = message.includes("academy_session_reminders")
      ? "Run drizzle migration 0058_academy_phase_c on the database."
      : undefined;
    console.error("[academy/reminders]", message);
    return NextResponse.json(
      { ok: false, error: "academy_reminders_failed", message, hint },
      { status: 500 },
    );
  }
}
