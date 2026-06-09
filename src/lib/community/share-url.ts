import { getAppAbsoluteUrl } from "@/lib/app-url";

/** Public share URL — crawlable OG metadata at /community/p/[id]. */
export function communityPostSharePath(postId: string): string {
  return `/community/p/${postId}`;
}

export function communityPostShareUrl(postId: string): string {
  return getAppAbsoluteUrl(communityPostSharePath(postId));
}
