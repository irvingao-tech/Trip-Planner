# 07 — Internal API Contracts

These are app-owned endpoints. External provider payloads must not leak into UI components.

## POST `/api/routes/leg`

Request:
```json
{
  "origin": {"lat": 0, "lng": 0},
  "destination": {"lat": 0, "lng": 0},
  "mode": "transit",
  "departureAt": "2026-10-20T09:00:00+09:00",
  "preferences": {
    "lessWalking": false,
    "fewerTransfers": false
  }
}
```

Response:
```json
{
  "status": "ok",
  "leg": {
    "mode": "transit",
    "durationMinutes": 42,
    "distanceMeters": 12345,
    "polyline": "...",
    "steps": [],
    "provider": "google",
    "calculatedAt": "..."
  }
}
```

Failure:
```json
{
  "status": "unresolved",
  "reason": "NO_ROUTE"
}
```

## POST `/api/planner/generate`

Input:
- trip days
- places
- fixed items
- user preferences

Output:
- proposal
- warnings
- deferred place IDs
- explanation metadata

Planner logic should run locally/server-side deterministically.
AI explanation is optional.

## POST `/api/ai/place-brief`

Input:
- verified place data
- notes
- preferred language

Output:
```json
{
  "summary": "...",
  "highlights": [],
  "photoTips": [],
  "pairingIdeas": [],
  "cautions": []
}
```

## POST `/api/ai/daily-brief`

Input:
- validated itinerary
- resolved route legs
- shopping matches

Output:
```json
{
  "headline": "...",
  "summary": "...",
  "keyPoints": [],
  "warnings": []
}
```

## Repository interface

```ts
interface TripRepository {
  getTrip(id: string): Promise<Trip | null>
  saveTrip(trip: Trip): Promise<void>
  listPlaces(tripId: string): Promise<Place[]>
  savePlace(place: Place): Promise<void>
  saveItinerary(dayId: string, items: ItineraryItem[]): Promise<void>
}
```

## Directions interface

```ts
interface DirectionsProvider {
  getLeg(input: RouteLegRequest): Promise<RouteLegResult>
}
```

## AI interface

```ts
interface AIPlannerProvider {
  parsePreferences(input: string): Promise<PlannerPreferences>
  createPlaceBrief(input: PlaceBriefInput): Promise<PlaceBrief>
  createDailyBrief(input: DailyBriefInput): Promise<DailyBrief>
}
```
