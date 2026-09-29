import type { TravelMode } from "./domain";

export type RouteSource = "google" | "osrm" | "estimate";

export interface RoutePoint {
  label: string;
  latitude?: number;
  longitude?: number;
}

export interface RouteStep {
  instruction: string;
  name?: string;
  distanceMeters?: number;
  durationMinutes?: number;
  transitLine?: string;
  departureStop?: string;
  arrivalStop?: string;
  departureTime?: string;
  arrivalTime?: string;
  numStops?: number;
}

export interface RouteLeg {
  id: string;
  fromLabel: string;
  toLabel: string;
  mode: TravelMode;
  durationMinutes: number;
  distanceMeters?: number;
  source: RouteSource;
  steps?: RouteStep[];
}

export interface DayRoute {
  legs: RouteLeg[];
  totalDurationMinutes: number;
  totalDistanceMeters?: number;
  source: RouteSource;
}

export const modeLabel: Record<TravelMode, string> = { walk: "步行", transit: "公交", drive: "驾车" };

const GOOGLE_MODE: Record<TravelMode, string> = { walk: "walking", transit: "transit", drive: "driving" };
const OSRM_PROFILE: Partial<Record<TravelMode, string>> = { walk: "foot", drive: "driving" };
const SPEED_KMH: Record<TravelMode, number> = { walk: 4.8, transit: 20, drive: 30 };
const ROAD_FACTOR = 1.3;
const EARTH_RADIUS_M = 6371000;

type LocatedPoint = RoutePoint & { latitude: number; longitude: number };

function hasCoords(point: RoutePoint): point is LocatedPoint {
  return point.latitude != null && point.longitude != null;
}

export function googleRoutesKey() {
  return process.env.NEXT_PUBLIC_GOOGLE_ROUTES_KEY;
}

