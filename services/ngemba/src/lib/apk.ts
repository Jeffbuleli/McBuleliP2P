/**
 * Lien APK pilote (EAS preview).
 * Mettre a jour apres chaque `eas build` - ou via NEXT_PUBLIC_NGEMBA_APK_URL.
 */
export const NGEMBA_APK_BUILD_PAGE =
  "https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/2487d515-ffa0-48f2-89ce-26afe344b673";

export function ngembaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_APK_BUILD_PAGE;
}
