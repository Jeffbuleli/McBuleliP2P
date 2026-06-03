import { randomBytes, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import {
  academyAttendance,
  academyCredentials,
  academyEditions,
  academyEnrollments,
  academyPrograms,
  academyQuizAttempts,
  academyQuizQuestions,
  academyQuizzes,
  academySessions,
  getDb,
  trainingRegistrations,
  users,
} from "@/db";
import {
  ACADEMY_CHECKIN_WINDOW_MIN,
  ACADEMY_EDITION_JUNE_2026,
  ACADEMY_PROGRAM_LAUNCH,
} from "@/lib/academy-config";
import { ensureAcademyLaunchSeed } from "@/lib/academy-seed";
import { isKycApproved } from "@/lib/kyc-policy";
import { tryGrantRewardPoints } from "@/lib/reward-points-service";
import { REWARD_GRANT } from "@/lib/reward-points-config";
import { insertWalletLedgerLines } from "@/lib/wallet-ledger";
import { fmtWalletAmount, numFromNumeric } from "@/lib/wallet-types";
import type { Locale } from "@/i18n/locale";
import {
  buildLiveJoinUrl,
  getLivePhase,
  isSessionEnded,
  isSessionLiveNow,
  liveSessionRemainingSec,
  setupEndsAtIso,
  type LivePhase,
} from "@/lib/academy-live";
import type { AcademyLiveRole } from "@/lib/academy-live-role";
import { logAcademyLearningEvent } from "@/lib/academy-learning-events";
import { assertAcademyDbReady } from "@/lib/academy-db-ready";
import { assertEnrolledInEdition } from "@/lib/academy-cohort-messaging";
import {
  canonicalEmailForDedup,
  normalizeAuthEmail,
} from "@/lib/auth/email-normalize";
import { createUserNotification } from "@/lib/notifications-service";

export type AcademyProgramView = {
  id: string;
  slug: string;
  level: string;
  priceUsdt: string | null;
  title: string;
  summary: string | null;
  topics: string[];
  requiresKyc: boolean;
};

export type AcademyEditionView = {
  id: string;
  slug: string;
  programSlug: string;
  title: string;
  deliveryMode: string;
  status: string;
  startsAt: string | null;
  endsAt: string | null;
  enrolled: boolean;
  enrollmentId: string | null;
};

export type AcademySessionView = {
  id: string;
  slug: string;
  title: string;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  liveUrl: string | null;
  liveJoinUrl: string;
  liveJoinUrlHost: string;
  liveJoinUrlAudio: string;
  remainingSec: number;
  remainingKind: "until_start" | "until_end" | "ended";
  isLiveNow: boolean;
  livePhase: LivePhase;
  setupEndsAt: string | null;
  replayUrl: string | null;
  hasReplay: boolean;
  checkedIn: boolean;
  canCheckIn: boolean;
};

export type AcademyCredentialView = {
  id: string;
  kind: string;
  slug: string;
  title: string;
  verifyCode: string;
  issuedAt: string;
  revoked: boolean;
};

function pickLocale<T extends { titleFr: string; titleEn: string }>(
  row: T,
  locale: Locale,
): string {
  return locale === "fr" ? row.titleFr : row.titleEn;
}

function verifyCode(): string {
  return randomBytes(12).toString("base64url").slice(0, 16);
}

export async function linkTrainingRegistrationToUser(args: {
  userId: string;
  email: string;
}): Promise<void> {
  const db = getDb();
  const canonical = canonicalEmailForDedup(normalizeAuthEmail(args.email));
  const regs = await db
    .select({
      id: trainingRegistrations.id,
      email: trainingRegistrations.email,
    })
    .from(trainingRegistrations)
    .where(isNull(trainingRegistrations.userId));
  const now = new Date();
  for (const r of regs) {
    if (canonicalEmailForDedup(normalizeAuthEmail(r.email)) !== canonical) {
      continue;
    }
    await db
      .update(trainingRegistrations)
      .set({ userId: args.userId, linkedAt: now })
      .where(eq(trainingRegistrations.id, r.id));
  }
}

export type AcademyViewerRole = "learner" | "staff";

export type AcademyFormationLead = {
  registeredOnFormation: boolean;
  enrolledInLaunch: boolean;
  fullName: string | null;
};

export async function getFormationLeadForUser(
  userId: string,
): Promise<AcademyFormationLead> {
  const db = getDb();
  const [user] = await db
    .select({ email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user?.email) {
    return {
      registeredOnFormation: false,
      enrolledInLaunch: false,
      fullName: null,
    };
  }

  const canonical = canonicalEmailForDedup(normalizeAuthEmail(user.email));
  const regs = await db
    .select({
      id: trainingRegistrations.id,
      email: trainingRegistrations.email,
      fullName: trainingRegistrations.fullName,
    })
    .from(trainingRegistrations);

  const reg = regs.find(
    (r) => canonicalEmailForDedup(normalizeAuthEmail(r.email)) === canonical,
  );

  const editionId = await launchEditionId();
  let enrolledInLaunch = false;
  if (editionId) {
    const [en] = await db
      .select({ id: academyEnrollments.id })
      .from(academyEnrollments)
      .where(
        and(
          eq(academyEnrollments.userId, userId),
          eq(academyEnrollments.editionId, editionId),
          eq(academyEnrollments.status, "active"),
        ),
      )
      .limit(1);
    enrolledInLaunch = !!en;
  }

  return {
    registeredOnFormation: !!reg,
    enrolledInLaunch,
    fullName: reg?.fullName ?? null,
  };
}

export async function getAcademyHub(args: {
  userId: string;
  locale: Locale;
  viewerRole?: AcademyViewerRole;
}): Promise<{
  viewer: AcademyViewerRole;
  formationLead: AcademyFormationLead;
  programs: AcademyProgramView[];
  editions: AcademyEditionView[];
  credentials: AcademyCredentialView[];
}> {
  await assertAcademyDbReady();
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const locale = args.locale;

  const programs = await db
    .select()
    .from(academyPrograms)
    .where(eq(academyPrograms.published, true))
    .orderBy(asc(academyPrograms.sortOrder));

  const editions = await db
    .select({
      edition: academyEditions,
      programSlug: academyPrograms.slug,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(inArray(academyEditions.status, ["open", "active"]))
    .orderBy(asc(academyEditions.startsAt));

  const enrollments = await db
    .select({
      editionId: academyEnrollments.editionId,
      id: academyEnrollments.id,
    })
    .from(academyEnrollments)
    .where(eq(academyEnrollments.userId, args.userId));

  const enrollMap = new Map(
    enrollments.map((e) => [e.editionId, e.id] as const),
  );

  const creds = await db
    .select()
    .from(academyCredentials)
    .where(eq(academyCredentials.userId, args.userId))
    .orderBy(desc(academyCredentials.issuedAt));

  const formationLead = await getFormationLeadForUser(args.userId);
  const viewer = args.viewerRole ?? "learner";

  return {
    viewer,
    formationLead,
    programs: programs.map((p) => ({
      id: p.id,
      slug: p.slug,
      level: p.level,
      priceUsdt: p.priceUsdt?.toString() ?? null,
      title: pickLocale(p, locale),
      summary: locale === "fr" ? p.summaryFr : p.summaryEn,
      topics: p.topics ?? [],
      requiresKyc: p.requiresKyc,
    })),
    editions: editions.map(({ edition: e, programSlug }) => ({
      id: e.id,
      slug: e.slug,
      programSlug,
      title: pickLocale(e, locale),
      deliveryMode: e.deliveryMode,
      status: e.status,
      startsAt: e.startsAt?.toISOString() ?? null,
      endsAt: e.endsAt?.toISOString() ?? null,
      enrolled: enrollMap.has(e.id),
      enrollmentId: enrollMap.get(e.id) ?? null,
    })),
    credentials: creds.map((c) => ({
      id: c.id,
      kind: c.kind,
      slug: c.slug,
      title: pickLocale(c, locale),
      verifyCode: c.verifyCode,
      issuedAt: c.issuedAt.toISOString(),
      revoked: c.revokedAt != null,
    })),
  };
}

export async function getEditionDetail(args: {
  userId: string;
  editionSlug: string;
  programSlug?: string;
  locale: Locale;
  viewerLiveRole?: AcademyLiveRole;
}): Promise<
  | {
      edition: AcademyEditionView & { tutorEnabled: boolean };
      program: AcademyProgramView;
      liveRole: AcademyLiveRole;
      sessions: AcademySessionView[];
      quizzes: { id: string; slug: string; title: string; attemptsUsed: number; maxAttempts: number; bestScore: number | null; passed: boolean }[];
    }
  | null
> {
  await ensureAcademyLaunchSeed();
  const db = getDb();

  const [row] = await db
    .select({
      edition: academyEditions,
      program: academyPrograms,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.programSlug
        ? and(
            eq(academyEditions.slug, args.editionSlug),
            eq(academyPrograms.slug, args.programSlug),
          )
        : eq(academyEditions.slug, args.editionSlug),
    )
    .limit(1);

  if (!row) return null;

  const [enrollment] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, row.edition.id),
      ),
    )
    .limit(1);

  const sessions = await db
    .select()
    .from(academySessions)
    .where(eq(academySessions.editionId, row.edition.id))
    .orderBy(asc(academySessions.sortOrder), asc(academySessions.startsAt));

  const attendanceRows = enrollment
    ? await db
        .select({ sessionId: academyAttendance.sessionId })
        .from(academyAttendance)
        .where(eq(academyAttendance.enrollmentId, enrollment.id))
    : [];

  const attended = new Set(attendanceRows.map((a) => a.sessionId));
  const now = Date.now();
  const winMs = ACADEMY_CHECKIN_WINDOW_MIN * 60 * 1000;

  const editionSlug = row.edition.slug;
  const liveBaseUrl = row.edition.liveBaseUrl ?? null;

  const sessionViews: AcademySessionView[] = sessions.map((s) => {
    const start = s.startsAt.getTime();
    const end = s.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
    const canCheckIn =
      !!enrollment &&
      now >= start - winMs &&
      now <= end + winMs &&
      !attended.has(s.id);
    const liveNow = isSessionLiveNow({
      startsAt: s.startsAt,
      endsAt: s.endsAt,
    });
    const ended = isSessionEnded({ startsAt: s.startsAt, endsAt: s.endsAt });
    const livePhase = getLivePhase({ startsAt: s.startsAt, endsAt: s.endsAt });
    const replayUrl = s.replayUrl?.trim() || null;
    const joinBase = {
      editionSlug,
      sessionSlug: s.slug,
      sessionLiveUrl: s.liveUrl,
      liveBaseUrl,
    };
    const remaining = liveSessionRemainingSec({
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      now,
    });
    return {
      id: s.id,
      slug: s.slug,
      title: pickLocale(s, args.locale),
      kind: s.kind,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt?.toISOString() ?? null,
      liveUrl: s.liveUrl,
      liveJoinUrl: buildLiveJoinUrl({ ...joinBase, mode: "learner" }),
      liveJoinUrlHost: buildLiveJoinUrl({ ...joinBase, mode: "host" }),
      liveJoinUrlAudio: buildLiveJoinUrl({ ...joinBase, mode: "audio" }),
      remainingSec: remaining.seconds,
      remainingKind: remaining.kind,
      isLiveNow: liveNow,
      livePhase,
      setupEndsAt: setupEndsAtIso(s.startsAt),
      replayUrl: ended ? replayUrl : null,
      hasReplay: ended && !!replayUrl,
      checkedIn: attended.has(s.id),
      canCheckIn,
    };
  });

  const quizzes = await db
    .select()
    .from(academyQuizzes)
    .where(eq(academyQuizzes.editionId, row.edition.id));

  const quizViews = await Promise.all(
    quizzes.map(async (q) => {
      const attempts = await db
        .select({
          scorePercent: academyQuizAttempts.scorePercent,
          passed: academyQuizAttempts.passed,
        })
        .from(academyQuizAttempts)
        .where(
          and(
            eq(academyQuizAttempts.quizId, q.id),
            eq(academyQuizAttempts.userId, args.userId),
          ),
        )
        .orderBy(desc(academyQuizAttempts.createdAt));

      const best = attempts.reduce<number | null>((acc, a) => {
        if (acc == null || a.scorePercent > acc) return a.scorePercent;
        return acc;
      }, null);

      return {
        id: q.id,
        slug: q.slug,
        title: pickLocale(q, args.locale),
        attemptsUsed: attempts.length,
        maxAttempts: q.maxAttempts,
        bestScore: best,
        passed: attempts.some((a) => a.passed),
      };
    }),
  );

  const liveRole = args.viewerLiveRole ?? "learner";

  return {
    liveRole,
    edition: {
      id: row.edition.id,
      slug: row.edition.slug,
      programSlug: row.program.slug,
      title: pickLocale(row.edition, args.locale),
      deliveryMode: row.edition.deliveryMode,
      status: row.edition.status,
      startsAt: row.edition.startsAt?.toISOString() ?? null,
      endsAt: row.edition.endsAt?.toISOString() ?? null,
      enrolled: !!enrollment,
      enrollmentId: enrollment?.id ?? null,
      tutorEnabled: row.edition.tutorEnabled,
    },
    program: {
      id: row.program.id,
      slug: row.program.slug,
      level: row.program.level,
      priceUsdt: row.program.priceUsdt?.toString() ?? null,
      title: pickLocale(row.program, args.locale),
      summary: args.locale === "fr" ? row.program.summaryFr : row.program.summaryEn,
      topics: row.program.topics ?? [],
      requiresKyc: row.program.requiresKyc,
    },
    sessions: sessionViews,
    quizzes: quizViews,
  };
}

export async function enrollInEdition(args: {
  userId: string;
  editionSlug: string;
  programSlug?: string;
}): Promise<
  | { ok: true; enrollmentId: string; alreadyEnrolled: boolean }
  | { ok: false; code: string }
> {
  await ensureAcademyLaunchSeed();
  const db = getDb();

  const detail = await getEditionDetail({
    userId: args.userId,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
    locale: "fr",
  });
  if (!detail) return { ok: false, code: "academy_edition_not_found" };
  if (!["open", "active"].includes(detail.edition.status)) {
    return { ok: false, code: "academy_edition_closed" };
  }
  if (detail.edition.enrolled && detail.edition.enrollmentId) {
    return {
      ok: true,
      enrollmentId: detail.edition.enrollmentId,
      alreadyEnrolled: true,
    };
  }

  if (detail.program.requiresKyc) {
    const [u] = await db
      .select({ kycStatus: users.kycStatus })
      .from(users)
      .where(eq(users.id, args.userId))
      .limit(1);
    if (!isKycApproved(u?.kycStatus)) {
      return { ok: false, code: "academy_kyc_required" };
    }
  }

  const priceNum = detail.program.priceUsdt
    ? numFromNumeric(detail.program.priceUsdt)
    : 0;

  try {
    const enrollmentId = await db.transaction(async (tx) => {
      if (priceNum > 0) {
        const priceStr = fmtWalletAmount(priceNum);
        const [deducted] = await tx
          .update(users)
          .set({
            balance: sql`${users.balance} - ${priceStr}::numeric`,
          })
          .where(
            and(
              eq(users.id, args.userId),
              sql`${users.balance} >= ${priceStr}::numeric`,
            ),
          )
          .returning({ id: users.id });
        if (!deducted) throw new Error("academy_insufficient_balance");

        const paymentRef = randomUUID();
        await insertWalletLedgerLines(tx, [
          {
            batchId: randomUUID(),
            userId: args.userId,
            entryType: "academy_enrollment",
            asset: "USDT",
            amount: `-${priceStr}`,
            meta: {
              editionId: detail.edition.id,
              programSlug: detail.program.slug,
              paymentRef,
            },
          },
        ]);

        const [row] = await tx
          .insert(academyEnrollments)
          .values({
            userId: args.userId,
            editionId: detail.edition.id,
            status: "active",
            paidUsdt: priceStr,
            paymentRef,
          })
          .returning({ id: academyEnrollments.id });
        return row.id;
      }

      const [row] = await tx
        .insert(academyEnrollments)
        .values({
          userId: args.userId,
          editionId: detail.edition.id,
          status: "active",
          paidUsdt: "0",
        })
        .returning({ id: academyEnrollments.id });
      return row.id;
    });

    await tryGrantRewardPoints({
      userId: args.userId,
      grantType: REWARD_GRANT.TRAINING_ENROLLED,
      idempotencyKey: `training_enrolled:${detail.edition.id}`,
      meta: { editionSlug: detail.edition.slug },
    });

    await logAcademyLearningEvent({
      userId: args.userId,
      editionId: detail.edition.id,
      verb: "enrolled",
      objectType: "edition",
      objectId: detail.edition.slug,
    });

    return { ok: true, enrollmentId, alreadyEnrolled: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg === "academy_insufficient_balance") {
      return { ok: false, code: "academy_insufficient_balance" };
    }
    return { ok: false, code: "academy_enroll_failed" };
  }
}

export async function checkInSession(args: {
  userId: string;
  sessionId: string;
}): Promise<
  | { ok: true; grantedBp: number }
  | { ok: false; code: string }
> {
  const db = getDb();
  const [session] = await db
    .select()
    .from(academySessions)
    .where(eq(academySessions.id, args.sessionId))
    .limit(1);
  if (!session) return { ok: false, code: "academy_session_not_found" };

  const [enrollment] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, session.editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);
  if (!enrollment) return { ok: false, code: "academy_not_enrolled" };

  const now = Date.now();
  const start = session.startsAt.getTime();
  const end = session.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
  const winMs = ACADEMY_CHECKIN_WINDOW_MIN * 60 * 1000;
  if (now < start - winMs || now > end + winMs) {
    return { ok: false, code: "academy_checkin_window_closed" };
  }

  const [existing] = await db
    .select({ id: academyAttendance.id })
    .from(academyAttendance)
    .where(
      and(
        eq(academyAttendance.enrollmentId, enrollment.id),
        eq(academyAttendance.sessionId, session.id),
      ),
    )
    .limit(1);
  if (existing) {
    return { ok: true, grantedBp: 0 };
  }

  await db.insert(academyAttendance).values({
    enrollmentId: enrollment.id,
    sessionId: session.id,
    userId: args.userId,
    method: "live_button",
  });

  const grant = await tryGrantRewardPoints({
    userId: args.userId,
    grantType: REWARD_GRANT.TRAINING_SESSION_ATTENDED,
    idempotencyKey: `training_session:${session.id}`,
    meta: { sessionSlug: session.slug },
  });

  const attendanceCount = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(academyAttendance)
    .where(eq(academyAttendance.enrollmentId, enrollment.id));

  const count = attendanceCount[0]?.n ?? 0;
  if (count >= 2) {
    await issueCredentialIfMissing({
      userId: args.userId,
      editionId: session.editionId,
      slug: "participant-assidu",
      kind: "badge",
      titleFr: "Participant assidu — McBuleli Academy",
      titleEn: "Active participant — McBuleli Academy",
    });
  }

  return { ok: true, grantedBp: grant.granted ? grant.points : 0 };
}

export async function getQuizForUser(args: {
  userId: string;
  quizSlug: string;
  editionSlug: string;
  locale: Locale;
}): Promise<
  | {
      quiz: { id: string; slug: string; title: string; passPercent: number; maxAttempts: number; attemptsUsed: number };
      questions: { id: string; prompt: string; options: string[] }[];
    }
  | null
> {
  await ensureAcademyLaunchSeed();
  const db = getDb();

  const [row] = await db
    .select({ quiz: academyQuizzes, editionId: academyEditions.id })
    .from(academyQuizzes)
    .innerJoin(academyEditions, eq(academyQuizzes.editionId, academyEditions.id))
    .where(
      and(
        eq(academyQuizzes.slug, args.quizSlug),
        eq(academyEditions.slug, args.editionSlug),
      ),
    )
    .limit(1);
  if (!row) return null;

  const [enrollment] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, row.editionId),
      ),
    )
    .limit(1);
  if (!enrollment) return null;

  const questions = await db
    .select()
    .from(academyQuizQuestions)
    .where(eq(academyQuizQuestions.quizId, row.quiz.id))
    .orderBy(asc(academyQuizQuestions.sortOrder));

  const attempts = await db
    .select({ id: academyQuizAttempts.id })
    .from(academyQuizAttempts)
    .where(
      and(
        eq(academyQuizAttempts.quizId, row.quiz.id),
        eq(academyQuizAttempts.userId, args.userId),
      ),
    );

  return {
    quiz: {
      id: row.quiz.id,
      slug: row.quiz.slug,
      title: pickLocale(row.quiz, args.locale),
      passPercent: row.quiz.passPercent,
      maxAttempts: row.quiz.maxAttempts,
      attemptsUsed: attempts.length,
    },
    questions: questions.map((q) => ({
      id: q.id,
      prompt: args.locale === "fr" ? q.promptFr : q.promptEn,
      options: args.locale === "fr" ? q.optionsFr : q.optionsEn,
    })),
  };
}

