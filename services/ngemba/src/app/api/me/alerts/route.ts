import { NextResponse } from "next/server";
import {
  CITIZEN_COOKIE,
  citizenCookieOptions,
  newCitizenToken,
  readCitizenToken,
} from "@/lib/citizen/token";
import { statusLabelFr, urgencyLabelFr } from "@/lib/labels";
import { listSessionsByCitizen } from "@/lib/sessions/store";

export async function GET() {
  const token = await readCitizenToken();
  if (!token) {
    return NextResponse.json({ sessions: [], hasAccount: false });
  }

  const sessions = listSessionsByCitizen(token, 15).map((s) => ({
    id: s.id,
    status: s.status,
    statusLabel: statusLabelFr(s.status),
    urgency: s.urgency,
    urgencyLabel: urgencyLabelFr(s.urgency),
    createdAt: s.createdAt,
    locationLabel: s.locationLabel,
    messagePreview: s.message.slice(0, 80),
    mediaCount: s.media.length,
    chatCount: s.chatMessages.length,
  }));

  return NextResponse.json({ sessions, hasAccount: true });
}

export async function POST() {
  const token = newCitizenToken();
  const res = NextResponse.json({ ok: true, hasAccount: true });
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(CITIZEN_COOKIE, token, citizenCookieOptions(secure));
  return res;
}
