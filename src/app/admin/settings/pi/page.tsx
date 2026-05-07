import { redirect } from "next/navigation";
import { getLocale } from "@/lib/get-locale";
import { getDictionary } from "@/i18n/messages";
import { requireSuperAdmin } from "@/lib/session-user";
import PiReceiveAddressSettingsClient from "./pi-settings-client";

export default async function AdminPiSettingsPage() {
  await requireSuperAdmin().catch(() => redirect("/admin"));
  const locale = await getLocale();
  const d = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Pi settings</h2>
        <p className="mt-1 text-sm text-stone-400">
          Set receiving addresses used for Pi deposits (manual).
        </p>
      </div>
      <PiReceiveAddressSettingsClient />
    </div>
  );
}

