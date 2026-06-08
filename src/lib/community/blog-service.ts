import { and, desc, eq, inArray, lt } from "drizzle-orm";
import {
  communityBlogCategories,
  communityBlogPosts,
  getDb,
} from "@/db";
import { getAuthorsMap, type CommunityAuthorView } from "@/lib/community/profile-service";
import { grantCommunityBlogPublished } from "@/lib/community/rewards-service";

export type BlogCategoryView = {
  id: string;
  slug: string;
  labelFr: string;
  labelEn: string;
};

export type BlogPostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: string;
  author: CommunityAuthorView;
  category: BlogCategoryView | null;
  coverUrl: string | null;
};

export type BlogPostDetail = BlogPostListItem & {
  body: string;
  status: string;
};

function slugify(title: string, suffix: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return `${base || "article"}-${suffix.slice(0, 8)}`;
}

export async function listBlogCategories(): Promise<BlogCategoryView[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(communityBlogCategories)
    .orderBy(communityBlogCategories.sortOrder);
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    labelFr: r.labelFr,
    labelEn: r.labelEn,
  }));
}

async function mapBlogRows(
  rows: (typeof communityBlogPosts.$inferSelect)[],
): Promise<BlogPostListItem[]> {
  if (!rows.length) return [];
  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await getAuthorsMap(authorIds);
  const db = getDb();

  const categoryIds = [
    ...new Set(rows.map((r) => r.categoryId).filter(Boolean)),
  ] as string[];
  const categories =
    categoryIds.length > 0
      ? await db
          .select()
          .from(communityBlogCategories)
          .where(inArray(communityBlogCategories.id, categoryIds))
      : [];
  const catById = new Map(categories.map((c) => [c.id, c]));

  const coverIds = [
    ...new Set(rows.map((r) => r.coverMediaId).filter(Boolean)),
  ] as string[];
  let coverUrls = new Map<string, string>();
  if (coverIds.length) {
    const { getMediaUrls } = await import("@/lib/community/media-service");
    const media = await getMediaUrls(coverIds);
    coverUrls = new Map(media.map((m) => [m.id, m.url]));
  }

  return rows.map((r) => {
    const cat = r.categoryId ? catById.get(r.categoryId) : null;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt,
      publishedAt: (r.publishedAt ?? r.createdAt).toISOString(),
      author: authors.get(r.authorId)!,
      category: cat
        ? {
            id: cat.id,
            slug: cat.slug,
            labelFr: cat.labelFr,
            labelEn: cat.labelEn,
          }
        : null,
      coverUrl: r.coverMediaId ? (coverUrls.get(r.coverMediaId) ?? null) : null,
    };
  });
}

export async function listPublishedBlogs(args: {
  cursor?: string | null;
  limit?: number;
  categorySlug?: string;
  authorId?: string;
}): Promise<{ posts: BlogPostListItem[]; nextCursor: string | null }> {
  const db = getDb();
  const limit = Math.min(Math.max(args.limit ?? 15, 1), 40);

  let categoryId: string | undefined;
  if (args.categorySlug) {
    const [cat] = await db
      .select({ id: communityBlogCategories.id })
      .from(communityBlogCategories)
      .where(eq(communityBlogCategories.slug, args.categorySlug))
      .limit(1);
    categoryId = cat?.id;
    if (!categoryId) return { posts: [], nextCursor: null };
  }

  const conditions = [eq(communityBlogPosts.status, "published")];
  if (categoryId) conditions.push(eq(communityBlogPosts.categoryId, categoryId));
  if (args.authorId) conditions.push(eq(communityBlogPosts.authorId, args.authorId));
  if (args.cursor) {
    conditions.push(lt(communityBlogPosts.publishedAt, new Date(args.cursor)));
  }

  const rows = await db
    .select()
    .from(communityBlogPosts)
    .where(and(...conditions))
    .orderBy(desc(communityBlogPosts.publishedAt))
    .limit(limit + 1);

  const slice = rows.slice(0, limit);
  const posts = await mapBlogRows(slice);
  const nextCursor =
    rows.length > limit
      ? slice[slice.length - 1]!.publishedAt!.toISOString()
      : null;

  return { posts, nextCursor };
}

export async function getBlogBySlug(
  slug: string,
): Promise<BlogPostDetail | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityBlogPosts)
    .where(eq(communityBlogPosts.slug, slug))
    .limit(1);
  if (!row || row.status !== "published") return null;

  const [item] = await mapBlogRows([row]);
  return { ...item!, body: row.body, status: row.status };
}

export async function createBlogPost(args: {
  authorId: string;
  title: string;
  body: string;
  excerpt?: string;
  categoryId?: string;
  coverMediaId?: string;
  publish?: boolean;
}): Promise<
  | { ok: true; post: BlogPostDetail; bpGranted?: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  if (args.title.trim().length < 10) return { ok: false, error: "title_too_short" };
  if (args.body.trim().length < 200) return { ok: false, error: "body_too_short" };

  const db = getDb();
  const slug = slugify(args.title, crypto.randomUUID());

  const [row] = await db
    .insert(communityBlogPosts)
    .values({
      authorId: args.authorId,
      slug,
      title: args.title.trim().slice(0, 200),
      excerpt: args.excerpt?.trim().slice(0, 320) ?? null,
      body: args.body.trim(),
      categoryId: args.categoryId ?? null,
      coverMediaId: args.coverMediaId ?? null,
      status: args.publish ? "published" : "draft",
      publishedAt: args.publish ? new Date() : null,
    })
    .returning();

  const [item] = await mapBlogRows([row!]);
  let bpGranted: { granted: boolean; points: number } | undefined;
  if (args.publish) {
    const bp = await grantCommunityBlogPublished({
      userId: args.authorId,
      blogId: row!.id,
      bodyLength: args.body.length,
    });
    bpGranted = { granted: bp.granted, points: bp.points };
  }

  return {
    ok: true,
    post: { ...item!, body: row!.body, status: row!.status },
    bpGranted,
  };
}

export async function publishBlogPost(args: {
  authorId: string;
  slug: string;
}): Promise<
  | { ok: true; post: BlogPostDetail; bpGranted: { granted: boolean; points: number } }
  | { ok: false; error: string }
> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(communityBlogPosts)
    .where(eq(communityBlogPosts.slug, args.slug))
    .limit(1);

  if (!row) return { ok: false, error: "not_found" };
  if (row.authorId !== args.authorId) return { ok: false, error: "forbidden" };
  if (row.status === "published") return { ok: false, error: "already_published" };
  if (row.body.length < 200) return { ok: false, error: "body_too_short" };

  const [updated] = await db
    .update(communityBlogPosts)
    .set({
      status: "published",
      publishedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(communityBlogPosts.id, row.id))
    .returning();

  const bp = await grantCommunityBlogPublished({
    userId: args.authorId,
    blogId: row.id,
    bodyLength: row.body.length,
  });

  const [item] = await mapBlogRows([updated!]);
  return {
    ok: true,
    post: { ...item!, body: updated!.body, status: updated!.status },
    bpGranted: { granted: bp.granted, points: bp.points },
  };
}
