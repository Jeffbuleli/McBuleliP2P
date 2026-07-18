import type { Metadata } from "next";
import Link from "next/link";
import { CommunityPublicShareShell } from "@/components/community/community-public-share-shell";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";
import { communityEnabled } from "@/lib/community/config";
import { listFeedPosts } from "@/lib/community/feed-service";
import { formatCompactCount } from "@/lib/community/format-count";
import {
  communityHubAppPath,
  communityPostSharePath,
  communityProfileCanonicalPath,
  communityTagSharePath,
} from "@/lib/community/share-url";
import { COMMUNITY_SEO_TAGS, SEO_KEYWORDS } from "@/lib/seo/site";

export const dynamic = "force-dynamic";

function origin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

const TITLE =
  "McBuleli Community — Crypto, USDT & P2P en RDC et Afrique";
const DESCRIPTION =
  "Communauté crypto en RDC : USDT, P2P, mobile money (Orange, M-Pesa, Airtel), trading et builders à Kinshasa et en Afrique. Découvrez les publications et hashtags McBuleli.";

export async function generateMetadata(): Promise<Metadata> {
  const url = `${origin()}/community`;
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords: [...SEO_KEYWORDS],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "McBuleli",
      title: TITLE,
      description: DESCRIPTION,
      images: [{ url: `${origin()}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
      images: [`${origin()}/opengraph-image`],
    },
  };
}

export default async function CommunityPublicHubPage() {
  const loginHref = loginHrefFor(communityHubAppPath());
  const registerHref = registerHrefFor(communityHubAppPath());

  if (!communityEnabled()) {
    return (
      <CommunityPublicShareShell
        loginHref={loginHref}
        registerHref={registerHref}
        notFound
        notFoundLabel="Community est temporairement indisponible."
      />
    );
  }

  const { posts } = await listFeedPosts({
    viewerId: null,
    sort: "trending",
    limit: 16,
  });

  const tags = COMMUNITY_SEO_TAGS;

  return (
    <CommunityPublicShareShell
      loginHref={loginHref}
      registerHref={registerHref}
      primaryCta="Rejoindre la communauté"
      secondaryCta="Ouvrir Community"
    >
      <div className="px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#305f33]">
          Community · McBuleli
        </p>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-[#0c0a09]">
          Crypto & P2P en RDC
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534e]">
          Publications, hashtags et profils autour de l&apos;USDT, du mobile
          money et du trading en République démocratique du Congo et en Afrique.
          Lisez librement - connectez-vous pour liker, commenter et publier.
        </p>

        <section className="mt-5" aria-label="Hashtags populaires">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#78716c]">
            Hashtags
          </h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={communityTagSharePath(tag)}
                  className="inline-flex rounded-full bg-[#eaf5ee] px-3 py-1.5 text-xs font-bold text-[#305f33] ring-1 ring-[#305f33]/15 hover:bg-[#dcefe2]"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6" aria-label="Publications tendances">
          <h2 className="text-xs font-extrabold uppercase tracking-wide text-[#78716c]">
            Tendances
          </h2>
          {posts.length === 0 ? (
            <p className="mt-3 text-sm text-[#78716c]">
              Bientôt des publications publiques. Créez un compte pour démarrer.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-[#e8f3ee]">
              {posts.map((post) => {
                const snippet =
                  post.body.trim().length > 160
                    ? `${post.body.trim().slice(0, 157)}…`
                    : post.body.trim();
                return (
                  <li key={post.id} className="py-3">
                    <Link
                      href={communityPostSharePath(post.id)}
                      className="block hover:opacity-90"
                    >
                      <p className="text-sm font-bold text-[#0c0a09]">
                        {post.author.displayName}{" "}
                        <span className="font-semibold text-[#305f33]">
                          @{post.author.handle}
                        </span>
                      </p>
                      {snippet ? (
                        <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-[#44403c]">
                          {snippet}
                        </p>
                      ) : null}
                      <p className="mt-1.5 text-[11px] font-semibold text-[#a8a29e]">
                        {formatCompactCount(post.likeCount)} likes ·{" "}
                        {formatCompactCount(post.commentCount)} com. ·{" "}
                        {formatCompactCount(post.viewCount)} vues
                      </p>
                    </Link>
                    <p className="mt-1">
                      <Link
                        href={communityProfileCanonicalPath(post.author.handle)}
                        className="text-[11px] font-bold text-[#305f33] hover:underline"
                      >
                        Voir le profil
                      </Link>
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </CommunityPublicShareShell>
  );
}
