import { NextResponse } from "next/server";
import {
  CITIZEN_COOKIE,
  citizenCookieOptions,
} from "@/lib/citizen/token";
import {
  appBaseUrl,
  citizenTokensMatch,
} from "@/lib/channels/telegram-join";
import { getSession } from "@/lib/sessions/store";

/** Ouvre le même dossier que Telegram et pose le cookie citoyen. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("s")?.trim() ?? "";
  const key = url.searchParams.get("k")?.trim() ?? "";
  const session = id ? getSession(id) : null;
  const token = session?.citizenToken ?? "";
  if (!session || !token || !citizenTokensMatch(token, key)) {
    return NextResponse.redirect(`${appBaseUrl()}/`);
  }

  const dest = new URL(`${appBaseUrl()}/session/${session.id}`);
  if (session.locale) dest.searchParams.set("lang", session.locale);
  const res = NextResponse.redirect(dest);
  const secure =
    process.env.NODE_ENV === "production" || url.protocol === "https:";
  res.cookies.set(CITIZEN_COOKIE, token, citizenCookieOptions(secure));
  return res;
}
