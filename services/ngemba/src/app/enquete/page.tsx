import { Suspense } from "react";
import { CommunitySurvey } from "@/components/community-survey";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function EnquetePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <CommunitySurvey initialLocale={sp.lang} />
    </Suspense>
  );
}
