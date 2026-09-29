"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface RouteMapPoint {
  label: string;
  latitude: number;
  longitude: number;
  visited?: boolean;
}

const LINE_COLOR = "#e23b3b";

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&": return "&amp;";
      case "<": return "&lt;";
      case ">": return "&gt;";
      case '"': return "&quot;";
      default: return "&#39;";
    }
  });
}

interface Sample {
  lat: number;
  lng: number;
}

function buildCurve(points: RouteMapPoint[], perSegment = 22): Sample[] {
  if (points.length < 2) return points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
  const base = points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
  const extended = [base[0], ...base, base[base.length - 1]];
  const out: Sample[] = [];
  for (let i = 0; i < extended.length - 3; i += 1) {
    const p0 = extended[i];
    const p1 = extended[i + 1];
    const p2 = extended[i + 2];
    const p3 = extended[i + 3];
    for (let j = 0; j < perSegment; j += 1) {
      const t = j / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      const lat = 0.5 * (2 * p1.lat + (-p0.lat + p2.lat) * t + (2 * p0.lat - 5 * p1.lat + 4 * p2.lat - p3.lat) * t2 + (-p0.lat + 3 * p1.lat - 3 * p2.lat + p3.lat) * t3);
      const lng = 0.5 * (2 * p1.lng + (-p0.lng + p2.lng) * t + (2 * p0.lng - 5 * p1.lng + 4 * p2.lng - p3.lng) * t2 + (-p0.lng + 3 * p1.lng - 3 * p2.lng + p3.lng) * t3);
      out.push({ lat, lng });
    }
  }
  out.push({ lat: base[base.length - 1].lat, lng: base[base.length - 1].lng });
  return out;
}

function arrowIndexes(curve: Sample[], waypoints: RouteMapPoint[]) {
  const indexes = new Set<number>();
  const total = curve.length;
  const spacing = Math.max(6, Math.floor(total / Math.max(2, waypoints.length + 1)));
  for (let i = spacing; i < total - 2; i += spacing) indexes.add(i);
  waypoints.forEach((waypoint, index) => {
    if (index === 0) return;
    let best = 0;
    let bestDistance = Infinity;
    curve.forEach((sample, sampleIndex) => {
      const distance = (sample.lat - waypoint.latitude) ** 2 + (sample.lng - waypoint.longitude) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        best = sampleIndex;
      }
    });
    indexes.add(Math.max(1, best - 3));
  });
  return Array.from(indexes).sort((a, b) => a - b);
}

export default function RouteMap({ points }: { points: RouteMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pointsRef = useRef(points);
  const pointKey = points.map((point) => `${point.latitude},${point.longitude},${point.visited ? 1 : 0}`).join("|");

  useEffect(() => {
    pointsRef.current = points;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(map);
    map.setView([35.68, 139.76], 5);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const timer = window.setTimeout(() => map.invalidateSize(), 150);
    return () => {
      window.clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    const current = pointsRef.current;
    layer.clearLayers();
    if (current.length === 0) return;

    current.forEach((point, index) => {
      const icon = L.divIcon({
        className: point.visited ? "route-pin visited" : "route-pin",
        html: `<span class="route-pin-num">${point.visited ? "✓" : index + 1}</span><span class="route-pin-label">${escapeHtml(point.label)}</span>`,
        iconSize: [0, 0],
      });
      L.marker([point.latitude, point.longitude], { icon }).addTo(layer);
    });

    if (current.length >= 2) {
      const curve = buildCurve(current);
      L.polyline(curve.map((sample) => [sample.lat, sample.lng]), { color: LINE_COLOR, weight: 5, opacity: 0.9, lineCap: "round", lineJoin: "round", dashArray: "1 12" }).addTo(layer);
      arrowIndexes(curve, current).forEach((index) => {
        const from = curve[index];
        const to = curve[Math.min(index + 1, curve.length - 1)];
        const dx = (to.lng - from.lng) * Math.cos((from.lat * Math.PI) / 180);
        const dy = to.lat - from.lat;
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        const icon = L.divIcon({ className: "route-arrow-wrap", html: `<span class="route-arrow" style="transform:rotate(${-angle}deg)"></span>`, iconSize: [0, 0] });
        L.marker([from.lat, from.lng], { icon, interactive: false }).addTo(layer);
      });
      map.fitBounds(L.latLngBounds(current.map((point) => [point.latitude, point.longitude])), { padding: [60, 60] });
    } else {
      map.setView([current[0].latitude, current[0].longitude], 15);
    }
    map.invalidateSize();
  }, [pointKey]);

  return <div className="route-map" ref={containerRef} />;
}
