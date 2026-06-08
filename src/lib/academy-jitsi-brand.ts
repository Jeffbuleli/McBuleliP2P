import { jitsiHashParam } from "@/lib/academy-jitsi-token";

/** McBuleli-branded Jitsi Meet URL hash params (self-hosted live.mcbuleli.org). */
export const ACADEMY_JITSI_APP_NAME = "McBuleli";
export const ACADEMY_JITSI_PROVIDER = "McBuleli";

/** Watermark coin vidéo — déployé par apply-mcbuleli-brand.sh sur le VPS. */
export const ACADEMY_JITSI_WATERMARK_PATH = "/images/mcbuleli-meet-watermark.png";

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
  const wm = ACADEMY_JITSI_WATERMARK_PATH;
  params.push(
    jitsiHashParam("config.defaultLanguage", "fr"),
    jitsiHashParam("config.subject", subject),
    jitsiHashParam("config.hideConferenceSubject", false),
    jitsiHashParam("config.defaultLogoUrl", wm),
    jitsiHashParam("interfaceConfig.DEFAULT_LOGO_URL", wm),
    jitsiHashParam("interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL", wm),
    jitsiHashParam("interfaceConfig.DEFAULT_BACKGROUND", "#f4f6f4"),
    jitsiHashParam("interfaceConfig.SHOW_JITSI_WATERMARK", true),
    jitsiHashParam("interfaceConfig.SHOW_WATERMARK_FOR_GUESTS", true),
    jitsiHashParam("interfaceConfig.JITSI_WATERMARK_LINK", ""),
    jitsiHashParam("interfaceConfig.APP_NAME", ACADEMY_JITSI_APP_NAME),
    jitsiHashParam("interfaceConfig.NATIVE_APP_NAME", ACADEMY_JITSI_APP_NAME),
    jitsiHashParam("interfaceConfig.PROVIDER_NAME", ACADEMY_JITSI_PROVIDER),
    jitsiHashParam("interfaceConfig.SHOW_BRAND_WATERMARK", false),
    jitsiHashParam("interfaceConfig.SHOW_POWERED_BY", false),
    jitsiHashParam("interfaceConfig.SHOW_PROMOTIONAL_CLOSE_PAGE", false),
    jitsiHashParam("interfaceConfig.DISPLAY_WELCOME_PAGE_CONTENT", false),
    jitsiHashParam("interfaceConfig.GENERATE_ROOMNAMES_ON_WELCOME_PAGE", false),
    jitsiHashParam("interfaceConfig.MOBILE_DOWNLOAD_LINK_ANDROID", ""),
    jitsiHashParam("interfaceConfig.MOBILE_DOWNLOAD_LINK_IOS", ""),
    jitsiHashParam("interfaceConfig.LANG", "fr"),
    jitsiHashParam("config.enableClosePage", false),
    jitsiHashParam("config.welcomePage.disabled", true),
    jitsiHashParam("config.feedbackPercentage", 0),
  );
}
