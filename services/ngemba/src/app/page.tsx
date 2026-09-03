import { Suspense } from "react";
import { HomeShell } from "@/components/home-shell";

type Props = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function HomePage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <Suspense
      fallback={
        <main className="mx-auto min-h-dvh max-w-md px-4 py-20 text-sm text-ng-muted">
          ...
        </main>
      }
    >
      <HomeShell initialLocale={sp.lang} />
    </Suspense>
  );
}
