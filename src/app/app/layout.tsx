import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/LogoutButton";
import { getSessionUserId } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-10 pt-4">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/app" className="text-lg font-bold text-emerald-900">
          McBuleli
        </Link>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
