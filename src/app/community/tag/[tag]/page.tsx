import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityPublicShareShell } from "@/components/community/community-public-share-shell";
import { loginHrefFor, registerHrefFor } from "@/lib/auth-return-path";
import {
  CANONICAL_PRODUCTION_ORIGIN,
  getMetadataOrigin,
} from "@/lib/app-url";
import { communityEnabled } from "@/lib/community/config";
import { formatCompactCount } from "@/lib/community/format-count";
import { listPostsByHashtag } from "@/lib/community/search-service";
import {
  communityHubSharePath,
  communityPostSharePath,
  communityProfileCanonicalPath,
  communityTagAppPath,
  communityTagSharePath,
} from "@/lib/community/share-url";
import { SEO_KEYWORDS } from "@/lib/seo/site";
import { getSessionUserId } from "@/lib/session";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ tag: string }> };

function origin(): string {
  return getMetadataOrigin() || CANONICAL_PRODUCTION_ORIGIN;
}

function normalizeTag(raw: string): string {
  return decodeURIComponent(raw).trim().replace(/^#/, "").toLowerCase();
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: raw } = await params;
  const tag = normalizeTag(raw);
  const url = `${origin()}${communityTagSharePath(tag)}`;
  const title = `#${tag} · Crypto & Community McBuleli (RDC)`;
  const description = `Publications #${tag} sur McBuleli Community - crypto, USDT, P2P et mobile money en RDC et en Afrique.`;

  return {
    title,
    description,
    keywords: [`#${tag}`, tag, ...SEO_KEYWORDS],
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: "McBuleli",
      title,
      description,
      images: [{ url: `${origin()}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${origin()}/opengraph-image`],
    },
  };
}

export default async function CommunityPublicTagPage({ params }: Props) {
  const { tag: raw } = await params;
  const tag = normalizeTag(raw);
  const userId = await getSessionUserId();
  if (userId) redirect(communityTagAppPath(tag));

  const loginHref = loginHrefFor(communityTagAppPath(tag));
  const registerHref = registerHrefFor(communityTagAppPath(tag));

  if (!communityEnabled() || tag.length < 2) {
    return (
      <CommunityPublicShareShell
        loginHref={loginHref}
        registerHref={registerHref}
        notFound
        notFoundLabel="Hashtag introuvable."
      />
    );
  }

  const { hits } = await listPostsByHashtag({
    tag,
    viewerId: null,
    limit: 24,
  });

  return (
    <CommunityPublicShareShell
      loginHref={loginHref}
      registerHref={registerHref}
      primaryCta="Rejoindre pour commenter"
      secondaryCta="Voir dans McBuleli"
    >
      <div className="px-5 pt-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#305f33]">
          Hashtag · McBuleli Community
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-[#0c0a09]">#{tag}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[#57534e]">
          Contenu public autour de <strong>#{tag}</strong> - crypto, USDT, P2P
          et mobile money en RDC. Connectez-vous pour liker et répondre.
        </p>
        <p className="mt-3">
          <Link
            href={communityHubSharePath()}
            className="text-xs font-bold text-[#305f33] hover:underline"
          >
            ← Community
          </Link>
        </p>

        {hits.length === 0 ? (
          <p className="mt-6 text-sm text-[#78716c]">
            Pas encore de publications publiques pour #{tag}. Soyez le premier
            après inscription.
          </p>
        ) : (
          <ul className="mt-5 divide-y divide-[#e8f3ee]">
            {hits.map((hit) => {
              const snippet =
                hit.body.trim().length > 200
                  ? `${hit.body.trim().slice(0, 197)}…`
                  : hit.body.trim();
              return (
                <li key={hit.id} className="py-3.5">
                  <Link
                    href={communityPostSharePath(hit.id)}
                    className="block hover:opacity-90"
                  >
                    <p className="text-sm font-bold text-[#0c0a09]">
                      {hit.author.displayName}{" "}
                      <span className="font-semibold text-[#305f33]">
                        @{hit.author.handle}
                      </span>
                    </p>
                    {snippet ? (
                      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#44403c]">
                        {snippet}
                      </p>
                    ) : null}
                    <p className="mt-1.5 text-[11px] font-semibold text-[#a8a29e]">
                      {formatCompactCount(hit.likeCount)} likes ·{" "}
                      {formatCompactCount(hit.commentCount)} com. ·{" "}
                      {formatCompactCount(hit.viewCount)} vues
                    </p>
                  </Link>
                  <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <Link
                      href={communityProfileCanonicalPath(hit.author.handle)}
                      className="text-[11px] font-bold text-[#305f33] hover:underline"
                    >
                      Profil
                    </Link>
                    {hit.hashtags.slice(0, 4).map((t) => (
                      <Link
                        key={t}
                        href={communityTagSharePath(t)}
                        className="text-[11px] font-bold text-[#229ed9] hover:underline"
                      >
                        #{t}
                      </Link>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </CommunityPublicShareShell>
  );
}
