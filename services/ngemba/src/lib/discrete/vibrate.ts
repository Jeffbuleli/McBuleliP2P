/** Vibrations discrètes - Web Vibration API (Android / some browsers). */

export function vibrateDiscreteAlert() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([120, 60, 120]);
    }
  } catch {
    // ignore
  }
}

export function vibrateDiscreteConfirm() {
  try {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(80);
    }
  } catch {
    // ignore
  }
}
