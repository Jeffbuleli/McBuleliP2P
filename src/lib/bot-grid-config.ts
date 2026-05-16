import { z } from "zod";
import { BOT_DCA_SYMBOLS } from "@/lib/bot-dca-config";

export const BOT_GRID_REFRESH_HOURS = [4, 12, 24] as const;

export const botGridConfigSchema = z
  .object({
    symbol: z.enum(BOT_DCA_SYMBOLS),
    priceLow: z.string().regex(/^\d+(\.\d+)?$/),
    priceHigh: z.string().regex(/^\d+(\.\d+)?$/),
    gridCount: z.number().int().min(3).max(15),
    quotePerGrid: z.string().regex(/^\d+(\.\d+)?$/),
    refreshHours: z.union([z.literal(4), z.literal(12), z.literal(24)]),
  })
  .refine(
    (c) => Number(c.priceHigh) > Number(c.priceLow),
    { message: "priceHigh must exceed priceLow" },
  );

export type BotGridConfig = z.infer<typeof botGridConfigSchema>;

export function parseBotGridConfig(raw: unknown): BotGridConfig | null {
  const parsed = botGridConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export function gridPriceLevels(cfg: BotGridConfig): number[] {
  const low = Number(cfg.priceLow);
  const high = Number(cfg.priceHigh);
  const n = cfg.gridCount;
  if (n === 1) return [low];
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(low + ((high - low) * i) / (n - 1));
  }
  return out;
}
