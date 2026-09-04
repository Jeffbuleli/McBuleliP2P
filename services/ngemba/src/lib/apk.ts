/**
 * Lien APK pilote (EAS preview).
 * Mettre a jour apres chaque `eas build` - ou via NEXT_PUBLIC_NGEMBA_APK_URL.
 */
export const NGEMBA_APK_BUILD_PAGE =
  "https://expo.dev/accounts/mcbuleli-inc/projects/ngemba/builds/51529f24-d969-46aa-bef6-40ba5863c479";

export function ngembaApkUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_APK_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_APK_BUILD_PAGE;
}
