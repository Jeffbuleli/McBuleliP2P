/** Browser-only Pi SDK helpers (load script + init). Import only from client components. */

export function loadPiSdk(): Promise<NonNullable<Window["Pi"]>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("no_window"));
  }
  if (window.Pi) return Promise.resolve(window.Pi);

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-pi-sdk="1"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      const check = () => {
        if (window.Pi) resolve(window.Pi);
        else setTimeout(check, 25);
      };
      const t = window.setTimeout(() => reject(new Error("pi_sdk_timeout")), 8000);
      check();
      existing.addEventListener(
        "load",
        () => {
          window.clearTimeout(t);
          if (window.Pi) resolve(window.Pi);
          else reject(new Error("pi_sdk_load_failed"));
        },
        { once: true },
      );
      existing.addEventListener(
        "error",
        () => reject(new Error("pi_sdk_error")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.dataset.piSdk = "1";
    s.src = "https://sdk.minepi.com/pi-sdk.js";
    s.async = true;
    s.onload = () => {
      if (window.Pi) resolve(window.Pi);
      else reject(new Error("pi_sdk_load_failed"));
    };
    s.onerror = () => reject(new Error("pi_sdk_error"));
    document.head.appendChild(s);
  });
}

export async function piInit(): Promise<NonNullable<Window["Pi"]>> {
  const Pi = await loadPiSdk();
  await Promise.resolve(
    Pi.init({
      version: "2.0",
      sandbox: process.env.NEXT_PUBLIC_PI_SANDBOX === "1",
    }),
  );
  return Pi;
}
