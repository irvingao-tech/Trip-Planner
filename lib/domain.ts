export type AppSection = "today" | "map" | "places" | "more";
export type PlaceKind = "sight" | "food" | "cafe" | "shopping";

export interface Place {
  id: string;
  name: string;
  localName?: string;
  kind: PlaceKind;
  area: string;
  priority: "must" | "want" | "optional";
  duration: number;
  cuisine?: string;
  meal?: "早餐" | "午餐" | "咖啡" | "晚餐";
  mustTry?: string;
  reservation?: "无需预约" | "计划预约" | "已预约";
  note?: string;
  mapUrl?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  website?: string;
  openingHours?: string;
  dataSource?: "OpenStreetMap";
  sourceUrl?: string;
  emoji: string;
}

export interface TimelineItem {
  time: string;
  placeId: string;
  transitAfter?: string;
}

export type TravelPace = "relaxed" | "normal" | "intensive";

export type StopStatus = "planned" | "visited" | "skipped";

export interface PlannedStop {
  placeId: string;
  time: string;
  /** @deprecated Use `status` instead. Kept for reading legacy localStorage data. */
  visited?: boolean;
  status?: StopStatus;
  /** When set, this stop renders as a todo nested under the given place card. */
  parentPlaceId?: string;
}

export interface DayActivity {
  steps?: number;
  distanceKm?: number;
  calories?: number;
}

export interface DayPlan {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  pace: TravelPace;
  stops: PlannedStop[];
  /** Explicit card order for the day: "stop:<placeId>" | "shop:<shoppingId>". */
  order?: string[];
  /** Manually recorded daily activity (steps / distance / calories). */
  activity?: DayActivity;
}

export interface TripProfile {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  pace: TravelPace;
  interests: string[];
}

export type ShoppingCategory = "souvenir" | "clothing" | "electronics" | "food" | "cosmetics" | "other";

export interface ShoppingItem {
  id: string;
  name: string;
  category?: ShoppingCategory;
  storeName?: string;
  area?: string;
  estimatedPrice?: number;
  currency?: string;
  purchased: boolean;
  dayId?: string;
  time?: string;
  note?: string;
  /** When set, this item renders as a todo nested under the given place card. */
  parentPlaceId?: string;
  /** Todo type for the nested checklist. Defaults to shopping. */
  todoKind?: "shopping" | "food" | "checkin";
}

export type TravelMode = "walk" | "transit" | "drive";
