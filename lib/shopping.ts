import type { Place, PlannedStop, ShoppingItem } from "./domain";

export type TimelineEntry =
  | { kind: "stop"; key: string; time: string; stop: PlannedStop; place?: Place }
  | { kind: "shopping"; key: string; time: string; item: ShoppingItem };

export const stopCardKey = (placeId: string) => `stop:${placeId}`;
export const shoppingCardKey = (id: string) => `shop:${id}`;

export function isStopCardKey(key: string) {
  return key.startsWith("stop:");
}

/**
 * Move `dragKey` so it sits immediately before `beforeKey`, or at the end when
 * `beforeKey` is null. The target is resolved against the other cards only, so
 * a card that reorders live under the pointer cannot oscillate between two
 * positions while it is being dragged.
 */
export function reorderKeys(keys: string[], dragKey: string, beforeKey: string | null): string[] {
  if (!keys.includes(dragKey)) return keys;
  const without = keys.filter((key) => key !== dragKey);
  const target = beforeKey ? without.indexOf(beforeKey) : without.length;
  const insertAt = target === -1 ? without.length : target;
  const next = without.slice();
  next.splice(insertAt, 0, dragKey);
  return next;
}

export function shoppingForDay(items: ShoppingItem[], dayId: string): ShoppingItem[] {
  return items.filter((item) => item.dayId === dayId);
}

function compareEntries(a: TimelineEntry, b: TimelineEntry) {
  if (a.time && b.time) return a.time.localeCompare(b.time);
  if (a.time) return -1;
  if (b.time) return 1;
  return a.key.localeCompare(b.key);
}

export function mergeTimeline(
  stops: PlannedStop[],
  items: ShoppingItem[],
  resolvePlace: (placeId: string) => Place | undefined,
  order?: string[],
): TimelineEntry[] {
  const stopEntries: TimelineEntry[] = stops.map((stop) => ({
    kind: "stop",
    key: stopCardKey(stop.placeId),
    time: stop.time,
    stop,
    place: resolvePlace(stop.placeId),
  }));
  const shoppingEntries: TimelineEntry[] = items.map((item) => ({
    kind: "shopping",
    key: shoppingCardKey(item.id),
    time: item.time ?? "",
    item,
  }));
  const all = [...stopEntries, ...shoppingEntries];
  if (order && order.length) {
    const rank = new Map(order.map((key, index) => [key, index]));
    return all.sort((a, b) => {
      const ai = rank.get(a.key) ?? Number.MAX_SAFE_INTEGER;
      const bi = rank.get(b.key) ?? Number.MAX_SAFE_INTEGER;
      return ai !== bi ? ai - bi : compareEntries(a, b);
    });
  }
  return all.sort(compareEntries);
}

export function matchParentPlaceId(item: ShoppingItem, places: Array<{ id: string; name: string }>): string | undefined {
  if (item.parentPlaceId) return item.parentPlaceId;
  const haystack = [item.storeName, item.name, item.area].filter((value): value is string => Boolean(value)).join(" ");
  if (!haystack) return undefined;
  const match = places.find((place) => haystack.includes(place.name));
  return match?.id;
}

export function shoppingTotals(items: ShoppingItem[]) {
  return {
    count: items.length,
    purchased: items.filter((item) => item.purchased).length,
    estimated: items.reduce((sum, item) => sum + (item.estimatedPrice ?? 0), 0),
  };
}
