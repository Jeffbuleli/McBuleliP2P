/** Optional in-app Jitsi iframe (works best with self-hosted live base URL). */
export function isAcademyLiveEmbedEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ACADEMY_LIVE_EMBED === "true";
}
