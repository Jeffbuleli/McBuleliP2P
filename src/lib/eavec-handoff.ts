import { SignJWT, jwtVerify } from "jose";
import { getJwtSecret } from "@/lib/env";

const PURPOSE = "eavec_sso";

export async function signEavecHandoffToken(userId: string): Promise<string> {
  const secret = new TextEncoder().encode(getJwtSecret());
  return new SignJWT({ sub: userId, purpose: PURPOSE })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("2m")
    .sign(secret);
}

export async function verifyEavecHandoffToken(
  token: string,
): Promise<{ userId: string }> {
  const secret = new TextEncoder().encode(getJwtSecret());
  const { payload } = await jwtVerify(token, secret, {
    algorithms: ["HS256"],
  });
  if (payload.purpose !== PURPOSE) {
    throw new Error("invalid_handoff");
  }
  const sub = payload.sub;
  if (!sub || typeof sub !== "string") {
    throw new Error("invalid_handoff");
  }
  return { userId: sub };
}