export async function submitQuizAttempt(args: {
  userId: string;
  quizSlug: string;
  editionSlug: string;
  answers: { questionId: string; choiceIndex: number }[];
}): Promise<
  | { ok: true; scorePercent: number; passed: boolean; grantedBp: number }
  | { ok: false; code: string }
> {
  const db = getDb();
  const quizData = await getQuizForUser({
    userId: args.userId,
    quizSlug: args.quizSlug,
    editionSlug: args.editionSlug,
    locale: "fr",
  });
  if (!quizData) return { ok: false, code: "academy_quiz_not_found" };
  if (quizData.quiz.attemptsUsed >= quizData.quiz.maxAttempts) {
    return { ok: false, code: "academy_quiz_max_attempts" };
  }

  const questions = await db
    .select()
    .from(academyQuizQuestions)
    .where(eq(academyQuizQuestions.quizId, quizData.quiz.id));

  const answerMap = new Map(
    args.answers.map((a) => [a.questionId, a.choiceIndex] as const),
  );
  let correct = 0;
  const storedAnswers: number[] = [];
  for (const q of questions) {
    const chosen = answerMap.get(q.id) ?? -1;
    storedAnswers.push(chosen);
    if (chosen === q.correctIndex) correct += 1;
  }
  const total = questions.length || 1;
  const scorePercent = Math.round((correct / total) * 100);
  const passed = scorePercent >= quizData.quiz.passPercent;

  await db.insert(academyQuizAttempts).values({
    quizId: quizData.quiz.id,
    userId: args.userId,
    scorePercent,
    passed,
    answers: storedAnswers,
  });

  let grantedBp = 0;
  if (passed) {
    const grant = await tryGrantRewardPoints({
      userId: args.userId,
      grantType: REWARD_GRANT.TRAINING_QUIZ_PASSED,
      idempotencyKey: `training_quiz:${quizData.quiz.id}`,
      meta: { scorePercent },
    });
    grantedBp = grant.granted ? grant.points : 0;

    const [quizRow] = await db
      .select({ editionId: academyQuizzes.editionId })
      .from(academyQuizzes)
      .where(eq(academyQuizzes.id, quizData.quiz.id))
      .limit(1);

    if (quizRow) {
      await issueCredentialIfMissing({
        userId: args.userId,
        editionId: quizRow.editionId,
        slug: "quiz-fondamentaux",
        kind: "badge",
        titleFr: "Quiz fondamentaux validé",
        titleEn: "Fundamentals quiz passed",
      });
      await logAcademyLearningEvent({
        userId: args.userId,
        editionId: quizRow.editionId,
        verb: "quiz_passed",
        objectType: "quiz",
        objectId: args.quizSlug,
        meta: { scorePercent },
      });
    }
  }

  return { ok: true, scorePercent, passed, grantedBp };
}

