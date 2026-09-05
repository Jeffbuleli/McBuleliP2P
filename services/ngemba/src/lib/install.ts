/** Page d’installation PWA (plus d’APK distribué). */
export const NGEMBA_INSTALL_PAGE = "/telecharger";

export function ngembaInstallUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_NGEMBA_INSTALL_URL?.trim();
  if (fromEnv) return fromEnv;
  return NGEMBA_INSTALL_PAGE;
}
