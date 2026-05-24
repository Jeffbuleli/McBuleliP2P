import { eq } from "drizzle-orm";
import { getDb, kycSessions } from "@/db";
import { diditWorkflowId } from "@/lib/didit/config";

const RESUMABLE = new Set(["Not Started", "In Progress", "Resubmitted"]);

export function isDiditSessionResumable(status: string | null | undefined): boolean {
  return RESUMABLE.has((status ?? "").trim());
}

export async function recordKycSessionCreated(args: {
  userId: string;
  diditSessionId: string;
  status: string;
  verificationUrl: string | null;
}): Promise<void> {
  const db = getDb();
  const wf = diditWorkflowId() || null;
  await db
    .insert(kycSessions)
    .values({
      userId: args.userId,
      diditSessionId: args.diditSessionId,
      status: args.status,
      workflowId: wf,
      verificationUrl: args.verificationUrl,
    })
    .onConflictDoUpdate({
      target: kycSessions.diditSessionId,
      set: {
        status: args.status,
        verificationUrl: args.verificationUrl,
      },
    });
}

export async function syncKycSessionStatus(args: {
  diditSessionId: string;
  status: string;
  rawDecision?: Record<string, unknown> | null;
  completed?: boolean;
}): Promise<void> {
  const db = getDb();
  const patch: Record<string, unknown> = { status: args.status };
  if (args.rawDecision) patch.rawDecision = args.rawDecision;
  if (args.completed) patch.completedAt = new Date();

  await db
    .update(kycSessions)
    .set(patch)
    .where(eq(kycSessions.diditSessionId, args.diditSessionId));
}

export async function getStoredVerificationUrl(
  diditSessionId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ verificationUrl: kycSessions.verificationUrl })
    .from(kycSessions)
    .where(eq(kycSessions.diditSessionId, diditSessionId))
    .limit(1);
  return row?.verificationUrl?.trim() || null;
}

export async function getKycSessionRowId(
  diditSessionId: string,
): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ id: kycSessions.id })
    .from(kycSessions)
    .where(eq(kycSessions.diditSessionId, diditSessionId))
    .limit(1);
  return row?.id ?? null;
}
