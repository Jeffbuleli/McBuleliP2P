import { z } from "zod";
import type { Locale } from "@/i18n/locale";
import { getDictionary } from "@/i18n/messages";

export const LANDING_PROMOS_SETTING_KEY = "landing_promos";

export const LANDING_PROMO_SLOT_IDS = [
  "wallet",
  "p2p",
  "futures",
  "avec",
  "bots",
  "staking",
] as const;

export type LandingPromoSlotId = (typeof LANDING_PROMO_SLOT_IDS)[number];

const slotTitleKey: Record<
  LandingPromoSlotId,
  keyof ReturnType<typeof getDictionary>
> = {
  wallet: "landing_promo_wallet_t",
  p2p: "landing_promo_p2p_t",
  futures: "landing_promo_futures_t",
  avec: "landing_promo_avec_t",
  bots: "landing_promo_bots_t",
  staking: "landing_promo_staking_t",
};

const slotTagKey: Record<
  LandingPromoSlotId,
  keyof ReturnType<typeof getDictionary>
> = {
  wallet: "landing_promo_wallet_tag",
  p2p: "landing_promo_p2p_tag",
  futures: "landing_promo_futures_tag",
  avec: "landing_promo_avec_tag",
  bots: "landing_promo_bots_tag",
  staking: "landing_promo_staking_tag",
};

const promoSlotZ = z.object({
  id: z.enum(LANDING_PROMO_SLOT_IDS),
  enabled: z.boolean(),
  href: z.string().trim().min(1).max(256),
  image: z.string().trim().min(1).max(512),
  titleEn: z.string().trim().max(120).optional(),
  titleFr: z.string().trim().max(120).optional(),
  tagEn: z.string().trim().max(120).optional(),
  tagFr: z.string().trim().max(120).optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
});

export const landingPromosConfigZ = z.object({
  headingEn: z.string().trim().max(120).optional(),
  headingFr: z.string().trim().max(120).optional(),
  promos: z.array(promoSlotZ).min(1).max(12),
});

export type LandingPromosConfig = z.infer<typeof landingPromosConfigZ>;

export type ResolvedLandingPromo = {
  id: LandingPromoSlotId;
  href: string;
  image: string;
  title: string;
  tag: string;
};

const DEFAULT_PROMOS: LandingPromosConfig["promos"] = [
  {
    id: "wallet",
    enabled: true,
    href: "/app/wallet",
    image: "/ads/mcbuleli-ad-en-wallet-1080.jpg",
    sortOrder: 0,
  },
  {
    id: "p2p",
    enabled: true,
    href: "/app/p2p",
    image: "/ads/mcbuleli-ad-p2p-1080.jpg",
    sortOrder: 1,
  },
  {
    id: "futures",
    enabled: true,
    href: "/app/trade/futures",
    image: "/ads/mcbuleli-ad-en-futures-1080.jpg",
    sortOrder: 2,
  },
  {
    id: "avec",
    enabled: true,
    href: "/app/wallet/groups",
    image: "/ads/mcbuleli-ad-avec-1080.jpg",
    sortOrder: 3,
  },
  {
    id: "bots",
    enabled: true,
    href: "/app/trade/bots",
    image: "/ads/mcbuleli-ad-trading-bot-1080.jpg",
    sortOrder: 4,
  },
  {
    id: "staking",
    enabled: true,
    href: "/app/wallet/staking",
    image: "/ads/mcbuleli-ad-en-staking-1080.jpg",
    sortOrder: 5,
  },
];

export function defaultLandingPromosConfig(): LandingPromosConfig {
  return { promos: DEFAULT_PROMOS.map((p) => ({ ...p })) };
}

export function mergeLandingPromosWithDefaults(
  raw: LandingPromosConfig,
): LandingPromosConfig {
  const byId = new Map(raw.promos.map((p) => [p.id, p]));
  const promos = DEFAULT_PROMOS.map((def) => {
    const over = byId.get(def.id);
    return over ? { ...def, ...over, id: def.id } : { ...def };
  });
  for (const p of raw.promos) {
    if (!promos.some((x) => x.id === p.id)) {
      promos.push(p);
    }
  }
  return {
    headingEn: raw.headingEn,
    headingFr: raw.headingFr,
    promos: promos.sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99)),
  };
}

export function resolveLandingPromos(
  config: LandingPromosConfig,
  locale: Locale,
): { heading: string; promos: ResolvedLandingPromo[] } {
  const d = getDictionary(locale);
  const fr = locale === "fr";
  const heading =
    (fr ? config.headingFr : config.headingEn)?.trim() || d.landing_promo_heading;

  const promos = config.promos
    .filter((p) => p.enabled)
    .sort((a, b) => (a.sortOrder ?? 99) - (b.sortOrder ?? 99))
    .map((p) => {
      const titleKey = slotTitleKey[p.id];
      const tagKey = slotTagKey[p.id];
      const title =
        (fr ? p.titleFr : p.titleEn)?.trim() ||
        String(d[titleKey] ?? p.id);
      const tag =
        (fr ? p.tagFr : p.tagEn)?.trim() ||
        String(d[tagKey] ?? "");
      return {
        id: p.id,
        href: p.href,
        image:
          p.image.startsWith("/") || p.image.startsWith("http")
            ? p.image
            : `/${p.image}`,
        title,
        tag,
      };
    });

  return { heading, promos };
}
