/** McBuleli-branded Jitsi Meet URL hash params (self-hosted live.mcbuleli.org). */
export const ACADEMY_JITSI_APP_NAME = "McBuleli";
export const ACADEMY_JITSI_PROVIDER = "McBuleli";

/** Logo watermark transparent (coin vidéo pré-live + live). */
export const ACADEMY_JITSI_LOGO_URL =
  "https://mcbuleli.org/brand/mcbuleli-meet-watermark.png";

export const ACADEMY_JITSI_LOGO_URL_LIVE_HOST =
  "https://live.mcbuleli.org/images/mcbuleli-meet-watermark.png";

/** « lancement-8-juin » → « Lancement 8 Juin » */
export function humanizeLiveSessionSlug(slug: string): string {
  return slug
    .trim()
    .toLowerCase()
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Titre événement + « | McBuleli » (remplace « | Jitsi Meet »). */
export function academyJitsiSubject(opts?: {
  sessionTitle?: string;
  sessionSlug?: string;
}): string {
  const title = opts?.sessionTitle?.trim();
  const slug = opts?.sessionSlug?.trim();
  const label = title || (slug ? humanizeLiveSessionSlug(slug) : "");
  if (!label) return ACADEMY_JITSI_APP_NAME;
  return `${label} | ${ACADEMY_JITSI_APP_NAME}`;
}

/** Appended to Jitsi iframe / external join URLs via hash config. */
export function appendAcademyJitsiBrandParams(
  params: string[],
  opts?: { sessionTitle?: string; sessionSlug?: string },
): void {
  const subject = academyJitsiSubject(opts);
  params.push(
    "config.defaultLanguage=fr",
    `config.subject=${encodeURIComponent(subject)}`,
    "config.hideConferenceSubject=false",
    `config.defaultLogoUrl=${encodeURIComponent(ACADEMY_JITSI_LOGO_URL)}`,
    `interfaceConfig.DEFAULT_LOGO_URL=${encodeURIComponent(ACADEMY_JITSI_LOGO_URL)}`,
    `interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL=${encodeURIComponent(ACADEMY_JITSI_LOGO_URL)}`,
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.SHOW_WATERMARK_FOR_GUESTS=false",
    "interfaceConfig.JITSI_WATERMARK_LINK=",
    `interfaceConfig.APP_NAME=${encodeURIComponent(ACADEMY_JITSI_APP_NAME)}`,
    `interfaceConfig.NATIVE_APP_NAME=${encodeURIComponent(ACADEMY_JITSI_APP_NAME)}`,
    `interfaceConfig.PROVIDER_NAME=${encodeURIComponent(ACADEMY_JITSI_PROVIDER)}`,
    "interfaceConfig.SHOW_BRAND_WATERMARK=false",
    "interfaceConfig.SHOW_POWERED_BY=false",
    "interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE=false",
    "interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT=false",
    "interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE=false",
    "interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID=",
    "interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS=",
    "interfaceConfig.LANG=fr",
  );
}
