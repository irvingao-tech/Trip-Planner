# 04 — Data Model

## Domain model

### Trip
```ts
type Trip = {
  id: string
  ownerId?: string
  name: string
  startDate: string
  endDate: string
  timezone: string
  currency: string
  homeBasePlaceId?: string
  coverImageUrl?: string
  createdAt: string
  updatedAt: string
}
```

### TripDay
```ts
type TripDay = {
  id: string
  tripId: string
  date: string
  startTime: string
  endTime: string
  startPlaceId?: string
  endPlaceId?: string
  pace: "relaxed" | "normal" | "intensive"
  walkingPreference: "normal" | "less"
}
```

### Place
```ts
type Place = {
  id: string
  tripId: string
  providerPlaceId?: string
  name: string
  nameLocal?: string
  category: PlaceCategory
  priority: "must" | "want" | "optional"
  latitude: number
  longitude: number
  address?: string
  region?: string
  visitDurationMinutes: number
  notes?: string
  websiteUrl?: string
  imageUrl?: string
}
```

### OpeningHours
Store normalized weekly periods plus provider raw data if needed.

### DiningDetails
One-to-one optional metadata for a `Place` whose category is `Food` or `Cafe`.

```ts
type DiningDetails = {
  placeId: string
  cuisineTypes: string[]
  mealSlots: Array<"breakfast" | "lunch" | "cafe" | "dinner" | "late_night">
  mustTryDishes: string[]
  estimatedBudgetPerPerson?: number
  currency?: string
  reservationRequired: boolean
  reservationStatus: "none" | "planned" | "booked" | "not_available"
  bookingUrl?: string
  reservationNote?: string
  queueNote?: string
  dietaryNotes?: string
  verifiedLastOrderTime?: string
}
```

Reservation date/time belongs on the scheduled `ItineraryItem.fixedStartAt`; `DiningDetails` stores reusable venue information and reservation notes.

### ItineraryItem
```ts
type ItineraryItem = {
  id: string
  tripDayId: string
  placeId: string
  orderIndex: number
  fixed: boolean
  fixedStartAt?: string
  plannedArrivalAt?: string
  plannedDepartureAt?: string
  status: "planned" | "visited" | "skipped"
}
```

### RouteLeg
```ts
type RouteLeg = {
  id: string
  tripDayId: string
  fromItineraryItemId?: string
  toItineraryItemId?: string
  mode: "walk" | "transit" | "drive" | "bike"
  durationMinutes: number
  distanceMeters?: number
  polyline?: string
  provider: "mock" | "google"
  calculatedAt: string
  rawSummary?: Record<string, unknown>
}
```

### ShoppingItem
```ts
type ShoppingItem = {
  id: string
  tripId: string
  name: string
  category?: string
  preferredPlaceId?: string
  storeName?: string
  estimatedPrice?: number
  currency?: string
  purchased: boolean
  notes?: string
}
```

## PostgreSQL tables

- profiles
- trips
- trip_days
- places
- place_opening_hours
- dining_details
- itinerary_items
- route_legs
- shopping_items
- notes
- generated_briefs

## Ownership

Every user-owned table must be traceable to `auth.uid()`.

Recommended:
- trip owns all descendants
- enforce access through joins/RLS
- avoid trusting client-sent owner IDs

## SQL starter

See `starter/supabase/migrations/0001_initial.sql`.
