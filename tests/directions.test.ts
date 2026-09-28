import { afterEach, describe, expect, it, vi } from "vitest";
import { buildGoogleMapsDirUrl, buildPlaceEmbedUrl, buildRouteEmbedUrl, estimateLeg, estimateRoute, fetchDayRoute, haversineMeters } from "../lib/directions";

const hakata = { label: "博多", latitude: 33.5902, longitude: 130.4207 };
const tenjin = { label: "天神", latitude: 33.5914, longitude: 130.3986 };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("haversineMeters", () => {
  it("approximates the distance between two Fukuoka points", () => {
    const meters = haversineMeters(hakata, tenjin);
    expect(meters).toBeGreaterThan(1500);
    expect(meters).toBeLessThan(2600);
  });

  it("returns undefined when coordinates are missing", () => {
    expect(haversineMeters(hakata, { label: "未知" })).toBeUndefined();
  });
});

describe("estimateLeg", () => {
  it("derives a walking duration from road distance", () => {
    const leg = estimateLeg(hakata, tenjin, "walk");
    expect(leg.source).toBe("estimate");
    expect(leg.mode).toBe("walk");
    expect(leg.durationMinutes).toBeGreaterThan(10);
    expect(leg.distanceMeters).toBeGreaterThan(0);
  });
});

describe("estimateRoute", () => {
  it("aggregates legs between consecutive points", () => {
    const route = estimateRoute([hakata, tenjin, hakata], "walk");
    expect(route.legs).toHaveLength(2);
    expect(route.totalDurationMinutes).toBe(route.legs.reduce((sum, leg) => sum + leg.durationMinutes, 0));
  });
});

describe("buildRouteEmbedUrl", () => {
  it("builds a keyless directions embed with waypoints", () => {
    const url = buildRouteEmbedUrl([hakata, tenjin, hakata], "transit");
    expect(url).toContain("saddr=33.5902,130.4207");
    expect(url).toContain("daddr=33.5914,130.3986+to:33.5902,130.4207");
    expect(url).toContain("dirflg=r");
    expect(url).toContain("output=embed");
  });

  it("falls back to a single-point search embed", () => {
    const url = buildRouteEmbedUrl([hakata], "walk");
    expect(url).toContain("q=33.5902%2C130.4207");
  });
});

describe("buildPlaceEmbedUrl", () => {
  it("prefers coordinates when available", () => {
    expect(buildPlaceEmbedUrl(hakata)).toContain("q=33.5902%2C130.4207");
  });

  it("falls back to a text query without coordinates", () => {
    expect(buildPlaceEmbedUrl({ label: "福冈机场" })).toContain(`q=${encodeURIComponent("福冈机场")}`);
  });
});

describe("buildGoogleMapsDirUrl", () => {
  it("builds a directions url with waypoints and travel mode", () => {
    const url = buildGoogleMapsDirUrl([hakata, tenjin, hakata], "transit");
    expect(url).toContain("travelmode=transit");
    expect(url).toContain("waypoints=33.5914%2C130.3986");
  });
});

describe("fetchDayRoute", () => {
  it("returns an empty route when fewer than two points have coordinates", async () => {
    const route = await fetchDayRoute([hakata, { label: "未知" }], "walk");
    expect(route.legs).toEqual([]);
    expect(route.totalDurationMinutes).toBe(0);
  });

  it("uses the keyless OSRM provider when no Google key is set", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({ code: "Ok", routes: [{ legs: [{ duration: 600, distance: 1800 }] }] }),
      })),
    );
    const route = await fetchDayRoute([hakata, tenjin], "walk");
    expect(route.source).toBe("osrm");
    expect(route.legs[0].durationMinutes).toBe(10);
    expect(route.totalDistanceMeters).toBe(1800);
  });

  it("surfaces OSRM step-by-step instructions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          code: "Ok",
          routes: [{ legs: [{ duration: 600, distance: 1800, steps: [
            { distance: 900, duration: 300, name: "はかた駅前通り", maneuver: { instruction: "向东步行" } },
            { distance: 900, duration: 300, name: "住吉通り" },
          ] }] }],
        }),
      })),
    );
    const route = await fetchDayRoute([hakata, tenjin], "walk");
    expect(route.legs[0].steps?.[0].instruction).toBe("向东步行");
    expect(route.legs[0].steps?.[1].instruction).toContain("住吉通り");
  });

  it("falls back to a local estimate when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const route = await fetchDayRoute([hakata, tenjin], "drive");
    expect(route.source).toBe("estimate");
    expect(route.legs).toHaveLength(1);
  });
});
