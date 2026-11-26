import type { AlertSessionRecord } from "@/lib/sessions/store";
import { readCitizenToken } from "@/lib/citizen/token";

/** Cookie HttpOnly ou en-tête X-Ngemba-Citizen (même valeur que session.citizenToken). */
export async function citizenCanAccessSession(
  req: Request,
  session: Pick<AlertSessionRecord, "citizenToken">,
): Promise<boolean> {
  const expected = session.citizenToken;
  if (!expected) return false;

  const fromCookie = await readCitizenToken();
  if (fromCookie && fromCookie === expected) return true;

  const header = req.headers.get("x-ngemba-citizen")?.trim() ?? "";
  return header.length > 8 && header === expected;
}