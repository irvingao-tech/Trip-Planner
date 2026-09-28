import type { DayPlan, Place, PlannedStop, StopStatus } from "./domain";

export const TRANSIT_BUFFER_MINUTES = 30;

export function addMinutes(time: string, minutes: number) {
  const [hour, minute] = time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function stopStatus(stop: PlannedStop): StopStatus {
  if (stop.status === "planned" || stop.status === "visited" || stop.status === "skipped") return stop.status;
  return stop.visited ? "visited" : "planned";
}

export function moveStop(stops: PlannedStop[], from: number, to: number): PlannedStop[] {
  if (from === to || from < 0 || to < 0 || from >= stops.length || to >= stops.length) return stops;
  const next = stops.slice();
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export type PlaceLookup = (placeId: string) => Place | undefined;

export function recalcStopTimes(
  stops: PlannedStop[],
  startTime: string,
  lookup: PlaceLookup,
  override?: Place,
): PlannedStop[] {
  let nextTime = startTime;
  return stops.map((stop) => {
    const place = override?.id === stop.placeId ? override : lookup(stop.placeId);
    const fixedDinner = place?.reservation === "已预约" && place.meal === "晚餐";
    const scheduled: PlannedStop = { ...stop, time: fixedDinner ? "19:00" : nextTime };
    if (!fixedDinner) nextTime = addMinutes(nextTime, (place?.duration ?? 60) + TRANSIT_BUFFER_MINUTES);
    return scheduled;
  });
}

const priorityScore = { must: 0, want: 1, optional: 2 } as const;

export function stopLimitForPace(pace: DayPlan["pace"]) {
  return pace === "relaxed" ? 3 : pace === "intensive" ? 6 : 4;
}

function comparePlaces(a: Place, b: Place) {
  return (
    a.area.localeCompare(b.area) ||
    priorityScore[a.priority] - priorityScore[b.priority] ||
    Number(a.kind === "food") - Number(b.kind === "food")
  );
}

export function suggestStopOrder(
  places: Place[],
  currentStops: PlannedStop[],
  limit: number,
): PlannedStop[] {
  if (currentStops.length) {
    const byId = new Map(places.map((place) => [place.id, place]));
    return currentStops
      .filter((stop) => byId.has(stop.placeId))
      .sort((a, b) => comparePlaces(byId.get(a.placeId)!, byId.get(b.placeId)!))
      .map((stop) => ({ ...stop, time: "" }));
  }
  return [...places]
    .sort((a, b) => priorityScore[a.priority] - priorityScore[b.priority])
    .slice(0, limit)
    .sort(comparePlaces)
    .map((place) => ({ placeId: place.id, time: "" }));
}
