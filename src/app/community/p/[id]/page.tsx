import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPublicPostForShare } from "@/lib/community/feed-service";
import { communityPostSharePath } from "@/lib/community/share-url";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

function shareOrigin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const post = await getPublicPostForShare(id);
  const origin = shareOrigin();
  const url = `${origin}${communityPostSharePath(id)}`;

  if (!post) {
    return {
      title: "Publication introuvable",
      openGraph: { url, siteName: "McBuleli" },
    };
  }

  const title = `${post.authorDisplayName} (@${post.authorHandle})`;
  const description =
    post.body.length > 200 ? `${post.body.slice(0, 197)}…` : post.body;
  const images = post.imageUrl
    ? [{ url: post.imageUrl, width: 1200, height: 630, alt: title }]
    : [{ url: `${origin}/opengraph-image`, width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: {
      type: "article",
      url,
      siteName: "McBuleli",
      title,
      description,
      images,
      publishedTime: post.publishedAt,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((img) => img.url),
    },
  };
}

export default async function CommunityPostSharePage({ params }: Props) {
  const { id } = await params;
  const post = await getPublicPostForShare(id);
  const appHref = `/login?next=${encodeURIComponent(`/app/community?post=${id}`)}`;

  if (!post) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm text-stone-600">Publication introuvable.</p>
        <Link href="/" className="mt-4 text-sm font-semibold text-[#305f33]">
          mcbuleli.org
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-lg bg-[#fafaf9] px-4 py-8">
      <article className="overflow-hidden rounded-2xl border border-[#e8f3ee] bg-white shadow-sm">
        {post.imageUrl ? (
          <div className="relative aspect-[16/10] w-full bg-black">
            <Image
              src={post.imageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              unoptimized
            />
          </div>
        ) : null}
        <div className="p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-[#305f33]">
            McBuleli Community
          </p>
          <h1 className="mt-2 text-lg font-bold text-[#0c0a09]">
            {post.authorDisplayName}
            <span className="ml-2 text-sm font-semibold text-[#78716c]">
              @{post.authorHandle}
            </span>
          </h1>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
            {post.body}
          </p>
          <Link
            href={appHref}
            className="mt-6 flex min-h-[48px] items-center justify-center rounded-xl bg-[#305f33] text-sm font-bold text-white"
          >
            Ouvrir dans McBuleli
          </Link>
        </div>
      </article>
    </main>
  );
}
