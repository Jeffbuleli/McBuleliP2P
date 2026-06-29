"use client";

import { useEffect } from "react";
import { useI18n } from "@/components/i18n-provider";
import { AcademyIcon } from "@/components/academy/academy-icon";
import { academyCls } from "@/components/academy/academy-ui";

/** Client redirect - preserves Jitsi #config hash (Next.js redirect() strips it). */
export function AcademyLiveEnterRedirect({ url }: { url: string }) {
  const { t } = useI18n();

  useEffect(() => {
    window.location.replace(url);
  }, [url]);

  return (
    <div className={`mx-auto max-w-md space-y-3 px-4 py-10 text-center ${academyCls.root}`}>
      <span className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#305f33] shadow-lg">
        <span
          className="absolute inset-0 animate-ping rounded-2xl bg-[#305f33]/30"
          aria-hidden
        />
        <AcademyIcon name="video" className="relative h-8 w-8 !text-white" />
      </span>
      <p className="text-xs font-extrabold text-[#305f33]">
        {t("academy_live_enter_redirecting")}
      </p>
    </div>
  );
}
