import { getAppAbsoluteUrl } from "@/lib/app-url";

/** Public share URL - crawlable OG metadata at /community/p/[id]. */
export function communityPostSharePath(postId: string): string {
  return `/community/p/${postId}`;
}

/** In-app deep link - preserved through login redirect. */
export function communityPostAppPath(postId: string): string {
  return `/app/community/post/${postId}`;
}

export function communityPostShareUrl(postId: string): string {
  return getAppAbsoluteUrl(communityPostSharePath(postId));
}
