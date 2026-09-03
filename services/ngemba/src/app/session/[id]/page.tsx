import { Suspense } from "react";
import { SessionView } from "@/components/session-view";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lang?: string; discrete?: string }>;
};

export default async function SessionPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  return (
    <Suspense fallback={null}>
      <SessionView
        id={id}
        initialLocale={sp.lang}
        discrete={sp.discrete === "1"}
      />
    </Suspense>
  );
}
