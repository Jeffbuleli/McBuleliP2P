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

/** @deprecated Prefer opsShellMaxWidth for OPS screens */
export function shellMaxWidth(device: DeviceClass): string {
  return opsShellMaxWidth(device);
}

/** OPS dashboards / dossiers — wider on tablet & desktop. */
export function opsShellMaxWidth(device: DeviceClass): string {
  if (device === "desktop") return "max-w-6xl";
  if (device === "tablet") return "max-w-4xl";
  return "max-w-md";
}

export function opsPagePad(device: DeviceClass): string {
  if (device === "desktop") return "py-8 pb-12";
  if (device === "tablet") return "py-6 pb-10";
  return "py-5 pb-8";
}

/** Citizen flows: readable column that scales desk → tablet → mobile. */
export function citizenShellMaxWidth(device: DeviceClass): string {
  if (device === "desktop") return "max-w-2xl";
  if (device === "tablet") return "max-w-xl";
  return "max-w-md";
}

/** Home SOS - larger, centered hero. */
export function sosButtonSize(device: DeviceClass): string {
  if (device === "desktop") return "size-[200px]";
  if (device === "tablet") return "size-[176px]";
  return "size-[152px]";
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

/** OPS alert list: single column mobile, 2 cols desktop. */
export function opsAlertListClass(device: DeviceClass): string {
  if (device === "desktop") return "grid grid-cols-2 gap-4";
  if (device === "tablet") return "grid grid-cols-1 gap-3 sm:grid-cols-2";
  return "flex flex-col gap-3";
}

/** KPI strip for OPS / me dashboards. */
export function kpiGridClass(device: DeviceClass): string {
  if (device === "desktop") return "grid grid-cols-4 gap-3";
  if (device === "tablet") return "grid grid-cols-4 gap-2.5";
  return "grid grid-cols-2 gap-2";
}

export function partnerGridClass(device: DeviceClass): string {
  if (device === "desktop") return "grid grid-cols-2 gap-4";
  if (device === "tablet") return "grid grid-cols-2 gap-3";
  return "flex flex-col gap-3";
}

export function isWide(device: DeviceClass): boolean {
  return device === "tablet" || device === "desktop";
}
