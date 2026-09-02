import { HomeShell } from "@/components/home-shell";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <HomeShell initialLocale={sp.lang || "fr"} />;
}
