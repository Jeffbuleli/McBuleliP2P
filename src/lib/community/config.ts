/** Community Hub — limites et feature flags. */

export function communityEnabled(): boolean {
  return process.env.COMMUNITY_ENABLED !== "false";
}

export const COMMUNITY_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const COMMUNITY_VIDEO_MAX_BYTES = 100 * 1024 * 1024;
/** Max story video length (seconds). */
export const COMMUNITY_STORY_VIDEO_MAX_SEC = 60;

export const COMMUNITY_IMAGE_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const COMMUNITY_VIDEO_MIMES = ["video/mp4", "video/webm"] as const;

export const COMMUNITY_BLOG_CATEGORIES = [
  "crypto",
  "trading",
  "blockchain",
  "p2p",
  "finance",
  "ia",
  "avec",
] as const;

export const COMMUNITY_FEED_PAGE_SIZE = 20;
