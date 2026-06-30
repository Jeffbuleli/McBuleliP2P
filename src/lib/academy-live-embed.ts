/** Optional in-app Jitsi iframe — disabled for JWT-gated live.mcbuleli.org (X-Frame-Options → black screen). */
export function isAcademyLiveEmbedEnabled(): boolean {
  if (process.env.NEXT_PUBLIC_ACADEMY_LIVE_EMBED !== "true") return false;
  const liveHost =
    process.env.NEXT_PUBLIC_ACADEMY_LIVE_BASE_URL?.trim() ||
    "https://live.mcbuleli.org";
  return !liveHost.includes("live.mcbuleli.org");
}
