const METAMAP_SCRIPT = "https://web-button.metamap.com/button.js";

let loadPromise: Promise<void> | null = null;

export function loadMetamapSdk(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("metamap_ssr"));
  }
  if (window.MetamapVerification) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.MetamapVerification) resolve();
      else reject(new Error("metamap_class_missing"));
    };

    const existing = document.querySelector(`script[src="${METAMAP_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("metamap_script")), {
        once: true,
      });
      if (window.MetamapVerification) resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = METAMAP_SCRIPT;
    script.async = true;
    script.onload = finish;
    script.onerror = () => reject(new Error("metamap_script"));
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** MetaMap screens that indicate a failed or blocked step inside the SDK. */
export const METAMAP_ERROR_SCREENS = new Set([
  "uploadError",
  "commonError",
  "timeoutError",
  "ipRestrictions",
  "cameraDeniedError",
  "unsupportedBrowsers",
  "maxFileSizeError",
  "RetriesBlockedError",
  "DocumentMismatchError",
]);
