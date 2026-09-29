"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";

export interface RouteMapPoint {
  label: string;
  latitude: number;
  longitude: number;
}

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

export default function RouteMap({ points }: { points: RouteMapPoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const pointsRef = useRef(points);
  const pointKey = points.map((point) => `${point.latitude},${point.longitude}`).join("|");

  useEffect(() => {
    pointsRef.current = points;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: true });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: "abcd",
      maxZoom: 19,
      crossOrigin: true,
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
        className: "route-pin",
        html: `<span class="route-pin-num">${index + 1}</span><span class="route-pin-label">${escapeHtml(point.label)}</span>`,
        iconSize: [0, 0],
      });
      L.marker([point.latitude, point.longitude], { icon }).addTo(layer);
    });
    if (current.length >= 2) {
      L.polyline(current.map((point) => [point.latitude, point.longitude]), { color: "#df4b32", weight: 4, opacity: 0.85, dashArray: "1 12", lineCap: "round" }).addTo(layer);
      map.fitBounds(L.latLngBounds(current.map((point) => [point.latitude, point.longitude])), { padding: [60, 60] });
    } else {
      map.setView([current[0].latitude, current[0].longitude], 15);
    }
    map.invalidateSize();
  }, [pointKey]);

  return <div className="route-map" ref={containerRef} />;
}
