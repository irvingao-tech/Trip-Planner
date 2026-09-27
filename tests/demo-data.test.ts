import { describe, expect, it } from "vitest";
import { initialPlaces, todayTimeline } from "../lib/demo-data";

describe("demo trip data", () => {
  it("only references existing places", () => {
    const ids = new Set(initialPlaces.map((place) => place.id));
    expect(todayTimeline.every((item) => ids.has(item.placeId))).toBe(true);
  });

  it("contains first-class dining examples", () => {
    expect(initialPlaces.filter((place) => place.kind === "food").length).toBeGreaterThan(0);
  });
});
