import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "./env";
import { sessionMaxAgeDaysLabel } from "./session-config";

const COOKIE_NAME = "mcbuleli_session";

export function sessionCookieName() {
  return COOKIE_NAME;
}

export async function signSessionToken(userId: string, sessionVersion = 0) {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ sub: userId, sv: sessionVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(sessionMaxAgeDaysLabel())
    .sign(secret);
}

export type VerifiedSession = {
  userId: string;
  sessionVersion: number;
};

export async function verifySessionToken(token: string): Promise<string> {
  const v = await verifySessionTokenFull(token);
  return v.userId;
}

export async function verifySessionTokenFull(
  token: string,
): Promise<VerifiedSession> {
  const secret = new TextEncoder().encode(getJwtSecret());
  const { payload } = await jwtVerify(token, secret);
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid session");
  }
  const sv = typeof payload.sv === "number" ? payload.sv : 0;
  return { userId: sub, sessionVersion: sv };
}
