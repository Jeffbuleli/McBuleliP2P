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

/** Public media share — same post landing with media focus. */
export function communityMediaSharePath(postId: string, mediaId: string): string {
  return `/community/p/${postId}?media=${encodeURIComponent(mediaId)}`;
}

export function communityMediaAppPath(postId: string, mediaId: string): string {
  return `/app/community/post/${postId}/media/${encodeURIComponent(mediaId)}`;
}

export function communityMediaShareUrl(postId: string, mediaId: string): string {
  return getAppAbsoluteUrl(communityMediaSharePath(postId, mediaId));
}

/**
 * Public profile share URL — short form mcbuleli.org/@handle
 * (/%40handle and /u/handle also rewrite to the OG landing).
 */
export function communityProfileSharePath(handle: string): string {
  // Keep @ branding; do not encode "@" itself (breaks some RS scrapers → 404).
  const h = handle.trim().replace(/^@/, "").toLowerCase();
  return `/@${h}`;
}

/** Canonical long path (OG page + rewrite destination). */
export function communityProfileCanonicalPath(handle: string): string {
  return `/community/u/${encodeURIComponent(handle)}`;
}

/** Alternate short path without @ (safer for some messengers). */
export function communityProfileShortPath(handle: string): string {
  const h = handle.trim().replace(/^@/, "").toLowerCase();
  return `/u/${h}`;
}

/** In-app profile path. */
export function communityProfileAppPath(handle: string): string {
  return `/app/community/u/${encodeURIComponent(handle)}`;
}

export function communityProfileShareUrl(handle: string): string {
  return getAppAbsoluteUrl(communityProfileSharePath(handle));
}

/** Public story/status share — OG landing at /community/s/[id]. */
export function communityStorySharePath(storyId: string): string {
  return `/community/s/${encodeURIComponent(storyId)}`;
}

/** In-app deep link opens the story viewer on community home. */
export function communityStoryAppPath(storyId: string): string {
  return `/app/community?story=${encodeURIComponent(storyId)}`;
}

export function communityStoryShareUrl(storyId: string): string {
  return getAppAbsoluteUrl(communityStorySharePath(storyId));
}
