"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useCitizenLocale } from "@/hooks/use-citizen-locale";
import { fireDiscretePanicAlert } from "@/lib/discrete/fire-alert";
import { vibrateDiscreteAlert } from "@/lib/discrete/vibrate";
import { messages } from "@/lib/i18n";
import {
  citizenPagePad,
  citizenShellMaxWidth,
  useDeviceClass,
} from "@/lib/ui/device";

/**
 * Écran transitoire sobre : envoie l'alerte tout de suite (raccourci PWA / deep link).
 * Pas de formulaire « Alerte discrète » visible.
 */
export function DiscreteSilentFire({
  initialLocale,
}: {
  initialLocale?: string;
}) {
  const router = useRouter();
  const { locale, href } = useCitizenLocale(initialLocale);
  const t = messages[locale];
  const device = useDeviceClass();
  const started = useRef(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    vibrateDiscreteAlert();
    void fireDiscretePanicAlert({ locale }).then((result) => {
      if (result.ok) {
        const dest = `${href(`/session/${result.id}`)}&discrete=1`;
        router.replace(dest);
        window.setTimeout(() => {
          if (!window.location.pathname.includes(`/session/${result.id}`)) {
            window.location.assign(dest);
          }
        }, 900);
        return;
      }
      setError(true);
    });
  }, [href, locale, router]);

  return (
    <main
      className={`ng-shell mx-auto flex min-h-dvh flex-col items-center justify-center ${citizenPagePad(device)} ${citizenShellMaxWidth(device)} ng-discrete-surface`}
    >
      <p className="text-sm font-medium text-[#c9a0bc]">
        {error ? t.errorGeneric : "…"}
      </p>
      {error ? (
        <button
          type="button"
          className="mt-4 text-sm font-semibold text-[#e8d4e3] underline"
          onClick={() => {
            setError(false);
            void fireDiscretePanicAlert({ locale }).then((result) => {
              if (result.ok) {
                router.replace(`${href(`/session/${result.id}`)}&discrete=1`);
                return;
              }
              setError(true);
            });
          }}
        >
          {t.send}
        </button>
      ) : null}
    </main>
  );
}
