/** McBuleli-branded Jitsi Meet URL hash params (self-hosted live.mcbuleli.org). */
export const ACADEMY_JITSI_APP_NAME = "McBuleli Academy Live";
export const ACADEMY_JITSI_PROVIDER = "McBuleli";

export function academyJitsiSubject(sessionTitle?: string): string {
  const t = sessionTitle?.trim();
  return t ? `McBuleli · ${t}` : "McBuleli Academy — Live";
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
    "config.defaultLogoUrl=https://mcbuleli.org/logo.png",
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
