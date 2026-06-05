"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";

/** Client redirect — preserves Jitsi #config hash (Next.js redirect() strips it). */
export function AcademyLiveEnterRedirect({ url }: { url: string }) {
  const { t } = useI18n();

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className={`mx-auto max-w-md space-y-4 px-4 py-8 text-center ${academyCls.root}`}>
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#305f33]">
        <AcademyIcon name="live" className="h-7 w-7 !text-white" />
      </span>
      <p className="text-sm font-semibold text-[color:var(--fd-text)]">
        {t("academy_live_enter_redirecting")}
      </p>
    </div>
  );
}
