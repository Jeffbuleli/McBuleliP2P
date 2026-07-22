import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PartnerMeetLanding } from "@/components/partner-meet/partner-meet-landing";
import {
  canHostPartnerMeet,
  ensurePartnerMeet,
  partnerMeetHostPath,
  partnerMeetJoinPath,
} from "@/lib/partner-meet";
import { getSessionUser } from "@/lib/session-user";
import { eq } from "drizzle-orm";
import { getDb, users } from "@/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meet = await ensurePartnerMeet(slug);
  if (!meet) return { title: "McBuleli Meet" };
  return {
    title: `RDV partenariat · ${meet.partnerName} · McBuleli Meet`,
    description: `RDV partenariat ${meet.partnerName} sur McBuleli Meet.`,
  };
}

export default async function PartnerMeetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const meet = await ensurePartnerMeet(slug);
  if (!meet) notFound();

  const user = await getSessionUser();
  let showHostLink = false;
  if (user) {
    const [profile] = await getDb()
      .select({ email: users.email })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);
    showHostLink = canHostPartnerMeet({
      userEmail: profile?.email ?? user.email,
      appRole: user.role,
      meet,
    });
  }

  return (
    <PartnerMeetLanding
      meet={meet}
      joinHref={partnerMeetJoinPath(meet.slug)}
      hostHref={partnerMeetHostPath(meet.slug)}
      showHostLink={showHostLink}
    />
  );
}
