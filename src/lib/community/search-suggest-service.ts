import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import {
  communityPosts,
  communityUserProfiles,
  getDb,
  users,
} from "@/db";
import {
  assistantOpenAiEnabled,
  completeChatJson,
} from "@/lib/assistant/openai-client";
import { communityEnabled } from "@/lib/community/config";
import { ensureCommunitySchema } from "@/lib/community/community-schema";
import { extractHashtags } from "@/lib/community/link-embed";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import { searchTradingSignals } from "@/lib/community/signals-service";
import {
  UTILITY_TAG_META,
  isUtilityTag,
} from "@/lib/community/utility-tags";

export type SearchSuggestKind =
  | "person"
  | "tag"
  | "post"
  | "signal"
  | "query"
  | "media";

export type SearchSuggestItem = {
  kind: SearchSuggestKind;
  id: string;
  label: string;
  subtitle?: string | null;
  href?: string | null;
  query?: string | null;
  avatarUrl?: string | null;
  mediaKind?: "image" | "video" | "text" | null;
  score: number;
};

export type CommunitySearchSuggestResult = {
  q: string;
  items: SearchSuggestItem[];
  ai: boolean;
};

function avatarForList(
  userId: string,
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  if (url.startsWith("data:image/")) return `/api/community/avatars/${userId}`;
  if (url.startsWith("data:") || url.startsWith("blob:")) return null;
  return normalizePublicMediaUrl(url) ?? url;
}

function escapeLike(term: string): string {
  return term.replace(/[%_\\]/g, "\\$&");
}

/** Rule-based expansions when AI is off / slow. */
function heuristicQueryHints(q: string, fr: boolean): SearchSuggestItem[] {
  const raw = q.trim().toLowerCase();
  if (raw.length < 2) return [];
  const out: SearchSuggestItem[] = [];
  const push = (query: string, label: string, score: number) => {
    out.push({
      kind: "query",
      id: `q:${query}`,
      label,
      subtitle: fr ? "Suggestion" : "Suggested",
      query,
      score,
    });
  };

  if (/form|live|academ|cours|train/i.test(raw)) {
    push("formation", fr ? "Formations & lives" : "Training & lives", 40);
  }
  if (/p2p|peer|echange|échange|usdt|cdf/i.test(raw)) {
    push("p2p", fr ? "P2P & échanges" : "P2P & trades", 38);
  }
  if (/signal|btc|eth|trade|chart/i.test(raw)) {
    push("signal", fr ? "Signaux trading" : "Trading signals", 36);
  }
  if (/avec|tontine|epargne|épargne/i.test(raw)) {
    push("avec", fr ? "Groupes AVEC" : "AVEC groups", 34);
  }
  if (/builder|ambassad/i.test(raw)) {
    push("builder", fr ? "Builders & ambassadeurs" : "Builders & ambassadors", 32);
  }

  for (const meta of UTILITY_TAG_META) {
    const label = fr ? meta.labelFr : meta.labelEn;
    if (
      meta.tag.includes(raw) ||
      label.toLowerCase().includes(raw) ||
      raw.includes(meta.tag)
    ) {
      push(`#${meta.tag}`, `#${meta.tag} · ${label}`, 30);
    }
  }

  return out.slice(0, 4);
}

async function aiPredictQueries(
  q: string,
  fr: boolean,
): Promise<{ queries: string[]; intent: string } | null> {
  if (!assistantOpenAiEnabled()) return null;
  if (q.trim().length < 3) return null;

  try {
    const raw = await Promise.race([
      completeChatJson({
        systemPrompt: `You power McBuleli Community search (crypto, P2P, Africa, trading, formations).
Given a partial user query, predict what they want.
Return JSON only:
{"intent":"people|tags|posts|signals|media|mixed","queries":["short search 1","..."]}
Rules:
- 3 to 6 queries max, short (2-5 words), searchable on the platform
- Include @handles or #tags when relevant
- Match the user language (${fr ? "French" : "English"})
- No explanations`,
        userMessage: q.slice(0, 120),
        maxTokens: 180,
        temperature: 0.2,
      }),
      // Soft deadline: typeahead must stay snappy; heuristics cover slow AI.
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("ai_timeout")), 320),
      ),
    ]);

    const parsed = JSON.parse(raw) as {
      intent?: string;
      queries?: unknown;
    };
    const queries = Array.isArray(parsed.queries)
      ? parsed.queries
          .filter((x): x is string => typeof x === "string")
          .map((s) => s.trim())
          .filter((s) => s.length >= 2 && s.length <= 48)
          .slice(0, 6)
      : [];
    if (!queries.length) return null;
    return {
      intent: typeof parsed.intent === "string" ? parsed.intent : "mixed",
      queries,
    };
  } catch {
    return null;
  }
}

