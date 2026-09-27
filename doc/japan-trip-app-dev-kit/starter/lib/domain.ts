export type PlacePriority = "must" | "want" | "optional";

export type PlaceCategory =
  | "sightseeing"
  | "food"
  | "cafe"
  | "shopping"
  | "hotel"
  | "station"
  | "photo"
  | "onsen"
  | "nature"
  | "museum"
  | "custom";

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  timezone: string;
  currency: string;
}

export interface Place {
  id: string;
  tripId: string;
  name: string;
  category: PlaceCategory;
  priority: PlacePriority;
  latitude: number;
  longitude: number;
  visitDurationMinutes: number;
  address?: string;
  region?: string;
  notes?: string;
}
