import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeAuthEmail } from "@/lib/auth/email-normalize";
import {
  isValidCodMsisdn,
  normalizeCodPhoneNumber,
} from "@/lib/freshpay/normalize-phone";
import {
  kinshasaPublicQuestions,
  scoreKinshasaQuiz,
  pickKinshasaSeriesId,
  signKinshasaAttempt,
  verifyKinshasaAttempt,
  getKinshasaSeries,
  KINSHASA_PASS_PERCENT,
  KINSHASA_QUESTION_COUNT,
  KINSHASA_QUIZ_CAP,
  KINSHASA_PUBLIC_CAP,
  KINSHASA_QUIZ_MINUTES,
  KINSHASA_ATTEMPT_TTL_MIN,
  kinshasaPublicRemaining,
} from "@/lib/hackathon/quiz-kinshasa";
import {
  getKinshasaSeatStats,
  grantKinshasaPaidSeat,
  isKinshasaBlacklisted,
  recordKinshasaFailure,
} from "@/lib/hackathon/quiz-kinshasa-grant";
import {
  sendKinshasaFailEmail,
  sendKinshasaTicketAndOrientationEmail,
} from "@/lib/email/messages/hackathon";
import { passPublicUrl } from "@/lib/hackathon/access";

export const dynamic = "force-dynamic";

const identityZ = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(6).max(40),
  city: z.string().trim().max(120).optional(),
  level: z
    .enum(["beginner", "intermediate", "advanced"])
    .optional()
    .default("beginner"),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
  utmSource: z.string().trim().max(64).optional(),
});

const answerZ = z.object({
  questionId: z.string().min(1).max(32),
  choiceIndex: z.number().int().min(0).max(2),
});

const startBodyZ = identityZ.extend({
  action: z.literal("start"),
});

const submitBodyZ = identityZ.extend({
  action: z.literal("submit"),
  attemptToken: z.string().min(20).max(800),
  answers: z.array(answerZ).length(KINSHASA_QUESTION_COUNT),
});

function statsPayload(stats: Awaited<ReturnType<typeof getKinshasaSeatStats>>) {
  const claimed = stats?.claimed ?? 0;
  const closed = stats?.closed ?? true;
  return {
    closed,
    claimed,
    /** Proportional gauge: 10 public ≡ 15 internal. */
    remaining: kinshasaPublicRemaining(claimed),
    cap: KINSHASA_PUBLIC_CAP,
    passPercent: KINSHASA_PASS_PERCENT,
    questionCount: KINSHASA_QUESTION_COUNT,
    quizMinutes: KINSHASA_QUIZ_MINUTES,
  };
}

export async function GET() {
  try {
    const stats = await getKinshasaSeatStats();
    return NextResponse.json(statsPayload(stats));
  } catch {
    return NextResponse.json({
      ...statsPayload({
        claimed: 0,
        remaining: KINSHASA_QUIZ_CAP,
        cap: KINSHASA_QUIZ_CAP,
        closed: false,
      }),
      quizMinutes: KINSHASA_QUIZ_MINUTES,
      warning: "seat_stats_unavailable",
    });
  }
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const action =
    typeof json === "object" &&
    json &&
    "action" in json &&
    typeof (json as { action?: unknown }).action === "string"
      ? (json as { action: string }).action
      : "submit";

  if (action === "start") {
    return handleStart(json);
  }
  return handleSubmit(json);
}

async function handleStart(json: unknown) {
  const parsed = startBodyZ.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = parsed.data;
  const phone = normalizeCodPhoneNumber(data.phone);
  if (!isValidCodMsisdn(phone)) {
    return NextResponse.json(
      {
        error: "invalid_phone",
        message:
          data.locale === "en"
            ? "Invalid phone (e.g. 2438XXXXXXXX)."
            : "Téléphone invalide (ex. 2438XXXXXXXX).",
      },
      { status: 400 },
    );
  }
  const email = normalizeAuthEmail(data.email);

  let stats: Awaited<ReturnType<typeof getKinshasaSeatStats>> = null;
  try {
    stats = await getKinshasaSeatStats();
    if (stats?.closed) {
      return NextResponse.json(
        {
          error: "quota_full",
          message:
            data.locale === "en"
              ? "Kinshasa seats are full."
              : "Places Kinshasa complètes.",
        },
        { status: 409 },
      );
    }
    const blocked = await isKinshasaBlacklisted({ email, phone });
    if (blocked.blocked) {
      return NextResponse.json(
        {
          error: "blacklisted",
          message:
            data.locale === "en"
              ? "This email or phone already used the Kinshasa quiz."
              : "Cet e-mail ou téléphone a déjà passé le quiz Kinshasa.",
        },
        { status: 409 },
      );
    }
  } catch {
    // Allow local UI when DB is down; submit will still need DB.
  }

  const seriesId = pickKinshasaSeriesId();
  const attemptToken = signKinshasaAttempt({
    seriesId,
    email,
    phone,
    exp: Date.now() + KINSHASA_ATTEMPT_TTL_MIN * 60 * 1000,
  });

  return NextResponse.json({
    ok: true,
    seriesId,
    attemptToken,
    questionCount: KINSHASA_QUESTION_COUNT,
    passPercent: KINSHASA_PASS_PERCENT,
    questions: kinshasaPublicQuestions(seriesId),
    remaining: kinshasaPublicRemaining(stats ? stats.claimed : 0),
    quizMinutes: KINSHASA_QUIZ_MINUTES,
  });
}

