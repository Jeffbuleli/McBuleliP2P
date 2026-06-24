"use client";

import { LogoutButton } from "@/components/LogoutButton";
import { ProfileIconLogout } from "@/components/icons/profile-icons";

export function ProfileLogoutButton() {
  return (
    <div className="fd-card overflow-hidden p-0">
      <LogoutButton
        leading={<ProfileIconLogout className="h-5 w-5 text-rose-600" />}
        className="flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-semibold text-rose-700 active:bg-rose-50/80"
      />
    </div>
  );
}
