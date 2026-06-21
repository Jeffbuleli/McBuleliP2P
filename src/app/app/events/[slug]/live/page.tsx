import { redirect } from "next/navigation";

export default async function EventLiveRedirectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/app/events/${slug}`);
}
