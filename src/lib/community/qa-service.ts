import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import {
  communityAnswers,
  communityLikes,
  communityQuestions,
  getDb,
} from "@/db";
import { getAuthorsMap, type CommunityAuthorView } from "@/lib/community/profile-service";
import {
  grantCommunityAnswer,
  grantCommunityAnswerAccepted,
  grantCommunityAnswerUpvote,
  grantCommunityQuestion,
} from "@/lib/community/rewards-service";

export type QuestionListItem = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  status: string;
  answerCount: number;
  voteScore: number;
  createdAt: string;
  author: CommunityAuthorView;
  hasAcceptedAnswer: boolean;
};

export type AnswerView = {
  id: string;
  body: string;
  voteScore: number;
  isAccepted: boolean;
  createdAt: string;
  author: CommunityAuthorView;
  votedByMe: boolean;
};

export type QuestionDetail = QuestionListItem & {
  answers: AnswerView[];
  acceptedAnswerId: string | null;
};

export async function listQuestions(args: {
  limit?: number;
  sort?: "open" | "popular" | "accepted";
}): Promise<QuestionListItem[]> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 30, 1), 50);

  const conditions = [];
  if (args.sort === "open") {
    conditions.push(eq(communityQuestions.status, "open"));
  } else if (args.sort === "accepted") {
    conditions.push(isNotNull(communityQuestions.acceptedAnswerId));
  }

  const orderBy =
    args.sort === "popular"
      ? [desc(communityQuestions.voteScore), desc(communityQuestions.createdAt)]
      : [desc(communityQuestions.createdAt)];

  const rows = await db
    .select()
    .from(communityQuestions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(...orderBy)
    .limit(limit);

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body.slice(0, 280),
    tags: r.tags ?? [],
    status: r.status,
    answerCount: r.answerCount,
    voteScore: r.voteScore,
    createdAt: r.createdAt.toISOString(),
    author: authors.get(r.authorId)!,
    hasAcceptedAnswer: !!r.acceptedAnswerId,
  }));
}

export async function getQuestionDetail(args: {
  questionId: string;
  viewerId: string | null;
}): Promise<QuestionDetail | null> {
  const db = getDb();
  const [q] = await db
    .select()
    .from(communityQuestions)
    .where(eq(communityQuestions.id, args.questionId))
    .limit(1);
  if (!q) return null;

  await db
    .update(communityQuestions)
    .set({ viewCount: sql`${communityQuestions.viewCount} + 1` })
    .where(eq(communityQuestions.id, q.id));

  const answers = await db
    .select()
    .from(communityAnswers)
    .where(eq(communityAnswers.questionId, q.id))
    .orderBy(
      desc(communityAnswers.isAccepted),
      desc(communityAnswers.voteScore),
      desc(communityAnswers.createdAt),
    );

  const authorIds = [
    q.authorId,
    ...answers.map((a) => a.authorId),
  ];
  const authors = await getAuthorsMap(authorIds);

  let votedIds = new Set<string>();
  if (args.viewerId && answers.length) {
    const votes = await db
      .select({ targetId: communityLikes.targetId })
      .from(communityLikes)
      .where(
        and(
          eq(communityLikes.userId, args.viewerId),
          eq(communityLikes.targetType, "answer"),
        ),
      );
    votedIds = new Set(votes.map((v) => v.targetId));
  }

  return {
    id: q.id,
    title: q.title,
    body: q.body,
    tags: q.tags ?? [],
    status: q.status,
    answerCount: q.answerCount,
    voteScore: q.voteScore,
    createdAt: q.createdAt.toISOString(),
    author: authors.get(q.authorId)!,
    hasAcceptedAnswer: !!q.acceptedAnswerId,
    acceptedAnswerId: q.acceptedAnswerId,
    answers: answers.map((a) => ({
      id: a.id,
      body: a.body,
      voteScore: a.voteScore,
      isAccepted: a.isAccepted,
      createdAt: a.createdAt.toISOString(),
      author: authors.get(a.authorId)!,
      votedByMe: votedIds.has(a.id),
    })),
  };
}

export async function createQuestion(args: {
  authorId: string;
  title: string;
  body: string;
  tags?: string[];
}): Promise<
  | { ok: true; question: QuestionListItem; bpGranted: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  if (args.title.trim().length < 10) return { ok: false, error: "title_too_short" };
  if (args.body.trim().length < 20) return { ok: false, error: "body_too_short" };

  const db = getDb();
  const [row] = await db
    .insert(communityQuestions)
    .values({
      authorId: args.authorId,
      title: args.title.trim().slice(0, 200),
      body: args.body.trim(),
      tags: args.tags?.slice(0, 5) ?? [],
    })
    .returning();

  const authors = await getAuthorsMap([args.authorId]);
  const bp = await grantCommunityQuestion({
    userId: args.authorId,
    questionId: row!.id,
    titleLength: args.title.length,
  });

  return {
    ok: true,
    question: {
      id: row!.id,
      title: row!.title,
      body: row!.body,
      tags: row!.tags ?? [],
      status: row!.status,
      answerCount: 0,
      voteScore: 0,
      createdAt: row!.createdAt.toISOString(),
      author: authors.get(args.authorId)!,
      hasAcceptedAnswer: false,
    },
    bpGranted: { granted: bp.granted, points: bp.points },
  };
}

