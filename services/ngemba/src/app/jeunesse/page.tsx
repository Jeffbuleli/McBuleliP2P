import { Suspense } from "react";
import { YouthHub } from "@/components/youth-hub";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function JeunessePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <YouthHub initialLocale={sp.lang} />
    </Suspense>
  );
}
