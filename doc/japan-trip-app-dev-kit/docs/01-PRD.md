# 01 — Product Requirements Document

## 1. Product goal

Build a personal Japan travel planning app that converts a collection of places and shopping goals into an executable day-by-day itinerary with maps, transit legs, place notes, and AI-generated travel guidance.

Primary target: personal Japan travel.
Initial real-world dataset: Kyushu / Fukuoka trip.

Primary client: responsive web app used in Safari on iPhone and iPad, as well as desktop browsers. The MVP may be installable as a PWA, but a native App Store build is not required.

## 2. Primary user jobs

### Before the trip
- Collect places from search, URL or manual entry.
- Classify places.
- Set must-go / want-to-go / optional.
- Set expected duration.
- Set fixed reservation time if needed.
- Organize shopping targets.
- Collect restaurants, cafes and must-try dishes.
- Track meal type, budget, reservation and dietary notes.
- Generate day plans.
- Review route and walking / transit burden.

### During the trip
- Open “Today”.
- See next destination.
- Check current day route.
- Open place notes.
- Mark places visited.
- Mark shopping items purchased.
- Open the next meal plan, reservation note or restaurant map link.
- Adjust/reorder the day quickly.
- Re-plan remaining items.

## 3. Core entities

- Trip
- TripDay
- Place
- ItineraryItem
- RouteLeg
- ShoppingItem
- Note
- AITravelBrief
- DiningDetails

## 4. MVP scope

### Must have
- Create/edit trip
- Add/edit/delete places
- Place categories
- Priority
- Visit duration
- Assign place to day
- Drag reorder itinerary
- Daily timeline
- Map markers
- Route legs
- Local persistence
- Shopping list
- Dining list with cuisine/meal filters
- Must-try dishes and dining notes
- Reservation status and fixed meal-time planning
- Responsive layout
- iPhone and iPad portrait/landscape support
- iOS safe-area and on-screen-keyboard handling
- Touch-first alternatives for drag, hover and context-menu interactions
- Demo Mode GitHub Pages deployment

### Should have
- Google place search
- Google transit route segments
- Estimated total travel time
- Estimated walking distance
- Auto Plan
- AI place brief
- AI daily summary
- Supabase sync
- Authentication

### Later
- Weather-aware replanning
- Live delay awareness
- Reservations
- Shared trips
- Expense tracking
- Offline PWA
- Import from screenshots / social links
- OCR / URL place extraction
- Collaborative editing

## 5. Non-goals for MVP

Do not build:
- Hotel booking
- Flight booking
- User social network
- Review platform
- General travel marketplace
- Complex multi-user permissions
- Full offline navigation

## 6. Place categories

- Sightseeing
- Food
- Cafe
- Shopping
- Hotel
- Station
- Photo Spot
- Onsen
- Nature
- Museum
- Custom

## 7. Priority

- `must` — 必去
- `want` — 想去
- `optional` — 有时间再去

## 7A. Dining requirements

Food and cafe locations remain `Place` records so they can use the same map, route and itinerary systems. A dining place can additionally define:
- cuisine types
- suitable meal slots: breakfast / lunch / cafe / dinner / late night
- must-try dishes
- estimated budget per person
- reservation required and reservation status
- booking URL / confirmation note
- queue expectations
- dietary or allergy notes
- last-order time when verified

MVP dining flow:
1. Add or import a restaurant/cafe.
2. Record what to eat and practical notes.
3. Filter by cuisine, meal slot, priority and reservation status.
4. Assign it to a trip day and optional meal slot.
5. Treat confirmed reservation time as a fixed itinerary constraint.
6. Open the location in an external map during the trip.

See `15-DINING-SPEC.md`.

## 8. Trip planning constraints

Each place can define:
- preferred days
- unavailable days
- fixed start time
- opening hours
- visit duration
- priority
- region
- minimum/maximum arrival time

Each day can define:
- day start location
- day end location
- earliest start
- latest finish
- travel intensity
- walking preference

## 9. Auto Plan output

For each day:
- ordered itinerary
- arrival time
- visit duration
- departure time
- transport leg
- buffer
- warnings

Warnings:
- closed at arrival
- insufficient transfer time
- exceeds day end
- too much walking
- unresolved route
- fixed event conflict

## 10. Success metrics

MVP:
- New place can be added in < 30 sec.
- Day reorder feels instant.
- Planner result is editable.
- User always knows “where next”.
- No AI-generated transit facts are presented as authoritative.
- App remains usable if AI is unavailable.
- Core trip-day flow is usable one-handed on a small iPhone viewport.
- A restaurant can be saved and assigned to a meal slot in <= 30 sec.
- No horizontal page scrolling at supported mobile/tablet widths.
- Rotation and viewport resizing do not lose unsaved user state.
