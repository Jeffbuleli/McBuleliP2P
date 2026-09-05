/**
 * Lien APK pilote.
 * Prefer own-domain install page (reduces Expo CDN “dangerous” flags).
 * Direct file: /downloads/ngemba-rdc.apk (served from public/).
 */
export const NGEMBA_APK_BUILD_PAGE =
  "https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/d53eea19-6402-4e00-bde3-72e08bf0ecaf";

export const NGEMBA_APK_INSTALL_PAGE = "/telecharger";

/** Query busts CDN/browser cache when the APK file is replaced in place. */
export const NGEMBA_APK_DIRECT = "/downloads/ngemba-rdc.apk?v=0.3.5";

export function ngembaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_APK_INSTALL_PAGE;
}