async function issueCredentialIfMissing(args: {
  userId: string;
  editionId: string;
  slug: string;
  kind: string;
  titleFr: string;
  titleEn: string;
}): Promise<void> {
  const db = getDb();
  const [existing] = await db
    .select({ id: academyCredentials.id })
    .from(academyCredentials)
    .where(
      and(
        eq(academyCredentials.userId, args.userId),
        eq(academyCredentials.editionId, args.editionId),
        eq(academyCredentials.slug, args.slug),
      ),
    )
    .limit(1);
  if (existing) return;

  const [edition] = await db
    .select({ programId: academyEditions.programId })
    .from(academyEditions)
    .where(eq(academyEditions.id, args.editionId))
    .limit(1);

  const code = verifyCode();
  await db.insert(academyCredentials).values({
    userId: args.userId,
    programId: edition?.programId ?? null,
    editionId: args.editionId,
    kind: args.kind,
    slug: args.slug,
    titleFr: args.titleFr,
    titleEn: args.titleEn,
    verifyCode: code,
  });

  await logAcademyLearningEvent({
    userId: args.userId,
    editionId: args.editionId,
    verb: "credential_issued",
    objectType: "credential",
    objectId: args.slug,
    meta: { verifyCode: code },
  });
}

export async function logReplayView(args: {
  userId: string;
  sessionId: string;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [session] = await db
    .select({
      id: academySessions.id,
      slug: academySessions.slug,
      editionId: academySessions.editionId,
      replayUrl: academySessions.replayUrl,
      startsAt: academySessions.startsAt,
      endsAt: academySessions.endsAt,
    })
    .from(academySessions)
    .where(eq(academySessions.id, args.sessionId))
    .limit(1);
  if (!session) return { ok: false, code: "academy_session_not_found" };

  const [enrollment] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, args.userId),
        eq(academyEnrollments.editionId, session.editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);
  if (!enrollment) return { ok: false, code: "academy_not_enrolled" };

  if (!isSessionEnded({ startsAt: session.startsAt, endsAt: session.endsAt })) {
    return { ok: false, code: "academy_replay_not_ready" };
  }
  if (!session.replayUrl?.trim()) {
    return { ok: false, code: "academy_replay_unavailable" };
  }

  await logAcademyLearningEvent({
    userId: args.userId,
    editionId: session.editionId,
    verb: "replay_viewed",
    objectType: "session",
    objectId: session.slug,
  });

  return { ok: true };
}

