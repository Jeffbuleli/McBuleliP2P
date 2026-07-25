/** Shared hub payload types (no DB imports - safe for client components). */

export type HubOpenTeam = {
  id: string;
  name: string;
  inviteCode: string;
  memberCount: number;
  vacantRoles: string[];
  challenge: { id: string; labelFr: string; labelEn: string } | null;
};

export type HubPayloadOk = {
  edition: {
    id: string;
    slug: string;
    nameFr: string;
    nameEn: string;
    status: string;
    challengeLockAt: string | null;
    submissionDeadlineAt: string | null;
  };
  registration: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    paymentStatus: string;
    ticketCode: string | null;
    presenceStatus: string;
    passUrl: string | null;
    payUrl: string | null;
  } | null;
  isPaid: boolean;
  memberRole: string | null;
  formation: {
    softMaxTeams: number;
    targetTeamSize: number;
    teamCount: number;
    maxMembers: number;
    openTeams: HubOpenTeam[];
  };
  team: {
    id: string;
    name: string;
    slug: string;
    inviteCode: string;
    status: string;
    isSolo: boolean;
    challengeId: string | null;
    challenge: { id: string; labelFr: string; labelEn: string } | null;
    commsUrl: string | null;
    governanceNotes: string | null;
    members: Array<{
      id: string;
      role: string;
      joinedAt: string;
      registrationId: string;
      firstName: string;
      lastName: string;
      email: string;
      paymentStatus: string;
      presenceStatus: string;
    }>;
    messages: Array<{
      id: string;
      body: string;
      createdAt: string;
      authorRegistrationId: string;
      firstName: string;
      lastName: string;
    }>;
    rulesAcceptedAt: string | null;
    presentedAt: string | null;
    judgedAt: string | null;
  } | null;
  challenges: Array<{
    id: string;
    slug: string;
    labelFr: string;
    labelEn: string;
    blurbFr: string | null;
    blurbEn: string | null;
  }>;
  announcements: Array<{
    id: string;
    title: string;
    body: string;
    pinned: boolean;
    publishedAt: string;
  }>;
  submission: {
    id: string;
    status: string;
    demoUrl: string | null;
    githubUrl: string | null;
    figmaUrl: string | null;
    pitchPdfUrl: string | null;
    readmeUrl: string | null;
    notes: string | null;
    submittedAt: string | null;
  } | null;
  mentorRequests: Array<{
    id: string;
    topic: string;
    notes: string | null;
    status: string;
    createdAt: string;
  }>;
  program: Array<{
    day: number;
    labelFr: string;
    labelEn: string;
    subtitleFr: string;
    subtitleEn: string;
    slots: Array<{
      time: string;
      activityFr: string;
      activityEn: string;
      icon: string;
    }>;
  }>;
};
