import { Suspense } from "react";
import { SchoolFlow } from "@/components/school-flow";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function SchoolPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <SchoolFlow initialLocale={sp.lang} />
    </Suspense>
  );
}