/**
 * Instant typeahead: people, #tags, posts, media kinds, signals + optional AI hints.
 * Starts from 1 character (faster for @ / # prefixes).
 */
export async function suggestCommunitySearch(args: {
  q: string;
  viewerId: string | null;
  fr?: boolean;
  limit?: number;
}): Promise<CommunitySearchSuggestResult> {
  const fr = !!args.fr;
  const raw = args.q.trim();
  if (!communityEnabled() || raw.length < 1) {
    return { q: raw, items: [], ai: false };
  }

  await ensureCommunitySchema();
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 12, 4), 20);
  const wantsPeople = raw.startsWith("@");
  const wantsTag = raw.startsWith("#");
  const term = escapeLike(raw.replace(/^[@#]/, "").trim().toLowerCase());
  if (!term && !wantsPeople && !wantsTag) {
    return { q: raw, items: [], ai: false };
  }

  const items: SearchSuggestItem[] = [];
  const seen = new Set<string>();
  const add = (item: SearchSuggestItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    items.push(item);
  };

  const prefix = `${term}%`;
  const contains = `%${term}%`;

  // Kick off AI in parallel so typeahead stays snappy.
  const aiPromise =
    term.length >= 3 && !wantsPeople && !wantsTag
      ? aiPredictQueries(raw, fr)
      : Promise.resolve(null);

  const peoplePromise =
    !wantsTag && term.length >= 1
      ? db
          .select({
            userId: communityUserProfiles.userId,
            handle: communityUserProfiles.handle,
            displayName: communityUserProfiles.displayName,
            reputationScore: communityUserProfiles.reputationScore,
            avatarUrl: users.avatarUrl,
          })
          .from(communityUserProfiles)
          .innerJoin(users, eq(users.id, communityUserProfiles.userId))
          .where(
            or(
              ilike(communityUserProfiles.handle, prefix),
              ilike(communityUserProfiles.handle, contains),
              ilike(communityUserProfiles.displayName, contains),
            ),
          )
          .orderBy(
            desc(
              sql`case when ${communityUserProfiles.handle} ilike ${prefix} then 2 when ${communityUserProfiles.displayName} ilike ${prefix} then 1 else 0 end`,
            ),
            desc(communityUserProfiles.reputationScore),
          )
          .limit(wantsPeople ? 8 : 5)
      : Promise.resolve([]);

  const tagsPromise =
    !wantsPeople && term.length >= 1
      ? db
          .select({
            body: communityPosts.body,
            n: sql<number>`(${communityPosts.likeCount} + ${communityPosts.commentCount} + ${communityPosts.viewCount})`,
          })
          .from(communityPosts)
          .where(
            and(
              eq(communityPosts.status, "published"),
              ilike(communityPosts.body, `%#${term}%`),
            ),
          )
          .orderBy(
            desc(sql`(${communityPosts.likeCount} + ${communityPosts.viewCount})`),
          )
          .limit(40)
      : Promise.resolve([]);

  const wantsMedia = /img|photo|image|pic|vid|video|média|media/i.test(term);
  const postsPromise =
    !wantsPeople && !wantsTag && term.length >= 1
      ? db
          .select({
            id: communityPosts.id,
            body: communityPosts.body,
            postType: communityPosts.postType,
            contentKind: communityPosts.contentKind,
            likeCount: communityPosts.likeCount,
            viewCount: communityPosts.viewCount,
          })
          .from(communityPosts)
          .where(
            and(
              eq(communityPosts.status, "published"),
              wantsMedia
                ? or(
                    eq(communityPosts.postType, "image"),
                    eq(communityPosts.postType, "video"),
                    ilike(communityPosts.body, contains),
                  )!
                : or(
                    ilike(communityPosts.body, contains),
                    ilike(communityPosts.utilityTag, contains),
                    ilike(communityPosts.contentKind, contains),
                  )!,
            ),
          )
          .orderBy(
            desc(
              sql`(${communityPosts.likeCount} + ${communityPosts.commentCount} + ${communityPosts.viewCount})`,
            ),
            desc(communityPosts.publishedAt),
          )
          .limit(5)
      : Promise.resolve([]);

  const signalsPromise =
    !wantsPeople && !wantsTag && term.length >= 2
      ? searchTradingSignals({ q: term, limit: 3 }).catch(() => [])
      : Promise.resolve([]);

  const [people, tagRows, posts, signals, predicted] = await Promise.all([
    peoplePromise,
    tagsPromise,
    postsPromise,
    signalsPromise,
    aiPromise,
  ]);

  for (const p of people) {
    add({
      kind: "person",
      id: `person:${p.userId}`,
      label: p.displayName,
      subtitle: `@${p.handle}`,
      href: `/app/community/u/${p.handle}`,
      query: `@${p.handle}`,
      avatarUrl: avatarForList(p.userId, p.avatarUrl),
      score: 100,
    });
  }

  if (!wantsPeople && term.length >= 1) {
    const tagScore = new Map<string, number>();
    for (const row of tagRows) {
      for (const tag of extractHashtags(row.body)) {
        if (!tag.startsWith(term) && !tag.includes(term)) continue;
        tagScore.set(tag, (tagScore.get(tag) ?? 0) + Number(row.n) + 1);
      }
    }
    const sortedTags = [...tagScore.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, wantsTag ? 8 : 4);
    for (const [tag, score] of sortedTags) {
      add({
        kind: "tag",
        id: `tag:${tag}`,
        label: `#${tag}`,
        subtitle: fr ? "Hashtag" : "Hashtag",
        href: `/app/community/tag/${encodeURIComponent(tag)}`,
        query: `#${tag}`,
        score: 80 + Math.min(20, score),
      });
    }

    if (isUtilityTag(term) || term.length >= 2) {
      for (const meta of UTILITY_TAG_META) {
        if (
          meta.tag.startsWith(term) ||
          (fr ? meta.labelFr : meta.labelEn).toLowerCase().includes(term)
        ) {
          add({
            kind: "tag",
            id: `util:${meta.tag}`,
            label: `#${meta.tag}`,
            subtitle: fr ? meta.labelFr : meta.labelEn,
            query: meta.tag,
            score: 70,
          });
        }
      }
    }
  }

  for (const p of posts) {
    const snippet = p.body.replace(/\s+/g, " ").trim().slice(0, 72);
    const mediaKind =
      p.postType === "video"
        ? "video"
        : p.postType === "image"
          ? "image"
          : "text";
    add({
      kind: mediaKind === "text" ? "post" : "media",
      id: `post:${p.id}`,
      label: snippet || (fr ? "Publication" : "Post"),
      subtitle:
        mediaKind === "video"
          ? fr
            ? "Vidéo"
            : "Video"
          : mediaKind === "image"
            ? fr
              ? "Photo"
              : "Photo"
            : p.contentKind ?? "post",
      href: `/app/community/post/${p.id}`,
      query: snippet.slice(0, 40) || term,
      mediaKind,
      score: 55 + Math.min(20, Number(p.likeCount) + Number(p.viewCount) / 10),
    });
  }

  for (const s of signals) {
    add({
      kind: "signal",
      id: `signal:${s.id}`,
      label: `${s.side.toUpperCase()} ${s.symbol}`.trim(),
      subtitle: fr ? "Signal trading" : "Trading signal",
      href: `/app/community/signals`,
      query: s.symbol || term,
      score: 50,
    });
  }

  let ai = false;
  for (const h of heuristicQueryHints(raw, fr)) add(h);

  if (predicted) {
    ai = true;
    for (const query of predicted.queries) {
      add({
        kind: "query",
        id: `ai:${query.toLowerCase()}`,
        label: query,
        subtitle: fr ? "Prédiction IA" : "AI prediction",
        query,
        score: 45,
      });
    }
  }

  items.sort((a, b) => b.score - a.score);
  return { q: raw, items: items.slice(0, limit), ai };
}
