import { getAppAbsoluteUrl } from "@/lib/app-url";

/** Public share URL — crawlable OG metadata at /community/p/[id]. */
export function communityPostSharePath(postId: string): string {
  return `/community/p/${postId}`;
}

/** In-app deep link — preserved through login redirect. */
export function communityPostAppPath(postId: string): string {
  return `/app/community/post/${postId}`;
}

export function communityPostShareUrl(postId: string): string {
  return getAppAbsoluteUrl(communityPostSharePath(postId));
}

/** Public profile share URL — crawlable OG at /community/u/[handle]. */
export function communityProfileSharePath(handle: string): string {
  return `/community/u/${encodeURIComponent(handle)}`;
}

/** In-app profile path. */
export function communityProfileAppPath(handle: string): string {
  return `/app/community/u/${encodeURIComponent(handle)}`;
}

export function communityProfileShareUrl(handle: string): string {
  return getAppAbsoluteUrl(communityProfileSharePath(handle));
}
