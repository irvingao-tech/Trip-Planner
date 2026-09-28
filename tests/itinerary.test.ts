import { describe, expect, it } from "vitest";
import type { Place } from "../lib/domain";
import { addMinutes, moveStop, recalcStopTimes, stopLimitForPace, stopStatus, suggestStopOrder } from "../lib/itinerary";

function place(partial: Partial<Place> & Pick<Place, "id">): Place {
  return { name: partial.id, kind: "sight", area: "A", priority: "want", duration: 60, emoji: "📍", ...partial };
}

describe("moveStop", () => {
  const stops = [{ placeId: "a", time: "09:00" }, { placeId: "b", time: "10:00" }, { placeId: "c", time: "11:00" }];

  it("moves a stop to a new position without mutating the input", () => {
    const result = moveStop(stops, 0, 2);
    expect(result.map((stop) => stop.placeId)).toEqual(["b", "c", "a"]);
    expect(stops.map((stop) => stop.placeId)).toEqual(["a", "b", "c"]);
  });

  it("returns the same array for out-of-range or no-op moves", () => {
    expect(moveStop(stops, 1, 1)).toBe(stops);
    expect(moveStop(stops, -1, 1)).toBe(stops);
    expect(moveStop(stops, 0, 5)).toBe(stops);
  });
});

describe("addMinutes", () => {
  it("adds minutes and wraps within a day", () => {
    expect(addMinutes("09:00", 90)).toBe("10:30");
    expect(addMinutes("23:30", 45)).toBe("00:15");
  });
});

describe("recalcStopTimes", () => {
  const lookup = (id: string) => {
    if (id === "dinner") return place({ id, meal: "晚餐", reservation: "已预约", duration: 90 });
    return place({ id, duration: 60 });
  };

  it("chains arrival times with visit duration plus transit buffer", () => {
    const result = recalcStopTimes([{ placeId: "a", time: "" }, { placeId: "b", time: "" }], "09:00", lookup);
    expect(result.map((stop) => stop.time)).toEqual(["09:00", "10:30"]);
  });

  it("pins a reserved dinner to 19:00 without advancing the chain", () => {
    const result = recalcStopTimes(
      [{ placeId: "a", time: "" }, { placeId: "dinner", time: "" }, { placeId: "b", time: "" }],
      "09:00",
      lookup,
    );
    expect(result[1].time).toBe("19:00");
    expect(result[2].time).toBe("10:30");
  });

  it("uses a newly created place override for the first schedule", () => {
    const created = place({ id: "new", duration: 15 });
    const result = recalcStopTimes([{ placeId: "new", time: "" }], "08:00", () => undefined, created);
    expect(result[0].time).toBe("08:00");
  });
});

describe("stopStatus", () => {
  it("prefers explicit status", () => {
    expect(stopStatus({ placeId: "a", time: "09:00", status: "skipped" })).toBe("skipped");
  });

  it("migrates legacy visited flag", () => {
    expect(stopStatus({ placeId: "a", time: "09:00", visited: true })).toBe("visited");
    expect(stopStatus({ placeId: "a", time: "09:00" })).toBe("planned");
  });
});

describe("suggestStopOrder", () => {
  const places = [
    place({ id: "must-b", priority: "must", area: "B" }),
    place({ id: "want-a", priority: "want", area: "A" }),
    place({ id: "want-b", priority: "want", area: "B" }),
  ];

  it("caps suggestions by pace limit", () => {
    expect(suggestStopOrder(places, [], stopLimitForPace("relaxed"))).toHaveLength(3);
    expect(stopLimitForPace("normal")).toBe(4);
    expect(stopLimitForPace("intensive")).toBe(6);
  });

  it("orders by area then priority", () => {
    const order = suggestStopOrder(places, [], 6).map((stop) => stop.placeId);
    expect(order).toEqual(["want-a", "must-b", "want-b"]);
  });

  it("reorders existing stops instead of adding new ones", () => {
    const order = suggestStopOrder(places, [{ placeId: "must-b", time: "" }], 6);
    expect(order.map((stop) => stop.placeId)).toEqual(["must-b"]);
  });
});
