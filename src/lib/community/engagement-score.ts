/**
 * Community interest / virality score (time-decayed).
 * Tips count as strong attention signals; boost is a separate feed pin.
 */

export type EngagementCounters = {
  likeCount?: number | null;
  commentCount?: number | null;
  shareCount?: number | null;
  viewCount?: number | null;
  tipBpTotal?: number | null;
  tipMcbTotal?: number | string | null;
};

/** Weights for organic interest signals. */
export const ENGAGEMENT_WEIGHTS = {
  like: 2,
  comment: 3,
  share: 5,
  view: 1,
  tipBp: 4,
  tipMcb: 25,
} as const;

export function rawEngagement(c: EngagementCounters): number {
  const tipMcb = Number(c.tipMcbTotal ?? 0) || 0;
  return (
    (c.likeCount ?? 0) * ENGAGEMENT_WEIGHTS.like +
    (c.commentCount ?? 0) * ENGAGEMENT_WEIGHTS.comment +
    (c.shareCount ?? 0) * ENGAGEMENT_WEIGHTS.share +
    (c.viewCount ?? 0) * ENGAGEMENT_WEIGHTS.view +
    (c.tipBpTotal ?? 0) * ENGAGEMENT_WEIGHTS.tipBp +
    tipMcb * ENGAGEMENT_WEIGHTS.tipMcb
  );
}

export function computeTrendingScore(
  row: EngagementCounters & {
    publishedAt: Date | null;
    createdAt: Date;
  },
): number {
  const published = row.publishedAt ?? row.createdAt;
  const hours = Math.max((Date.now() - published.getTime()) / 3_600_000, 1);
  return rawEngagement(row) / Math.pow(hours, 1.5);
}
