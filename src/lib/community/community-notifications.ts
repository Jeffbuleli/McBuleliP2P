import { createUserNotification } from "@/lib/notifications-service";

export async function notifyCommunityComment(args: {
  postAuthorId: string;
  commenterId: string;
  postId: string;
  commentId: string;
  preview: string;
}) {
  if (args.postAuthorId === args.commenterId) return;
  await createUserNotification({
    userId: args.postAuthorId,
    kind: "community_comment",
    payload: {
      postId: args.postId,
      commentId: args.commentId,
      fromUserId: args.commenterId,
      preview: args.preview.slice(0, 120),
    },
  });
}

export async function notifyCommunityLike(args: {
  postAuthorId: string;
  likerId: string;
  postId: string;
}) {
  if (args.postAuthorId === args.likerId) return;
  await createUserNotification({
    userId: args.postAuthorId,
    kind: "community_like",
    payload: {
      postId: args.postId,
      fromUserId: args.likerId,
    },
  });
}

export async function notifyCommunityTraderFollow(args: {
  traderId: string;
  followerId: string;
}) {
  if (args.traderId === args.followerId) return;
  await createUserNotification({
    userId: args.traderId,
    kind: "community_trader_follow",
    payload: {
      fromUserId: args.followerId,
    },
  });
}

export async function notifyCommunityBotCopyStarted(args: {
  leadId: string;
  followerId: string;
  planId: string;
  billing: string;
}) {
  if (args.leadId === args.followerId) return;
  await createUserNotification({
    userId: args.leadId,
    kind: "community_bot_copy_started",
    payload: {
      fromUserId: args.followerId,
      planId: args.planId,
      billing: args.billing,
    },
  });
}
