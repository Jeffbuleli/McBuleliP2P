export const EventType = {
  FREE: "FREE",
  PAID: "PAID",
} as const;
export type EventTypeValue = (typeof EventType)[keyof typeof EventType];

export const EventVisibility = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
  COMMUNITY: "COMMUNITY",
} as const;
export type EventVisibilityValue = (typeof EventVisibility)[keyof typeof EventVisibility];

export const EventStatus = {
  DRAFT: "DRAFT",
  PUBLISHED: "PUBLISHED",
  LIVE: "LIVE",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;
export type EventStatusValue = (typeof EventStatus)[keyof typeof EventStatus];

export const EventAudienceMode = {
  ALL_ACADEMY_MEMBERS: "ALL_ACADEMY_MEMBERS",
  MANUAL: "MANUAL",
} as const;
export type EventAudienceModeValue =
  (typeof EventAudienceMode)[keyof typeof EventAudienceMode];

export const ParticipantStatus = {
  INVITED: "INVITED",
  ENROLLED: "ENROLLED",
  ATTENDED: "ATTENDED",
  ABSENT: "ABSENT",
} as const;
export type ParticipantStatusValue =
  (typeof ParticipantStatus)[keyof typeof ParticipantStatus];

export const PaymentStatus = {
  FREE: "FREE",
  PENDING: "PENDING",
  PAID: "PAID",
  FAILED: "FAILED",
} as const;
export type PaymentStatusValue = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EventReminderKind = {
  D7: "7d",
  D1: "24h",
  H1: "1h",
  M15: "15m",
  START: "start",
} as const;
export type EventReminderKindValue =
  (typeof EventReminderKind)[keyof typeof EventReminderKind];

export const EventRole = {
  SYSTEM_ADMIN: "SYSTEM_ADMIN",
  ACADEMY_ADMIN: "ACADEMY_ADMIN",
  TRAINER: "TRAINER",
  STUDENT: "STUDENT",
} as const;
export type EventRoleValue = (typeof EventRole)[keyof typeof EventRole];

export type PosterTemplate = "portrait" | "square" | "banner";

export type EventRecord = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  coverImage: string | null;
  trainerId: string;
  trainerName: string;
  startDate: Date;
  endDate: Date;
  timezone: string;
  durationMinutes: number;
  locationType: string;
  liveRoomId: string | null;
  liveRoomUrl: string | null;
  maxParticipants: number | null;
  price: string;
  currency: string;
  eventType: EventTypeValue;
  visibility: EventVisibilityValue;
  audienceMode: EventAudienceModeValue;
  status: EventStatusValue;
  communityPostId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type EventPublicView = Omit<EventRecord, "liveRoomUrl"> & {
  platformLabel: "McBuleli Live";
  joinPath: string;
  priceUsdt: number;
  participantCount?: number;
};

export type CreateEventInput = {
  title: string;
  description?: string;
  category?: string;
  coverImage?: string | null;
  trainerId: string;
  trainerName: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  durationMinutes?: number;
  locationType?: string;
  maxParticipants?: number | null;
  price?: number;
  currency?: string;
  eventType?: EventTypeValue;
  visibility?: EventVisibilityValue;
  audienceMode?: EventAudienceModeValue;
};

export type EventDashboardKpis = {
  totalEvents: number;
  enrolledParticipants: number;
  attendedParticipants: number;
  participationRate: number;
  revenueUsdt: number;
  upcomingCount: number;
};
