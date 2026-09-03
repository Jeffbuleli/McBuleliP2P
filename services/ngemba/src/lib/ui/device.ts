"use client";

import { useEffect, useState } from "react";

export type DeviceClass = "mobile" | "tablet" | "desktop";

const TABLET_MIN = 768;
const DESKTOP_MIN = 1024;

export function classifyViewport(width: number): DeviceClass {
  if (width >= DESKTOP_MIN) return "desktop";
  if (width >= TABLET_MIN) return "tablet";
  return "mobile";
}

export function useDeviceClass(): DeviceClass {
  const [device, setDevice] = useState<DeviceClass>("mobile");

  useEffect(() => {
    const update = () => setDevice(classifyViewport(window.innerWidth));
    update();
    window.addEventListener("resize", update, { passive: true });
    return () => window.removeEventListener("resize", update);
  }, []);

  return device;
}

export function shellMaxWidth(device: DeviceClass): string {
  if (device === "desktop") return "max-w-5xl";
  if (device === "tablet") return "max-w-2xl";
  return "max-w-md";
}

export function citizenShellMaxWidth(device: DeviceClass): string {
  if (device === "desktop") return "max-w-xl";
  if (device === "tablet") return "max-w-lg";
  return "max-w-md";
}

export function sosButtonSize(device: DeviceClass): string {
  if (device === "desktop") return "size-[112px]";
  if (device === "tablet") return "size-[104px]";
  return "size-[var(--ng-sos-size)]";
}