async function handleSubmit(json: unknown) {
  const parsed = submitBodyZ.safeParse(
    typeof json === "object" && json && !("action" in json)
      ? { ...(json as object), action: "submit" }
      : json,
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const data = parsed.data;
  const phone = normalizeCodPhoneNumber(data.phone);
  if (!isValidCodMsisdn(phone)) {
    return NextResponse.json(
      { error: "invalid_phone", message: "Téléphone invalide." },
      { status: 400 },
    );
  }
  const email = normalizeAuthEmail(data.email);

  const attempt = verifyKinshasaAttempt(data.attemptToken);
  if (
    !attempt ||
    attempt.email !== email ||
    attempt.phone !== phone
  ) {
    return NextResponse.json(
      {
        error: "invalid_attempt",
        message:
          data.locale === "en"
            ? "Quiz session expired or invalid. Start again."
            : "Session quiz expirée ou invalide. Recommencez.",
      },
      { status: 400 },
    );
  }

  const series = getKinshasaSeries(attempt.seriesId);
  if (!series) {
    return NextResponse.json({ error: "invalid_series" }, { status: 400 });
  }
  const knownIds = new Set(series.map((q) => q.id));
  if (
    data.answers.some((a) => !knownIds.has(a.questionId)) ||
    new Set(data.answers.map((a) => a.questionId)).size !==
      KINSHASA_QUESTION_COUNT
  ) {
    return NextResponse.json({ error: "invalid_answers" }, { status: 400 });
  }

  try {
    const blocked = await isKinshasaBlacklisted({ email, phone });
    if (blocked.blocked) {
      return NextResponse.json(
        {
          error: "blacklisted",
          message:
            data.locale === "en"
              ? "This email or phone already used the Kinshasa quiz."
              : "Cet e-mail ou téléphone a déjà passé le quiz Kinshasa.",
        },
        { status: 409 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        error: "db_unavailable",
        message:
          data.locale === "en"
            ? "Server unavailable. Try again later."
            : "Serveur indisponible. Réessayez plus tard.",
      },
      { status: 503 },
    );
  }

  const score = scoreKinshasaQuiz(attempt.seriesId, data.answers);
  const baseArgs = {
    firstName: data.firstName,
    lastName: data.lastName,
    email,
    phone,
    city: data.city,
    level: data.level,
    locale: data.locale,
    utmSource: data.utmSource,
    scorePercent: score.percent,
    correct: score.correct,
    seriesId: attempt.seriesId,
  };

  if (!score.passed) {
    await recordKinshasaFailure(baseArgs);
    void sendKinshasaFailEmail({
      to: email,
      firstName: data.firstName,
      scorePercent: score.percent,
      correct: score.correct,
      total: score.total,
      locale: data.locale,
    });
    return NextResponse.json({
      ok: false,
      passed: false,
      correct: score.correct,
      total: score.total,
      percent: score.percent,
      passPercent: KINSHASA_PASS_PERCENT,
      message:
        data.locale === "en"
          ? `Score ${score.percent}% - need ${KINSHASA_PASS_PERCENT}% (7/10). Result emailed. This email/phone cannot retry.`
          : `Score ${score.percent} % - il faut ${KINSHASA_PASS_PERCENT} % (7/10). Résultat envoyé par e-mail. Cet e-mail / téléphone ne peut pas retenter.`,
    });
  }

  const stats = await getKinshasaSeatStats();
  if (!stats || stats.closed) {
    await recordKinshasaFailure(baseArgs);
    return NextResponse.json(
      {
        error: "quota_full",
        message:
          data.locale === "en"
            ? "Kinshasa seats just filled up."
            : "Les places Kinshasa viennent d'être prises.",
      },
      { status: 409 },
    );
  }

  const grant = await grantKinshasaPaidSeat(baseArgs);
  if (!grant.ok) {
    if (grant.error === "blacklisted" || grant.error === "already_registered") {
      return NextResponse.json(
        {
          error: grant.error,
          message:
            data.locale === "en"
              ? "Already registered or blocked for this quiz."
              : "Déjà inscrit ou bloqué pour ce quiz.",
          ticketCode: "ticketCode" in grant ? grant.ticketCode : undefined,
        },
        { status: grant.status },
      );
    }
    return NextResponse.json(
      {
        error: grant.error,
        message: grant.error,
      },
      { status: grant.status },
    );
  }

  void sendKinshasaTicketAndOrientationEmail({
    registrationId: grant.registrationId,
  });

  return NextResponse.json({
    ok: true,
    passed: true,
    correct: score.correct,
    total: score.total,
    percent: score.percent,
    ticketCode: grant.ticketCode,
    ticketUrl: passPublicUrl(grant.ticketCode),
    remaining: kinshasaPublicRemaining(stats.claimed + 1),
    message:
      data.locale === "en"
        ? "Quiz passed. Your free QR ticket and orientation were emailed."
        : "Quiz réussi. Votre ticket QR gratuit et les orientations ont été envoyés par e-mail.",
  });
}
