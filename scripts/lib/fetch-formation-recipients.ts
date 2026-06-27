/**
 * Fetch recipient emails for a formation community post reminder.
 */
import { and, eq, inArray, sql } from "drizzle-orm";
import {
  academyEditions,
  academyEnrollments,
  academyTrainingEventParticipants,
  academyTrainingEvents,
  getDb,
  trainingRegistrations,
  users,
} from "../../src/db";
import { ACADEMY_EDITION_JUNE_2026 } from "../../src/lib/academy-config";

const DEFAULT_POST_ID = "a66af481-eb44-4946-aa05-f7b942e0b9fd";

export type FormationRecipient = {
  email: string;
  firstName: string | null;
};

export async function fetchFormationPostRecipients(
  postId = DEFAULT_POST_ID,
): Promise<FormationRecipient[]> {
  const db = getDb();
  const byEmail = new Map<string, FormationRecipient>();

  function add(email: string | null | undefined, firstName: string | null | undefined) {
    const normalized = email?.trim().toLowerCase();
    if (!normalized || !normalized.includes("@")) return;
    if (!byEmail.has(normalized)) {
      byEmail.set(normalized, {
        email: normalized,
        firstName: firstName?.trim() || null,
      });
    }
  }

  try {
    const [event] = await db
      .select({
        id: academyTrainingEvents.id,
        editionId: academyTrainingEvents.editionId,
      })
      .from(academyTrainingEvents)
      .where(eq(academyTrainingEvents.communityPostId, postId))
      .limit(1);

    if (event) {
      const participants = await db
        .select({
          email: users.email,
          displayName: users.displayName,
          legalFirstName: users.legalFirstName,
        })
        .from(academyTrainingEventParticipants)
        .innerJoin(users, eq(academyTrainingEventParticipants.userId, users.id))
        .where(
          and(
            eq(academyTrainingEventParticipants.eventId, event.id),
            inArray(academyTrainingEventParticipants.participantStatus, [
              "ENROLLED",
              "ATTENDED",
              "INVITED",
            ]),
          ),
        );

      for (const p of participants) {
        add(p.email, p.legalFirstName ?? p.displayName);
      }

      if (event.editionId) {
        const editionMembers = await db
          .select({
            email: users.email,
            displayName: users.displayName,
            legalFirstName: users.legalFirstName,
          })
          .from(academyEnrollments)
          .innerJoin(users, eq(academyEnrollments.userId, users.id))
          .where(
            and(
              eq(academyEnrollments.editionId, event.editionId),
              eq(academyEnrollments.status, "active"),
            ),
          );

        for (const m of editionMembers) {
          add(m.email, m.legalFirstName ?? m.displayName);
        }
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (!msg.includes("academy_training_events") && !msg.includes("does not exist")) {
      throw e;
    }
    console.warn("[formation-recipients] academy_training_events unavailable — using fallbacks");
  }

  const [launchEdition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .where(eq(academyEditions.slug, ACADEMY_EDITION_JUNE_2026))
    .limit(1);

  if (launchEdition) {
    const cohort = await db
      .select({
        email: users.email,
        displayName: users.displayName,
        legalFirstName: users.legalFirstName,
      })
      .from(academyEnrollments)
      .innerJoin(users, eq(academyEnrollments.userId, users.id))
      .where(
        and(
          eq(academyEnrollments.editionId, launchEdition.id),
          eq(academyEnrollments.status, "active"),
        ),
      );

    for (const m of cohort) {
      add(m.email, m.legalFirstName ?? m.displayName);
    }
  }

  const regs = await db
    .select({
      email: trainingRegistrations.email,
      fullName: trainingRegistrations.fullName,
    })
    .from(trainingRegistrations)
    .where(sql`${trainingRegistrations.createdAt} >= now() - interval '90 days'`);

  for (const r of regs) {
    const first = r.fullName?.trim().split(/\s+/)[0] ?? null;
    add(r.email, first);
  }

  return [...byEmail.values()];
}
