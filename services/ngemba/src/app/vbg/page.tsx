import { Suspense } from "react";
import { SchoolChat } from "@/components/school-chat";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function VbgPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <SchoolChat initialLocale={sp.lang} />
    </Suspense>
  );
}
