/** McBuleli-branded Jitsi Meet URL hash params (self-hosted live.mcbuleli.org). */
export const ACADEMY_JITSI_APP_NAME = "McBuleli Meet";
export const ACADEMY_JITSI_PROVIDER = "McBuleli";

/** Logo Meet — mcbuleli.org (Render) ; bascule auto sur live après apply-mcbuleli-brand.sh */
export const ACADEMY_JITSI_LOGO_URL =
  "https://mcbuleli.org/brand/mcbuleli-meet-logo.png";

export const ACADEMY_JITSI_LOGO_URL_LIVE_HOST =
  "https://live.mcbuleli.org/images/mcbuleli-meet-logo.png";

/** Titre onglet / pré-join : « Lancement | McBuleli Meet » */
export function academyJitsiSubject(sessionTitle?: string): string {
  const t = sessionTitle?.trim();
  if (!t) return ACADEMY_JITSI_APP_NAME;
  const short = t
    .replace(/^soirée de /i, "")
    .replace(/^soirée /i, "")
    .trim();
  const label = short
    ? short.charAt(0).toUpperCase() + short.slice(1)
    : t;
  return `${label} | ${ACADEMY_JITSI_APP_NAME}`;
}

/** Appended to Jitsi iframe / external join URLs via hash config. */
export function appendAcademyJitsiBrandParams(
  params: string[],
  opts?: { sessionTitle?: string },
): void {
  const subject = academyJitsiSubject(opts?.sessionTitle);
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
