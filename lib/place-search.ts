import type { Place, PlaceKind } from "./domain";

type NominatimResult = {
  place_id: number;
  osm_type: "node" | "way" | "relation" | "N" | "W" | "R";
  osm_id: number;
  lat: string;
  lon: string;
  display_name: string;
  category: string;
  type: string;
  addresstype?: string;
  address?: Record<string, string>;
  namedetails?: Record<string, string>;
  extratags?: Record<string, string>;
};

export type InternetPlaceCandidate = {
  id: string;
  name: string;
  localName?: string;
  area: string;
  address: string;
  kind: PlaceKind;
  emoji: string;
  latitude: number;
  longitude: number;
  mapUrl: string;
  sourceUrl: string;
  website?: string;
  openingHours?: string;
  categoryLabel: string;
};

const foodTypes = new Set(["restaurant", "fast_food", "food_court", "ice_cream", "bar", "pub"]);
const cafeTypes = new Set(["cafe", "coffee_shop"]);

const japaneseSearchReplacements: Array<[RegExp, string]> = [
  [/福冈/g, "福岡"], [/东京/g, "東京"], [/冲绳/g, "沖縄"], [/广岛/g, "広島"],
  [/长崎/g, "長崎"], [/鹿儿岛/g, "鹿児島"], [/横滨/g, "横浜"], [/神户/g, "神戸"],
  [/轻井泽/g, "軽井沢"], [/镰仓/g, "鎌倉"], [/涩谷/g, "渋谷"], [/银座/g, "銀座"],
  [/秋叶原/g, "秋葉原"], [/机场/g, "空港"], [/车站/g, "駅"], [/公园/g, "公園"],
  [/神宫/g, "神宮"], [/市场/g, "市場"], [/博物馆/g, "博物館"], [/美术馆/g, "美術館"],
];

export function toJapaneseSearchQuery(query: string) {
  return japaneseSearchReplacements.reduce((value, [pattern, replacement]) => value.replace(pattern, replacement), query.trim());
}

export function placeKindFromOsm(category: string, type: string): PlaceKind {
  if (cafeTypes.has(type)) return "cafe";
  if (foodTypes.has(type)) return "food";
  if (category === "shop" || type === "mall" || type === "department_store") return "shopping";
  return "sight";
}

function emojiFor(kind: PlaceKind) {
  return kind === "food" ? "🍽️" : kind === "cafe" ? "☕" : kind === "shopping" ? "🛍️" : "📍";
}

function areaFrom(address: Record<string, string> = {}) {
  const district = address.city_district || address.suburb || address.quarter || address.neighbourhood;
  const city = address.city || address.town || address.village || address.municipality;
  return [district, city].filter((part, index, values) => part && values.indexOf(part) === index).join(" · ") || address.state || "日本";
}

function sourceUrl(result: NominatimResult) {
  const type = result.osm_type.toLowerCase();
  const path = type === "n" || type === "node" ? "node" : type === "w" || type === "way" ? "way" : "relation";
  return `https://www.openstreetmap.org/${path}/${result.osm_id}`;
}

export function normalizeNominatimResult(result: NominatimResult): InternetPlaceCandidate {
  const kind = placeKindFromOsm(result.category, result.type);
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);
  const names = result.namedetails ?? {};
  return {
    id: String(result.place_id),
    name: names["name:zh"] || names.name || result.display_name.split(",")[0],
    localName: names["name:ja"] || names.name,
    area: areaFrom(result.address),
    address: result.display_name,
    kind,
    emoji: emojiFor(kind),
    latitude,
    longitude,
    mapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${latitude},${longitude}`)}`,
    sourceUrl: sourceUrl(result),
    website: result.extratags?.website || result.extratags?.["contact:website"],
    openingHours: result.extratags?.opening_hours,
    categoryLabel: kind === "food" ? "餐厅" : kind === "cafe" ? "咖啡" : kind === "shopping" ? "购物" : "景点",
  };
}

export async function searchInternetPlaces(query: string): Promise<InternetPlaceCandidate[]> {
  const params = new URLSearchParams({
    q: toJapaneseSearchQuery(query),
    format: "jsonv2",
    countrycodes: "jp",
    limit: "5",
    addressdetails: "1",
    namedetails: "1",
    extratags: "1",
    "accept-language": "zh-CN,ja,en",
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`地点服务返回 ${response.status}`);
  return ((await response.json()) as NominatimResult[]).map(normalizeNominatimResult);
}

export function candidateToPlace(candidate: InternetPlaceCandidate, name: string, duration: number): Place {
  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    localName: candidate.localName && candidate.localName !== name.trim() ? candidate.localName : undefined,
    kind: candidate.kind,
    emoji: candidate.emoji,
    area: candidate.area,
    priority: "want",
    duration,
    mapUrl: candidate.mapUrl,
    address: candidate.address,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    website: candidate.website,
    openingHours: candidate.openingHours,
    dataSource: "OpenStreetMap",
    sourceUrl: candidate.sourceUrl,
  };
}
