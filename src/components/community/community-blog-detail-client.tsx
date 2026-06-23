"use client";

import Link from "next/link";
import { useI18n } from "@/components/i18n-provider";
import type { BlogPostDetail } from "@/lib/community/blog-service";

export function CommunityBlogDetailClient({ post }: { post: BlogPostDetail }) {
  const { locale } = useI18n();
  const fr = locale === "fr";

  return (
    <div className="community-theme mx-auto w-full max-w-lg px-4 pb-4 pt-4">
      <Link href="/app/community/blogs" className="text-sm font-semibold text-[#305f33]">
        ← Blogs
      </Link>
      <article className="fd-card mt-4 px-4 py-4">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverUrl}
            alt=""
            className="mb-3 h-40 w-full rounded-xl object-cover"
          />
        ) : null}
        <h1 className="text-xl font-bold text-[#0c0a09]">{post.title}</h1>
        <p className="mt-1 text-xs text-[#78716c]">
          <Link
            href={`/app/community/u/${post.author.handle}`}
            className="font-semibold text-[#305f33]"
          >
            @{post.author.handle}
          </Link>
          {" · "}
          {new Date(post.publishedAt).toLocaleDateString(fr ? "fr-FR" : "en-US")}
        </p>
        <div className="prose-community mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
          {post.body}
        </div>
      </article>
    </div>
  );
}
