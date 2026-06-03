import { randomBytes, randomUUID } from "node:crypto";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
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
  const email = args.email.trim().toLowerCase();
  await db
    .update(trainingRegistrations)
    .set({ userId: args.userId, linkedAt: new Date() })
    .where(
      and(
        eq(trainingRegistrations.email, email),
        sql`${trainingRegistrations.userId} IS NULL`,
      ),
    );
}

export async function getAcademyHub(args: {
  userId: string;
  locale: Locale;
}): Promise<{
  programs: AcademyProgramView[];
  editions: AcademyEditionView[];
  credentials: AcademyCredentialView[];
}> {
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

  return {
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
}): Promise<
  | {
      edition: AcademyEditionView;
      program: AcademyProgramView;
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

  const sessionViews: AcademySessionView[] = sessions.map((s) => {
    const start = s.startsAt.getTime();
    const end = s.endsAt?.getTime() ?? start + 2 * 60 * 60 * 1000;
    const canCheckIn =
      !!enrollment &&
      now >= start - winMs &&
      now <= end + winMs &&
      !attended.has(s.id);
    return {
      id: s.id,
      slug: s.slug,
      title: pickLocale(s, args.locale),
      kind: s.kind,
      startsAt: s.startsAt.toISOString(),
      endsAt: s.endsAt?.toISOString() ?? null,
      liveUrl: s.liveUrl,
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

  return {
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

  await db.insert(academyCredentials).values({
    userId: args.userId,
    programId: edition?.programId ?? null,
    editionId: args.editionId,
    kind: args.kind,
    slug: args.slug,
    titleFr: args.titleFr,
    titleEn: args.titleEn,
    verifyCode: verifyCode(),
  });
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
