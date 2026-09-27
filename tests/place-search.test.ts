import { describe, expect, it } from "vitest";
import { normalizeNominatimResult, placeKindFromOsm, toJapaneseSearchQuery } from "../lib/place-search";

describe("internet place normalization", () => {
  it("classifies dining and shopping places", () => {
    expect(placeKindFromOsm("amenity", "restaurant")).toBe("food");
    expect(placeKindFromOsm("amenity", "cafe")).toBe("cafe");
    expect(placeKindFromOsm("shop", "department_store")).toBe("shopping");
  });

  it("converts common Chinese trip terms for Japanese map search", () => {
    expect(toJapaneseSearchQuery("福冈机场")).toBe("福岡空港");
    expect(toJapaneseSearchQuery("东京车站")).toBe("東京駅");
  });

  it("derives trip-ready fields from a Nominatim result", () => {
    const place = normalizeNominatimResult({
      place_id: 42,
      osm_type: "node",
      osm_id: 99,
      lat: "33.5859",
      lon: "130.4507",
      display_name: "福冈机场, 博多区, 福冈市, 日本",
      category: "aeroway",
      type: "aerodrome",
      address: { city_district: "博多区", city: "福冈市" },
      namedetails: { "name:zh": "福冈机场", "name:ja": "福岡空港" },
      extratags: { website: "https://www.fukuoka-airport.jp/" },
    });

    expect(place.name).toBe("福冈机场");
    expect(place.localName).toBe("福岡空港");
    expect(place.area).toBe("博多区 · 福冈市");
    expect(place.mapUrl).toContain("33.5859%2C130.4507");
    expect(place.website).toBe("https://www.fukuoka-airport.jp/");
  });
});
