/**
 * Lien APK pilote (EAS preview).
 * Mettre a jour apres chaque `eas build` - ou via NEXT_PUBLIC_NGEMBA_APK_URL.
 */
export const NGEMBA_APK_BUILD_PAGE =
  "https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/2487d515-ffa0-48f2-89ce-26afe344b673";

/** Lien direct APK (EAS preview v0.3.3 / versionCode 6). */
export const NGEMBA_APK_DIRECT =
  "https://expo.dev/artifacts/eas/Jf9DrIEOha_AByPc3mg5BT-7SklbbMBgMARqBaTbmT8.apk";

export function ngembaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_APK_DIRECT;
}
