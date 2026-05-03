import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session-user";
import { LogoutButton } from "@/components/LogoutButton";
import { getDictionary } from "@/i18n/messages";
import { getLocale } from "@/lib/get-locale";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const u = await getSessionUser();
  if (!u) {
    redirect("/login");
  }
  if (u.role !== "agent" && u.role !== "super_admin") {
    redirect("/app");
  }

  const d = getDictionary(await getLocale());

  return (
    <div className="min-h-full bg-stone-950 text-stone-100">
      <div className="mx-auto max-w-4xl px-4 py-4">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-stone-700 pb-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">
              {d.admin_header_ops}
            </p>
            <h1 className="text-lg font-bold text-white">{d.admin_control_room}</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-rose-900/50 px-2 py-0.5 text-xs text-rose-100">
              {u.role}
            </span>
            <Link
              href="/app"
              className="rounded-lg border border-stone-600 px-3 py-1.5 text-sm text-stone-200"
            >
              {d.admin_link_app}
            </Link>
            {u.role === "super_admin" ? (
              <Link
                href="/admin/users"
                className="rounded-lg border border-amber-600/50 bg-amber-950/30 px-3 py-1.5 text-sm text-amber-100"
              >
                {d.admin_link_roles}
              </Link>
            ) : null}
            <LogoutButton className="border-stone-600 text-stone-200" />
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