export async function getCredentialByVerifyCode(
  code: string,
  locale: Locale,
): Promise<{
  valid: boolean;
  title: string;
  kind: string;
  issuedAt: string;
  holderDisplay: string;
} | null> {
  const db = getDb();
  const [row] = await db
    .select({
      cred: academyCredentials,
      displayName: users.displayName,
      email: users.email,
    })
    .from(academyCredentials)
    .innerJoin(users, eq(academyCredentials.userId, users.id))
    .where(eq(academyCredentials.verifyCode, code.trim()))
    .limit(1);
  if (!row) return null;
  if (row.cred.revokedAt) {
    return {
      valid: false,
      title: pickLocale(row.cred, locale),
      kind: row.cred.kind,
      issuedAt: row.cred.issuedAt.toISOString(),
      holderDisplay: row.displayName?.trim() || row.email.split("@")[0] || "—",
    };
  }
  return {
    valid: true,
    title: pickLocale(row.cred, locale),
    kind: row.cred.kind,
    issuedAt: row.cred.issuedAt.toISOString(),
    holderDisplay: row.displayName?.trim() || row.email.split("@")[0] || "—",
  };
}

/** Auto-enroll launch cohort after linking registration. */
export async function autoEnrollLaunchCohort(userId: string): Promise<void> {
  await ensureAcademyLaunchSeed();
  await enrollInEdition({
    userId,
    editionSlug: ACADEMY_EDITION_JUNE_2026,
    programSlug: ACADEMY_PROGRAM_LAUNCH,
  }).catch(() => undefined);
}

