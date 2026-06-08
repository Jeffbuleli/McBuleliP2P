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
