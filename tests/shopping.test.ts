import { describe, expect, it } from "vitest";
import type { Place, ShoppingItem } from "../lib/domain";
import { mergeTimeline, reorderKeys, shoppingForDay, shoppingTotals } from "../lib/shopping";

const place = (id: string): Place => ({ id, name: id, kind: "sight", area: "A", priority: "want", duration: 45, emoji: "📍" });
const resolvePlace = (id: string) => (id === "known" ? place(id) : undefined);

const items: ShoppingItem[] = [
  { id: "late", name: "夜购", purchased: false, dayId: "day-1", time: "20:00" },
  { id: "early", name: "早购", purchased: true, dayId: "day-1", time: "08:00" },
  { id: "untimed", name: "随手买", purchased: false, dayId: "day-1" },
  { id: "other-day", name: "改天", purchased: false, dayId: "day-2", time: "12:00" },
];

describe("shoppingForDay", () => {
  it("filters items by day", () => {
    expect(shoppingForDay(items, "day-1").map((item) => item.id)).toEqual(["late", "early", "untimed"]);
  });
});

describe("mergeTimeline", () => {
  it("interleaves stops and shopping by time with untimed entries last", () => {
    const entries = mergeTimeline([{ placeId: "known", time: "10:00" }], shoppingForDay(items, "day-1"), resolvePlace);
    expect(entries.map((entry) => entry.kind === "shopping" ? entry.item.id : entry.stop.placeId)).toEqual([
      "early",
      "known",
      "late",
      "untimed",
    ]);
  });

  it("keeps untimed shopping after timed entries", () => {
    const entries = mergeTimeline([], shoppingForDay(items, "day-1"), resolvePlace);
    expect(entries[entries.length - 1].time).toBe("");
  });

  it("honors an explicit card order over time sorting", () => {
    const entries = mergeTimeline([{ placeId: "known", time: "10:00" }], shoppingForDay(items, "day-1"), resolvePlace, [
      "shop:untimed",
      "stop:known",
      "shop:early",
      "shop:late",
    ]);
    expect(entries.map((entry) => entry.kind === "shopping" ? entry.item.id : entry.stop.placeId)).toEqual([
      "untimed",
      "known",
      "early",
      "late",
    ]);
  });
});

describe("shoppingTotals", () => {
  it("counts purchased and sums estimated prices", () => {
    const totals = shoppingTotals([
      { id: "a", name: "a", purchased: true, estimatedPrice: 1000 },
      { id: "b", name: "b", purchased: false, estimatedPrice: 2500 },
      { id: "c", name: "c", purchased: false },
    ]);
    expect(totals).toEqual({ count: 3, purchased: 1, estimated: 3500 });
  });
});

describe("reorderKeys", () => {
  const keys = ["stop:a", "shop:x", "stop:b", "stop:c"];

  it("moves a card before another card", () => {
    expect(reorderKeys(keys, "stop:a", "stop:b")).toEqual(["shop:x", "stop:a", "stop:b", "stop:c"]);
  });

  it("moves a card to the end when there is no target", () => {
    expect(reorderKeys(keys, "stop:a", null)).toEqual(["shop:x", "stop:b", "stop:c", "stop:a"]);
  });

  it("moves a card to the front", () => {
    expect(reorderKeys(keys, "stop:c", "stop:a")).toEqual(["stop:c", "stop:a", "shop:x", "stop:b"]);
  });

  it("keeps the order when the card is already in place", () => {
    expect(reorderKeys(keys, "shop:x", "stop:b")).toEqual(keys);
  });

  it("ignores an unknown card", () => {
    expect(reorderKeys(keys, "shop:missing", "stop:b")).toEqual(keys);
  });
});
