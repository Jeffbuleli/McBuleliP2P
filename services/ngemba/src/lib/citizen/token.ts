import { randomUUID } from "crypto";
import { cookies } from "next/headers";

export const CITIZEN_COOKIE = "ngemba_citizen";

export async function readCitizenToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(CITIZEN_COOKIE)?.value ?? null;
}

export function newCitizenToken(): string {
  return randomUUID();
}

export function citizenCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    secure,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  };
}