export function haversineMeters(a: RoutePoint, b: RoutePoint): number | undefined {
  if (!hasCoords(a) || !hasCoords(b)) return undefined;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateLeg(from: RoutePoint, to: RoutePoint, mode: TravelMode): RouteLeg {
  const straight = haversineMeters(from, to);
  const roadMeters = straight == null ? undefined : Math.round(straight * ROAD_FACTOR);
  const durationMinutes = roadMeters == null ? 1 : Math.max(1, Math.round(((roadMeters / 1000) / SPEED_KMH[mode]) * 60));
  return {
    id: `estimate-${from.label}-${to.label}-${mode}`,
    fromLabel: from.label,
    toLabel: to.label,
    mode,
    durationMinutes,
    distanceMeters: roadMeters,
    source: "estimate",
  };
}

function summarize(legs: RouteLeg[], source: RouteSource): DayRoute {
  const distances = legs.map((leg) => leg.distanceMeters).filter((value): value is number => value != null);
  return {
    legs,
    totalDurationMinutes: legs.reduce((sum, leg) => sum + leg.durationMinutes, 0),
    totalDistanceMeters: distances.length ? distances.reduce((sum, value) => sum + value, 0) : undefined,
    source,
  };
}

export function estimateRoute(points: RoutePoint[], mode: TravelMode): DayRoute {
  const legs: RouteLeg[] = [];
  for (let index = 0; index < points.length - 1; index += 1) legs.push(estimateLeg(points[index], points[index + 1], mode));
  return summarize(legs, "estimate");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function fetchGoogleRoute(points: RoutePoint[], mode: TravelMode, signal?: AbortSignal): Promise<DayRoute> {
  const key = googleRoutesKey();
  const located = points.filter(hasCoords);
  if (!key) throw new Error("缺少 Google Routes key");
  if (located.length < 2) throw new Error("可用坐标不足");
  const params = new URLSearchParams({
    origin: `${located[0].latitude},${located[0].longitude}`,
    destination: `${located[located.length - 1].latitude},${located[located.length - 1].longitude}`,
    mode: GOOGLE_MODE[mode],
    language: "zh-CN",
    key,
  });
  const waypoints = located.slice(1, -1).map((point) => `${point.latitude},${point.longitude}`).join("|");
  if (waypoints) params.set("waypoints", waypoints);
  const response = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`, { signal });
  if (!response.ok) throw new Error(`Google Directions ${response.status}`);
  const data = (await response.json()) as {
    status: string;
    routes?: Array<{
      legs: Array<{
        duration: { value: number };
        distance: { value: number };
        steps?: Array<{
          html_instructions?: string;
          distance?: { value: number };
          duration?: { value: number };
          transit_details?: {
            line?: { short_name?: string; name?: string };
            departure_stop?: { name?: string };
            arrival_stop?: { name?: string };
            departure_time?: { text?: string };
            arrival_time?: { text?: string };
            num_stops?: number;
          };
        }>;
      }>;
    }>;
  };
  if (data.status !== "OK" || !data.routes?.[0]) throw new Error(`Google Directions 无结果：${data.status}`);
  const legs = data.routes[0].legs.map((leg, index) => {
    const steps = leg.steps?.map((step) => {
      const transit = step.transit_details;
      const line = transit?.line?.short_name || transit?.line?.name;
      return {
        instruction: transit?.line
          ? `乘坐 ${line ?? "公交"}${transit.arrival_stop?.name ? ` 至 ${transit.arrival_stop.name}` : ""}`
          : stripHtml(step.html_instructions ?? "继续前行"),
        name: transit?.departure_stop?.name,
        distanceMeters: step.distance?.value,
        durationMinutes: step.duration ? Math.max(1, Math.round(step.duration.value / 60)) : undefined,
        transitLine: line,
        departureStop: transit?.departure_stop?.name,
        arrivalStop: transit?.arrival_stop?.name,
        departureTime: transit?.departure_time?.text,
        arrivalTime: transit?.arrival_time?.text,
        numStops: transit?.num_stops,
      };
    });
    return {
      id: `google-${index}`,
      fromLabel: located[index].label,
      toLabel: located[index + 1].label,
      mode,
      durationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
      distanceMeters: leg.distance.value,
      source: "google" as const,
      steps,
    };
  });
  return summarize(legs, "google");
}

async function fetchOsrmRoute(points: RoutePoint[], mode: TravelMode, signal?: AbortSignal): Promise<DayRoute> {
  const profile = OSRM_PROFILE[mode];
  const located = points.filter(hasCoords);
  if (!profile) throw new Error("OSRM 不支持该模式");
  if (located.length < 2) throw new Error("可用坐标不足");
  const coordinates = located.map((point) => `${point.longitude},${point.latitude}`).join(";");
  const response = await fetch(`https://router.project-osrm.org/route/v1/${profile}/${coordinates}?overview=false&steps=true`, { signal });
  if (!response.ok) throw new Error(`OSRM ${response.status}`);
  const data = (await response.json()) as {
    code: string;
    routes?: Array<{
      legs: Array<{
        duration: number;
        distance: number;
        steps?: Array<{
          distance: number;
          duration: number;
          name?: string;
          maneuver?: { instruction?: string; type?: string; modifier?: string };
        }>;
      }>;
    }>;
  };
  if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("OSRM 无结果");
  const legs = data.routes[0].legs.map((leg, index) => {
    const steps = leg.steps?.map((step) => ({
      instruction: step.maneuver?.instruction ?? (step.name ? `沿 ${step.name} 前进` : "继续前进"),
      name: step.name || undefined,
      distanceMeters: Math.round(step.distance),
      durationMinutes: Math.max(1, Math.round(step.duration / 60)),
    }));
    return {
      id: `osrm-${index}`,
      fromLabel: located[index].label,
      toLabel: located[index + 1].label,
      mode,
      durationMinutes: Math.max(1, Math.round(leg.duration / 60)),
      distanceMeters: Math.round(leg.distance),
      source: "osrm" as const,
      steps,
    };
  });
  return summarize(legs, "osrm");
}

export async function fetchDayRoute(points: RoutePoint[], mode: TravelMode, signal?: AbortSignal): Promise<DayRoute> {
  if (points.filter(hasCoords).length < 2) return { legs: [], totalDurationMinutes: 0, source: "estimate" };
  if (googleRoutesKey()) {
    try {
      return await fetchGoogleRoute(points, mode, signal);
    } catch {
      // fall through to keyless providers
    }
  }
  try {
    return await fetchOsrmRoute(points, mode, signal);
  } catch {
    return estimateRoute(points, mode);
  }
}

export function buildGoogleMapsDirUrl(points: RoutePoint[], mode: TravelMode): string {
  const located = points.filter(hasCoords);
  if (located.length < 2) return "https://www.google.com/maps";
  const travelmode = mode === "drive" ? "driving" : mode === "transit" ? "transit" : "walking";
  const params = new URLSearchParams({
    api: "1",
    origin: `${located[0].latitude},${located[0].longitude}`,
    destination: `${located[located.length - 1].latitude},${located[located.length - 1].longitude}`,
    travelmode,
  });
  const waypoints = located.slice(1, -1).map((point) => `${point.latitude},${point.longitude}`).join("|");
  if (waypoints) params.set("waypoints", waypoints);
  return `https://www.google.com/maps/dir/?${params}`;
}

export function buildPlaceEmbedUrl(point: RoutePoint, zoom?: number): string {
  const query = hasCoords(point) ? `${point.latitude},${point.longitude}` : point.label;
  const zoomParam = zoom ? `&z=${zoom}` : "";
  return `https://maps.google.com/maps?output=embed&hl=zh-CN&q=${encodeURIComponent(query)}${zoomParam}`;
}

export function buildRouteEmbedUrl(points: RoutePoint[], mode: TravelMode, zoom?: number): string {
  const located = points.filter(hasCoords);
  if (located.length < 2) {
    return buildPlaceEmbedUrl(located[0] ?? points[0] ?? { label: "Fukuoka, Japan" }, zoom);
  }
  const dirflg = mode === "walk" ? "w" : mode === "transit" ? "r" : "d";
  const saddr = `${located[0].latitude},${located[0].longitude}`;
  const daddr = located.slice(1).map((point) => `${point.latitude},${point.longitude}`).join("+to:");
  return `https://maps.google.com/maps?saddr=${saddr}&daddr=${daddr}&dirflg=${dirflg}&hl=zh-CN&output=embed`;
}