export async function listAdminAcademyOverview(): Promise<{
  formation: FormationOpsStats;
  editions: {
    id: string;
    slug: string;
    programSlug: string;
    titleFr: string;
    status: string;
    enrollmentCount: number;
    formationRegistrations: number | null;
  }[];
}> {
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const rows = await db
    .select({
      id: academyEditions.id,
      slug: academyEditions.slug,
      titleFr: academyEditions.titleFr,
      status: academyEditions.status,
      programSlug: academyPrograms.slug,
    })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .orderBy(asc(academyEditions.startsAt));

  const counts = await db
    .select({
      editionId: academyEnrollments.editionId,
      n: sql<number>`count(*)::int`,
    })
    .from(academyEnrollments)
    .groupBy(academyEnrollments.editionId);

  const countMap = new Map(counts.map((c) => [c.editionId, c.n]));
  const formation = await getFormationOpsStats();

  return {
    formation,
    editions: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      programSlug: r.programSlug,
      titleFr: r.titleFr,
      status: r.status,
      enrollmentCount: countMap.get(r.id) ?? 0,
      formationRegistrations:
        r.slug === ACADEMY_EDITION_JUNE_2026 &&
        r.programSlug === ACADEMY_PROGRAM_LAUNCH
          ? formation.formationTotal
          : null,
    })),
  };
}

