/** Chemins logo — utiliser logo-256/512 pour affichage net (éviter upscale du 228px). */

export const BRAND_LOGO_PATH = "/brand/logo.png";
export const BRAND_LOGO_256 = "/brand/logo-256.png";
export const BRAND_LOGO_512 = "/brand/logo-512.png";

/** Props Image recommandées pour netteté (pas d’optimisation qui adoucit). */
export const brandLogoImageProps = {
  src: BRAND_LOGO_256,
  width: 48,
  height: 48,
  unoptimized: true as const,
  className: "h-12 w-12 object-contain",
};