export async function createAnswer(args: {
  authorId: string;
  questionId: string;
  body: string;
}): Promise<
  | { ok: true; answer: AnswerView; bpGranted: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  if (args.body.trim().length < 30) return { ok: false, error: "body_too_short" };

  const db = getDb();
  const [q] = await db
    .select()
    .from(communityQuestions)
    .where(eq(communityQuestions.id, args.questionId))
    .limit(1);
  if (!q) return { ok: false, error: "not_found" };
  if (q.status !== "open") return { ok: false, error: "question_closed" };

  const [row] = await db
    .insert(communityAnswers)
    .values({
      questionId: args.questionId,
      authorId: args.authorId,
      body: args.body.trim(),
    })
    .returning();

  await db
    .update(communityQuestions)
    .set({
      answerCount: sql`${communityQuestions.answerCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(communityQuestions.id, args.questionId));

  const authors = await getAuthorsMap([args.authorId]);
  const bp = await grantCommunityAnswer({
    userId: args.authorId,
    answerId: row!.id,
    questionId: args.questionId,
    bodyLength: args.body.length,
    questionAuthorId: q.authorId,
  });

  return {
    ok: true,
    answer: {
      id: row!.id,
      body: row!.body,
      voteScore: 0,
      isAccepted: false,
      createdAt: row!.createdAt.toISOString(),
      author: authors.get(args.authorId)!,
      votedByMe: false,
    },
    bpGranted: { granted: bp.granted, points: bp.points },
  };
}

export async function voteAnswer(args: {
  voterId: string;
  answerId: string;
}): Promise<{ ok: true; voteScore: number } | { ok: false; error: string }> {
  const db = getDb();
  const [answer] = await db
    .select()
    .from(communityAnswers)
    .where(eq(communityAnswers.id, args.answerId))
    .limit(1);
  if (!answer) return { ok: false, error: "not_found" };
  if (answer.authorId === args.voterId) return { ok: false, error: "self_vote" };

  try {
    await db.insert(communityLikes).values({
      userId: args.voterId,
      targetType: "answer",
      targetId: args.answerId,
    });
  } catch {
    return { ok: true, voteScore: answer.voteScore };
  }

  const [updated] = await db
    .update(communityAnswers)
    .set({ voteScore: sql`${communityAnswers.voteScore} + 1` })
    .where(eq(communityAnswers.id, args.answerId))
    .returning({ voteScore: communityAnswers.voteScore });

  await grantCommunityAnswerUpvote({
    answerAuthorId: answer.authorId,
    answerId: args.answerId,
    voterId: args.voterId,
  });

  return { ok: true, voteScore: updated?.voteScore ?? answer.voteScore + 1 };
}

export async function acceptAnswer(args: {
  questionId: string;
  answerId: string;
  authorId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb();
  const [q] = await db
    .select()
    .from(communityQuestions)
    .where(eq(communityQuestions.id, args.questionId))
    .limit(1);
  if (!q) return { ok: false, error: "not_found" };
  if (q.authorId !== args.authorId) return { ok: false, error: "forbidden" };

  const [answer] = await db
    .select()
    .from(communityAnswers)
    .where(
      and(
        eq(communityAnswers.id, args.answerId),
        eq(communityAnswers.questionId, args.questionId),
      ),
    )
    .limit(1);
  if (!answer) return { ok: false, error: "answer_not_found" };

  if (q.acceptedAnswerId) {
    await db
      .update(communityAnswers)
      .set({ isAccepted: false })
      .where(eq(communityAnswers.id, q.acceptedAnswerId));
  }

  await db
    .update(communityAnswers)
    .set({ isAccepted: true })
    .where(eq(communityAnswers.id, args.answerId));

  await db
    .update(communityQuestions)
    .set({
      acceptedAnswerId: args.answerId,
      status: "answered",
      updatedAt: new Date(),
    })
    .where(eq(communityQuestions.id, args.questionId));

  await grantCommunityAnswerAccepted({
    answerAuthorId: answer.authorId,
    answerId: args.answerId,
    questionId: args.questionId,
  });

  return { ok: true };
}
