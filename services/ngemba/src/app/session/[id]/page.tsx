import { SessionView } from "@/components/session-view";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function SessionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  return <SessionView id={id} initialLocale={sp.lang || "fr"} />;
}