export async function listAdminEditionEnrollments(args: {
  editionSlug: string;
  limit: number;
  offset: number;
}): Promise<{
  rows: {
    id: string;
    email: string;
    displayName: string | null;
    enrolledAt: string;
    paidUsdt: string;
    status: string;
  }[];
  total: number;
}> {
  const db = getDb();
  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .where(eq(academyEditions.slug, args.editionSlug))
    .limit(1);
  if (!edition) return { rows: [], total: 0 };

  const rows = await db
    .select({
      id: academyEnrollments.id,
      email: users.email,
      displayName: users.displayName,
      enrolledAt: academyEnrollments.enrolledAt,
      paidUsdt: academyEnrollments.paidUsdt,
      status: academyEnrollments.status,
    })
    .from(academyEnrollments)
    .innerJoin(users, eq(academyEnrollments.userId, users.id))
    .where(eq(academyEnrollments.editionId, edition.id))
    .orderBy(desc(academyEnrollments.enrolledAt))
    .limit(args.limit)
    .offset(args.offset);

  const [countRow] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(academyEnrollments)
    .where(eq(academyEnrollments.editionId, edition.id));

  return {
    rows: rows.map((r) => ({
      id: r.id,
      email: r.email,
      displayName: r.displayName,
      enrolledAt: r.enrolledAt.toISOString(),
      paidUsdt: r.paidUsdt.toString(),
      status: r.status,
    })),
    total: countRow?.n ?? 0,
  };
}

