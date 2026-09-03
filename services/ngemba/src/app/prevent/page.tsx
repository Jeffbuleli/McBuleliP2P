import { Suspense } from "react";
import { StaticPageView } from "@/components/static-page-view";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function PreventPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <StaticPageView page="prevent" initialLocale={sp.lang} />
    </Suspense>
  );
}
