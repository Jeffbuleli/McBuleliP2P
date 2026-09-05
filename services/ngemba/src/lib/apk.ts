/**
 * Lien APK pilote.
 * Prefer own-domain install page (reduces Expo CDN “dangerous” flags).
 * Direct file: /downloads/ngemba-rdc.apk (served from public/).
 */
export const NGEMBA_APK_BUILD_PAGE =
  "https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/2487d515-ffa0-48f2-89ce-26afe344b673";

export const NGEMBA_APK_INSTALL_PAGE = "/telecharger";

export const NGEMBA_APK_DIRECT = "/downloads/ngemba-rdc.apk";

export function ngembaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_APK_INSTALL_PAGE;
}
