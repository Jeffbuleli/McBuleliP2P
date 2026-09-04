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
  if (device === "tablet") return "max-w-3xl";
  return "max-w-md";
}

/** Citizen flows: readable column that scales desk → tablet → mobile. */
export function citizenShellMaxWidth(device: DeviceClass): string {
  if (device === "desktop") return "max-w-2xl";
  if (device === "tablet") return "max-w-xl";
  return "max-w-md";
}

/** Home SOS — larger, centered hero. */
export function sosButtonSize(device: DeviceClass): string {
  if (device === "desktop") return "size-[168px]";
  if (device === "tablet") return "size-[148px]";
  return "size-[128px]";
}

export function sosIconSize(device: DeviceClass): string {
  if (device === "desktop") return "size-7";
  if (device === "tablet") return "size-6";
  return "size-5";
}

export function sosLabelClass(device: DeviceClass): string {
  if (device === "desktop") return "text-xl";
  if (device === "tablet") return "text-lg";
  return "text-base";
}

/** Vertical page padding scales with viewport. */
export function citizenPagePad(device: DeviceClass): string {
  if (device === "desktop") return "pb-10 pt-7";
  if (device === "tablet") return "pb-9 pt-6";
  return "pb-8 pt-5";
}
