import {
  COMMUNITY_REWARD_DAILY_CAPS,
  REWARD_BP_PER_MCB_CLAIM,
  REWARD_GRANT,
  REWARD_POINTS,
} from "@/lib/reward-points-config";

export type CommunityRewardCatalogItem = {
  id: string;
  points: number;
  dailyCap: number | null;
  labelFr: string;
  labelEn: string;
  icon: "post" | "comment" | "like" | "share" | "blog" | "qa" | "live" | "profile";
};

export const COMMUNITY_REWARDS_CATALOG: CommunityRewardCatalogItem[] = [
  {
    id: REWARD_GRANT.COMMUNITY_PROFILE_SETUP,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_PROFILE_SETUP],
    dailyCap: 1,
    labelFr: "Compléter votre profil communauté",
    labelEn: "Complete your community profile",
    icon: "profile",
  },
  {
    id: REWARD_GRANT.COMMUNITY_FIRST_POST,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_FIRST_POST],
    dailyCap: 1,
    labelFr: "Bonus - première publication",
    labelEn: "Bonus - first post",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_POST_TEXT,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_TEXT],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_POST_TEXT] ?? null,
    labelFr: "Publier un post (texte)",
    labelEn: "Publish a text post",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_POST_IMAGE,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_IMAGE],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_POST_IMAGE] ?? null,
    labelFr: "Publier avec image",
    labelEn: "Post with image",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_POST_VIDEO,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_POST_VIDEO],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_POST_VIDEO] ?? null,
    labelFr: "Publier avec vidéo",
    labelEn: "Post with video",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_COMMENT,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_COMMENT],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_COMMENT] ?? null,
    labelFr: "Commenter une publication",
    labelEn: "Comment on a post",
    icon: "comment",
  },
  {
    id: REWARD_GRANT.COMMUNITY_LIKE,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIKE],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_LIKE] ?? null,
    labelFr: "Aimer une publication",
    labelEn: "Like a post",
    icon: "like",
  },
  {
    id: REWARD_GRANT.COMMUNITY_LIKE_RECEIVED,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIKE_RECEIVED],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_LIKE_RECEIVED] ?? null,
    labelFr: "Recevoir un like sur votre contenu",
    labelEn: "Receive a like on your content",
    icon: "like",
  },
  {
    id: REWARD_GRANT.COMMUNITY_SHARE,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_SHARE],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_SHARE] ?? null,
    labelFr: "Partager une publication",
    labelEn: "Share a post",
    icon: "share",
  },
  {
    id: REWARD_GRANT.COMMUNITY_BLOG_PUBLISH,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_BLOG_PUBLISH],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_BLOG_PUBLISH] ?? null,
    labelFr: "Publier un article blog",
    labelEn: "Publish a blog article",
    icon: "blog",
  },
  {
    id: REWARD_GRANT.COMMUNITY_QUESTION,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_QUESTION],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_QUESTION] ?? null,
    labelFr: "Poser une question",
    labelEn: "Ask a question",
    icon: "qa",
  },
  {
    id: REWARD_GRANT.COMMUNITY_ANSWER,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_ANSWER],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_ANSWER] ?? null,
    labelFr: "Répondre à une question",
    labelEn: "Answer a question",
    icon: "qa",
  },
  {
    id: REWARD_GRANT.COMMUNITY_ANSWER_ACCEPTED,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_ANSWER_ACCEPTED],
    dailyCap: 10,
    labelFr: "Réponse acceptée (meilleure réponse)",
    labelEn: "Accepted answer (best answer)",
    icon: "qa",
  },
  {
    id: REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_ANSWER_UPVOTE] ?? null,
    labelFr: "Recevoir un vote sur votre réponse",
    labelEn: "Receive an upvote on your answer",
    icon: "qa",
  },
  {
    id: REWARD_GRANT.COMMUNITY_LIVE_JOIN,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_LIVE_JOIN],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_LIVE_JOIN] ?? null,
    labelFr: "Rejoindre une formation live",
    labelEn: "Join a live training session",
    icon: "live",
  },
  {
    id: REWARD_GRANT.COMMUNITY_STORY_TEXT,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_STORY_TEXT],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_STORY_TEXT] ?? null,
    labelFr: "Publier un statut (texte)",
    labelEn: "Publish a text status",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_STORY_IMAGE,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_STORY_IMAGE],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_STORY_IMAGE] ?? null,
    labelFr: "Publier un statut (photo)",
    labelEn: "Publish a photo status",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_STORY_VIDEO,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_STORY_VIDEO],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_STORY_VIDEO] ?? null,
    labelFr: "Publier un statut (vidéo)",
    labelEn: "Publish a video status",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_STORY_VIEW,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_STORY_VIEW],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_STORY_VIEW] ?? null,
    labelFr: "Voir un statut communautaire",
    labelEn: "View a community status",
    icon: "post",
  },
  {
    id: REWARD_GRANT.COMMUNITY_STORY_VIEW_RECEIVED,
    points: REWARD_POINTS[REWARD_GRANT.COMMUNITY_STORY_VIEW_RECEIVED],
    dailyCap: COMMUNITY_REWARD_DAILY_CAPS[REWARD_GRANT.COMMUNITY_STORY_VIEW_RECEIVED] ?? null,
    labelFr: "Quelqu'un voit votre statut",
    labelEn: "Someone views your status",
    icon: "post",
  },
];

export function communityRewardsMeta() {
  return {
    bpPerMcb: REWARD_BP_PER_MCB_CLAIM,
    catalog: COMMUNITY_REWARDS_CATALOG,
  };
}
