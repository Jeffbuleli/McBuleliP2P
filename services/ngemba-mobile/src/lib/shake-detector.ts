import { Accelerometer } from "expo-sensors";
import { useEffect, useRef } from "react";

const SHAKE_THRESHOLD = 1.65;
const SHAKE_COUNT = 5;
const SHAKE_WINDOW_MS = 2500;
const COOLDOWN_MS = 15_000;

export function useShakeDetector(onTrigger: () => void, enabled = true) {
  const shakesRef = useRef<number[]>([]);
  const cooldownUntilRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    Accelerometer.setUpdateInterval(80);
    const sub = Accelerometer.addListener(({ x, y, z }) => {
      const now = Date.now();
      if (now < cooldownUntilRef.current) return;

      const magnitude = Math.sqrt(x * x + y * y + z * z);
      if (magnitude < SHAKE_THRESHOLD) return;

      const recent = shakesRef.current.filter(
        (t) => now - t < SHAKE_WINDOW_MS,
      );
      recent.push(now);
      shakesRef.current = recent;

      if (recent.length >= SHAKE_COUNT) {
        shakesRef.current = [];
        cooldownUntilRef.current = now + COOLDOWN_MS;
        onTrigger();
      }
    });

    return () => sub.remove();
  }, [enabled, onTrigger]);
}
