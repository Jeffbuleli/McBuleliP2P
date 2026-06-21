import { redirect } from "next/navigation";

export default async function AcademyEventAliasPage({
  params,
  searchParams,
}: {
  params: Promise<{ editionSlug: string; eventSlug: string }>;
  searchParams: Promise<{ program?: string }>;
}) {
  const { editionSlug, eventSlug } = await params;
  const sp = await searchParams;
  const q = sp.program ? `?program=${encodeURIComponent(sp.program)}` : "";
  redirect(`/app/academy/${editionSlug}/live/${eventSlug}${q}`);
}