export async function listAdminEditionSessions(editionSlug: string): Promise<{
  editionSlug: string;
  sessions: {
    id: string;
    slug: string;
    titleFr: string;
    startsAt: string;
    liveUrl: string | null;
    replayUrl: string | null;
    replayPublishedAt: string | null;
  }[];
}> {
  const db = getDb();
  const [edition] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .where(eq(academyEditions.slug, editionSlug))
    .limit(1);
  if (!edition) return { editionSlug, sessions: [] };

  const rows = await db
    .select({
      id: academySessions.id,
      slug: academySessions.slug,
      titleFr: academySessions.titleFr,
      startsAt: academySessions.startsAt,
      liveUrl: academySessions.liveUrl,
      replayUrl: academySessions.replayUrl,
      replayPublishedAt: academySessions.replayPublishedAt,
    })
    .from(academySessions)
    .where(eq(academySessions.editionId, edition.id))
    .orderBy(asc(academySessions.sortOrder), asc(academySessions.startsAt));

  return {
    editionSlug,
    sessions: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      titleFr: r.titleFr,
      startsAt: r.startsAt.toISOString(),
      liveUrl: r.liveUrl,
      replayUrl: r.replayUrl,
      replayPublishedAt: r.replayPublishedAt?.toISOString() ?? null,
    })),
  };
}

export async function updateAdminSession(args: {
  sessionId: string;
  liveUrl?: string | null;
  replayUrl?: string | null;
}): Promise<{ ok: true } | { ok: false; code: string }> {
  const db = getDb();
  const [session] = await db
    .select({ id: academySessions.id })
    .from(academySessions)
    .where(eq(academySessions.id, args.sessionId))
    .limit(1);
  if (!session) return { ok: false, code: "academy_session_not_found" };

  const patch: {
    liveUrl?: string | null;
    replayUrl?: string | null;
    replayPublishedAt?: Date | null;
  } = {};

  if (args.liveUrl !== undefined) {
    patch.liveUrl = args.liveUrl?.trim() || null;
  }
  if (args.replayUrl !== undefined) {
    const replay = args.replayUrl?.trim() || null;
    patch.replayUrl = replay;
    patch.replayPublishedAt = replay ? new Date() : null;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, code: "academy_nothing_to_update" };
  }

  await db
    .update(academySessions)
    .set(patch)
    .where(eq(academySessions.id, args.sessionId));

  return { ok: true };
}

/** Enrolled member invites another McBuleli user to the cohort (free → auto-enroll). */
export async function inviteUserToEdition(args: {
  inviterUserId: string;
  editionSlug: string;
  programSlug?: string;
  inviteeEmail: string;
}): Promise<
  | { ok: true; outcome: "enrolled" | "notified" | "already_enrolled" }
  | { ok: false; code: string }
> {
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const editionRows = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      args.programSlug
        ? and(
            eq(academyEditions.slug, args.editionSlug),
            eq(academyPrograms.slug, args.programSlug),
          )
        : eq(academyEditions.slug, args.editionSlug),
    )
    .limit(1);
  const editionId = editionRows[0]?.id ?? null;
  if (!editionId) return { ok: false, code: "academy_edition_not_found" };

  const inviterOk = await assertEnrolledInEdition({
    userId: args.inviterUserId,
    editionId,
  });
  if (!inviterOk) return { ok: false, code: "academy_not_enrolled" };

  const email = normalizeAuthEmail(args.inviteeEmail);
  if (!email.includes("@")) return { ok: false, code: "academy_invite_email_invalid" };

  const canonical = canonicalEmailForDedup(email);
  const [invitee] = await db
    .select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })
    .from(users)
    .where(eq(users.emailCanonical, canonical))
    .limit(1);

  if (!invitee) return { ok: false, code: "academy_invitee_not_found" };
  if (invitee.id === args.inviterUserId) {
    return { ok: false, code: "academy_invite_self" };
  }

  const [existing] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, invitee.id),
        eq(academyEnrollments.editionId, editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);
  if (existing) return { ok: true, outcome: "already_enrolled" };

  const [inviter] = await db
    .select({ displayName: users.displayName, email: users.email })
    .from(users)
    .where(eq(users.id, args.inviterUserId))
    .limit(1);

  const inviterLabel =
    inviter?.displayName?.trim() ||
    inviter?.email?.split("@")[0] ||
    "McBuleli";

  const detail = await getEditionDetail({
    userId: invitee.id,
    editionSlug: args.editionSlug,
    programSlug: args.programSlug,
    locale: "fr",
  });
  if (!detail) return { ok: false, code: "academy_edition_not_found" };

  const priceNum = detail.program.priceUsdt
    ? numFromNumeric(detail.program.priceUsdt)
    : 0;

  const programSlug = detail.program.slug;
  const href = `/app/academy/${args.editionSlug}?program=${encodeURIComponent(programSlug)}`;

  const [editionMeta] = await db
    .select({
      titleFr: academyEditions.titleFr,
      titleEn: academyEditions.titleEn,
    })
    .from(academyEditions)
    .where(eq(academyEditions.id, editionId))
    .limit(1);

  if (priceNum <= 0) {
    const enrolled = await enrollInEdition({
      userId: invitee.id,
      editionSlug: args.editionSlug,
      programSlug,
    });
    if (!enrolled.ok) return { ok: false, code: enrolled.code };
    await createUserNotification({
      userId: invitee.id,
      kind: "academy_cohort_invite",
      payload: {
        editionSlug: args.editionSlug,
        editionTitleFr: editionMeta?.titleFr ?? detail.edition.title,
        editionTitleEn: editionMeta?.titleEn ?? detail.edition.title,
        inviterLabel,
        href,
        enrolled: true,
      },
    });
    return { ok: true, outcome: "enrolled" };
  }

  await createUserNotification({
    userId: invitee.id,
    kind: "academy_cohort_invite",
    payload: {
      editionSlug: args.editionSlug,
      editionTitleFr: editionMeta?.titleFr ?? detail.edition.title,
      editionTitleEn: editionMeta?.titleEn ?? detail.edition.title,
      inviterLabel,
      href,
      enrolled: false,
      priceUsdt: detail.program.priceUsdt,
    },
  });

  return { ok: true, outcome: "notified" };
}

