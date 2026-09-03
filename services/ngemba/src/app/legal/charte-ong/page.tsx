import { Suspense } from "react";
import { StaticPageView } from "@/components/static-page-view";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function CharteOngPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <StaticPageView page="charter" initialLocale={sp.lang} />
    </Suspense>
  );
}
