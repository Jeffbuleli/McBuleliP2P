import { NextResponse } from "next/server";
import { confirmKinshasaSeat } from "@/lib/hackathon/quiz-kinshasa-grant";
import { sendKinshasaTicketAndOrientationEmail } from "@/lib/email/messages/hackathon";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let token = "";
  try {
    const body = (await req.json()) as { token?: string };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const result = await confirmKinshasaSeat(token);
  if (!result.ok) {
    const messages: Record<string, string> = {
      invalid_token: "Lien invalide.",
      not_found: "Lien introuvable ou déjà utilisé.",
      not_kinshasa: "Lien non valide pour la promo Kinshasa.",
      expired: "Le lien a expiré (24 h). Repassez le quiz si des places restent.",
    };
    return NextResponse.json(
      { error: result.error, message: messages[result.error] ?? result.error },
      { status: result.status },
    );
  }

  if (result.mode === "confirmed") {
    void sendKinshasaTicketAndOrientationEmail({
      registrationId: result.registrationId,
    });
  }

  return NextResponse.json({
    ok: true,
    mode: result.mode,
    ticketCode: result.ticketCode,
    email: result.email,
    firstName: result.firstName,
  });
}
