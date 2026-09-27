export type AppSection = "today" | "plan" | "map" | "places" | "more";
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

export interface PlannedStop {
  placeId: string;
  time: string;
  visited?: boolean;
}

export interface DayPlan {
  id: string;
  date: string;
  title: string;
  startTime: string;
  endTime: string;
  pace: TravelPace;
  stops: PlannedStop[];
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
