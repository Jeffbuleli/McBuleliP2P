import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "./env";

const COOKIE_NAME = "mcbuleli_session";

export function sessionCookieName() {
  return COOKIE_NAME;
}

export async function signSessionToken(userId: string) {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  const secret = new TextEncoder().encode(getJwtSecret());
  const { payload } = await jwtVerify(token, secret);
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("Invalid session");
  }
  return sub;
}
