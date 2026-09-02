import { SosFlow } from "@/components/sos-flow";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function DiscretePage({ searchParams }: Props) {
  const sp = await searchParams;
  return <SosFlow initialLocale={sp.lang || "fr"} discrete />;
}
