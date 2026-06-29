import type { EmailIllustration } from "@/lib/email/config";
import { EMAIL_BRAND } from "@/lib/email/config";

const P = EMAIL_BRAND.primary;
const M = EMAIL_BRAND.mint;

function wrapSvg(inner: string, size = 200): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 200 200" role="img" aria-hidden="true">${inner}</svg>`;
}

/** McBuleli mark - always renders (no external image). */
export function emailLogoSvg(size = 48): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48" role="img" aria-label="McBuleli">
  <rect width="48" height="48" rx="10" fill="${P}"/>
  <text x="24" y="30" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" font-weight="800" fill="#fff">M</text>
</svg>`;
}

const ILLUSTRATIONS: Record<EmailIllustration, string> = {
  verify: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <rect x="52" y="78" width="96" height="64" rx="8" fill="#fff" stroke="${P}" stroke-width="3"/>
    <path d="M52 86 L100 118 L148 86" fill="none" stroke="${P}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="130" cy="72" r="18" fill="${P}"/>
    <path d="M123 72 L128 77 L138 67" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
  `),
  reset: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <circle cx="100" cy="108" r="28" fill="none" stroke="${P}" stroke-width="4"/>
    <path d="M100 80 L100 108 L118 108" fill="none" stroke="${P}" stroke-width="4" stroke-linecap="round"/>
    <path d="M72 88 L60 76 M72 92 L58 92" fill="none" stroke="${P}" stroke-width="3" stroke-linecap="round"/>
  `),
  change: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <rect x="58" y="82" width="52" height="40" rx="6" fill="#fff" stroke="${P}" stroke-width="3"/>
    <rect x="90" y="98" width="52" height="40" rx="6" fill="#fff" stroke="${P}" stroke-width="3" opacity="0.95"/>
    <path d="M108 118 L128 118 L122 112 M128 118 L122 124" fill="none" stroke="${P}" stroke-width="3" stroke-linecap="round"/>
  `),
  security: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <path d="M100 58 L140 78 L140 118 Q140 148 100 162 Q60 148 60 118 L60 78 Z" fill="#fff" stroke="${P}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M88 108 L96 116 L114 98" fill="none" stroke="${P}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  `),
  depositUsdt: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <circle cx="100" cy="108" r="32" fill="#fff" stroke="${P}" stroke-width="3"/>
    <text x="100" y="118" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="${P}">$</text>
    <path d="M100 52 L100 72 M88 62 L100 52 L112 62" fill="none" stroke="${P}" stroke-width="4" stroke-linecap="round"/>
  `),
  depositPi: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="#7c3aed" stroke-width="3"/>
    <circle cx="100" cy="108" r="32" fill="#fff" stroke="#7c3aed" stroke-width="3"/>
    <text x="100" y="118" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#7c3aed">π</text>
    <path d="M100 52 L100 72" fill="none" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  `),
  withdrawUsdt: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="${P}" stroke-width="3"/>
    <circle cx="100" cy="92" r="32" fill="#fff" stroke="${P}" stroke-width="3"/>
    <text x="100" y="102" text-anchor="middle" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="${P}">$</text>
    <path d="M100 148 L100 128 M88 138 L100 148 L112 138" fill="none" stroke="${P}" stroke-width="4" stroke-linecap="round"/>
  `),
  withdrawPi: wrapSvg(`
    <circle cx="100" cy="100" r="72" fill="${M}" stroke="#7c3aed" stroke-width="3"/>
    <circle cx="100" cy="92" r="32" fill="#fff" stroke="#7c3aed" stroke-width="3"/>
    <text x="100" y="102" text-anchor="middle" font-family="system-ui,sans-serif" font-size="20" font-weight="800" fill="#7c3aed">π</text>
    <path d="M100 148 L100 128" fill="none" stroke="#7c3aed" stroke-width="4" stroke-linecap="round"/>
  `),
};

export function emailIllustrationSvg(kind: EmailIllustration): string {
  return ILLUSTRATIONS[kind];
}
