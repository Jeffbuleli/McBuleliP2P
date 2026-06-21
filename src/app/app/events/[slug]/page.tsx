import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { academyEditions, getDb } from "@/db";
import { getEventByIdOrSlug } from "@/lib/events/events-service";

export const dynamic = "force-dynamic";

export default async function EventRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventByIdOrSlug(slug);
  if (!event) redirect("/app/academy");

  if (event.editionId) {
    const [ed] = await getDb()
      .select({ slug: academyEditions.slug })
      .from(academyEditions)
      .where(eq(academyEditions.id, event.editionId))
      .limit(1);
    if (ed) redirect(`/app/academy/${ed.slug}/event/${event.slug}`);
  }

  redirect("/app/academy");
}
