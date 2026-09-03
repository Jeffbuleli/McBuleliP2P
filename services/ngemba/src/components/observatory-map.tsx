"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, CircleMarker } from "leaflet";
import { urgencyLabelFr } from "@/lib/labels";
import "leaflet/dist/leaflet.css";

export type ObservatoryMapPoint = {
  zoneKey: string;
  province: string | null;
  lat: number;
  lng: number;
  count: number;
  urgencyMax: string;
};

type Props = {
  points: ObservatoryMapPoint[];
  className?: string;
};

function radiusFor(count: number, max: number): number {
  if (max <= 0) return 10;
  return Math.round(10 + (count / max) * 22);
}

function colorFor(count: number, max: number): string {
  if (max <= 0) return "#1d4ed8";
  const ratio = count / max;
  if (ratio >= 0.75) return "#b91c1c";
  if (ratio >= 0.45) return "#d97706";
  if (ratio >= 0.25) return "#0f766e";
  return "#1d4ed8";
}

export function ObservatoryMap({ points, className }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<CircleMarker[]>([]);
  const readyRef = useRef(false);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  useEffect(() => {
    let cancelled = false;

    async function syncMarkers() {
      const map = mapRef.current;
      if (!map || !readyRef.current) return;
      const L = (await import("leaflet")).default;
      const current = pointsRef.current;

      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      if (current.length === 0) {
        map.setView([-4.32, 15.3], 5);
        return;
      }

      const max = Math.max(...current.map((p) => p.count));
      const bounds: [number, number][] = [];

      for (const p of current) {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: radiusFor(p.count, max),
          color: colorFor(p.count, max),
          fillColor: colorFor(p.count, max),
          fillOpacity: 0.55,
          weight: 2,
          opacity: 0.9,
        });
        const place = p.province
          ? `${p.zoneKey} (${p.province})`
          : p.zoneKey;
        marker.bindPopup(
          `<strong>${place}</strong><br/>${p.count} signalements<br/>Urgence max : ${urgencyLabelFr(p.urgencyMax)}`,
        );
        marker.addTo(map);
        markersRef.current.push(marker);
        bounds.push([p.lat, p.lng]);
      }

      if (bounds.length === 1) map.setView(bounds[0]!, 11);
      else map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      setTimeout(() => map.invalidateSize(), 40);
    }

    async function init() {
      if (!containerRef.current || mapRef.current) return;
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        scrollWheelZoom: false,
        attributionControl: true,
      }).setView([-4.32, 15.3], 6);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      }).addTo(map);

      mapRef.current = map;
      readyRef.current = true;
      setTimeout(() => map.invalidateSize(), 80);
      await syncMarkers();
    }

    void init();

    return () => {
      cancelled = true;
      readyRef.current = false;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      markersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!readyRef.current || !mapRef.current) return;
    void (async () => {
      const map = mapRef.current;
      if (!map) return;
      const L = (await import("leaflet")).default;

      for (const m of markersRef.current) m.remove();
      markersRef.current = [];

      if (points.length === 0) {
        map.setView([-4.32, 15.3], 5);
        return;
      }

      const max = Math.max(...points.map((p) => p.count));
      const bounds: [number, number][] = [];

      for (const p of points) {
        const marker = L.circleMarker([p.lat, p.lng], {
          radius: radiusFor(p.count, max),
          color: colorFor(p.count, max),
          fillColor: colorFor(p.count, max),
          fillOpacity: 0.55,
          weight: 2,
          opacity: 0.9,
        });
        const place = p.province
          ? `${p.zoneKey} (${p.province})`
          : p.zoneKey;
        marker.bindPopup(
          `<strong>${place}</strong><br/>${p.count} signalements<br/>Urgence max : ${urgencyLabelFr(p.urgencyMax)}`,
        );
        marker.addTo(map);
        markersRef.current.push(marker);
        bounds.push([p.lat, p.lng]);
      }

      if (bounds.length === 1) map.setView(bounds[0]!, 11);
      else map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 });
      setTimeout(() => map.invalidateSize(), 40);
    })();
  }, [points]);

  return (
    <div
      className={
        className ??
        "h-72 w-full overflow-hidden rounded-2xl border border-[var(--ng-border)] bg-ng-surface md:h-96"
      }
    >
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
