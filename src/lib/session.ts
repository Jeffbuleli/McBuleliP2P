import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";
import { sessionCookieName, verifySessionTokenFull } from "./jwt";

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(sessionCookieName())?.value;
  if (!raw) return null;
  try {
    const { userId, sessionVersion } = await verifySessionTokenFull(raw);
    const db = getDb();
    const [row] = await db
      .select({ sessionVersion: users.sessionVersion })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!row || row.sessionVersion !== sessionVersion) return null;
    return userId;
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
