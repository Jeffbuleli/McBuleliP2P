/** Client-safe story types & constants (no DB imports). */

export const STORY_REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👏", "🔥"] as const;
export type StoryReactionEmoji = (typeof STORY_REACTION_EMOJIS)[number];

export type CommunityStoryItem = {
  id: string;
  type: "text" | "image" | "video";
  body: string | null;
  mediaUrl: string | null;
  bgColor: string | null;
  createdAt: string;
  expiresAt: string;
};

export type StoryReactionCount = { emoji: string; count: number };

export type CommunityStoryRing = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isMe: boolean;
  hasUnseen: boolean;
  previewType: "text" | "image" | "video";
  previewUrl: string | null;
  previewBg: string | null;
  previewText: string | null;
  stories: CommunityStoryItem[];
};

export type StoryEngagementUser = {
  userId: string;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
};

export type StoryEngagement = {
  viewCount: number;
  reactions: StoryReactionCount[];
  myReaction: string | null;
  viewers?: StoryEngagementUser[];
  reactors?: (StoryEngagementUser & { emoji: string })[];
};