export type FormationOpsStats = {
  formationTotal: number;
  formationLinkedToUser: number;
  academyEnrolledLaunch: number;
  pendingAcademyEnroll: number;
};

async function launchEditionId(): Promise<string | null> {
  await ensureAcademyLaunchSeed();
  const db = getDb();
  const [row] = await db
    .select({ id: academyEditions.id })
    .from(academyEditions)
    .innerJoin(academyPrograms, eq(academyEditions.programId, academyPrograms.id))
    .where(
      and(
        eq(academyEditions.slug, ACADEMY_EDITION_JUNE_2026),
        eq(academyPrograms.slug, ACADEMY_PROGRAM_LAUNCH),
      ),
    )
    .limit(1);
  return row?.id ?? null;
}

export async function getFormationOpsStats(): Promise<FormationOpsStats> {
  const db = getDb();
  const [formationRow] = await db
    .select({
      total: sql<number>`count(*)::int`,
      linked: sql<number>`count(*) filter (where ${trainingRegistrations.userId} is not null)::int`,
    })
    .from(trainingRegistrations);

  const editionId = await launchEditionId();
  let academyEnrolledLaunch = 0;
  if (editionId) {
    const [enRow] = await db
      .select({ n: sql<number>`count(*)::int` })
      .from(academyEnrollments)
      .where(
        and(
          eq(academyEnrollments.editionId, editionId),
          eq(academyEnrollments.status, "active"),
        ),
      );
    academyEnrolledLaunch = enRow?.n ?? 0;
  }

  const formationTotal = formationRow?.total ?? 0;

  return {
    formationTotal,
    formationLinkedToUser: formationRow?.linked ?? 0,
    academyEnrolledLaunch,
    pendingAcademyEnroll: Math.max(0, formationTotal - academyEnrolledLaunch),
  };
}

async function findUserIdForFormationEmail(email: string): Promise<string | null> {
  const normalized = normalizeAuthEmail(email);
  if (!normalized.includes("@")) return null;
  const canonical = canonicalEmailForDedup(normalized);
  const db = getDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(or(eq(users.email, normalized), eq(users.emailCanonical, canonical)))
    .limit(1);
  return row?.id ?? null;
}

/** When /formation email matches a McBuleli account → link + cohorte juin. */
export async function trySyncFormationEmailToAcademy(
  email: string,
): Promise<{ synced: boolean; enrolled: boolean }> {
  const normalized = normalizeAuthEmail(email);
  const userId = await findUserIdForFormationEmail(normalized);
  if (!userId) return { synced: false, enrolled: false };

  await linkTrainingRegistrationToUser({ userId, email: normalized });

  const editionId = await launchEditionId();
  if (!editionId) return { synced: true, enrolled: false };

  const db = getDb();
  const [existing] = await db
    .select({ id: academyEnrollments.id })
    .from(academyEnrollments)
    .where(
      and(
        eq(academyEnrollments.userId, userId),
        eq(academyEnrollments.editionId, editionId),
        eq(academyEnrollments.status, "active"),
      ),
    )
    .limit(1);

  if (existing) return { synced: true, enrolled: true };

  const out = await enrollInEdition({
    userId,
    editionSlug: ACADEMY_EDITION_JUNE_2026,
    programSlug: ACADEMY_PROGRAM_LAUNCH,
  });

  return { synced: true, enrolled: out.ok };
}

export async function backfillFormationToAcademy(): Promise<{
  processed: number;
  linked: number;
  enrolled: number;
  noAccount: number;
}> {
  const db = getDb();
  const rows = await db
    .select({ email: trainingRegistrations.email })
    .from(trainingRegistrations);

  let linked = 0;
  let enrolled = 0;
  let noAccount = 0;

  for (const row of rows) {
    const result = await trySyncFormationEmailToAcademy(row.email);
    if (!result.synced) {
      noAccount += 1;
      continue;
    }
    linked += 1;
    if (result.enrolled) enrolled += 1;
  }

  return { processed: rows.length, linked, enrolled, noAccount };
}
