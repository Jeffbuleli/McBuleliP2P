import { Suspense } from "react";
import { PartnersDirectoryView } from "@/components/partners-directory";

type Props = { searchParams: Promise<{ lang?: string }> };

export default async function PartenairesPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <PartnersDirectoryView initialLocale={sp.lang} />
    </Suspense>
  );
}
