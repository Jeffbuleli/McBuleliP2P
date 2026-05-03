import { cookies } from "next/headers";
import { sessionCookieName, verifySessionToken } from "./jwt";

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(sessionCookieName())?.value;
  if (!raw) return null;
  try {
    return await verifySessionToken(raw);
  } catch {
    return null;
  }
}

export async function requireUserId(): Promise<string> {
  const id = await getSessionUserId();
  if (!id) {
    throw new SessionError("Unauthorized");
  }
  return id;
}

export class SessionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SessionError";
  }
}
