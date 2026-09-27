import type { Place, Trip } from "./domain";

export interface TripRepository {
  getTrip(id: string): Promise<Trip | null>;
  saveTrip(trip: Trip): Promise<void>;
  listPlaces(tripId: string): Promise<Place[]>;
  savePlace(place: Place): Promise<void>;
  deletePlace(placeId: string): Promise<void>;
}

export type RouteMode = "walk" | "transit" | "drive" | "bike";

export interface RouteLegRequest {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  mode: RouteMode;
  departureAt?: string;
}

export type RouteLegResult =
  | {
      status: "ok";
      durationMinutes: number;
      distanceMeters?: number;
      polyline?: string;
      provider: "mock" | "google";
    }
  | {
      status: "unresolved";
      reason: string;
    };

export interface DirectionsProvider {
  getLeg(request: RouteLegRequest): Promise<RouteLegResult>;
}
