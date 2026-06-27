import { communityImageVariant } from "@/lib/community/data-saver";
import { normalizePublicMediaUrl } from "@/lib/media-url";
import type { CommunityAuthorView } from "@/lib/community/profile-service";

export type MediaItemView = {
  id: string;
  url: string;
  variants: Record<string, string> | null;
  fileType: string;
  mimeType: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
};

export type MediaCommentView = {
  id: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  author: CommunityAuthorView;
};

export function asMediaItemView(item: {
  id: string;
  url: string;
  variants: Record<string, string> | null;
  fileType?: string;
  mimeType?: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  likedByMe?: boolean;
}): MediaItemView {
  return {
    id: item.id,
    url: item.url,
    variants: item.variants,
    fileType: item.fileType ?? "image",
    mimeType: item.mimeType ?? "",
    likeCount: item.likeCount ?? 0,
    commentCount: item.commentCount ?? 0,
    shareCount: item.shareCount ?? 0,
    likedByMe: item.likedByMe ?? false,
  };
}

export function mediaDisplayUrl(media: MediaItemView): string {
  const base = normalizePublicMediaUrl(media.url) ?? media.url;
  const picked = communityImageVariant(media.variants, base) ?? base;
  return normalizePublicMediaUrl(picked) ?? picked;
}
