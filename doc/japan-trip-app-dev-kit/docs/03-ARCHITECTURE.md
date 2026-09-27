# 03 — Technical Architecture

## Target architecture

```
Browser / Next.js UI
        |
        v
Application services
        |
  --------------------------
  |          |             |
TripRepo  RouteProvider  AIProvider
  |          |             |
Local/    Mock/Google     Mock/OpenAI
Supabase
```

## Key principle

Domain logic does not depend directly on external SDKs.

Use adapters so:
- GitHub Pages can run mock/local adapters
- Production can switch to Supabase / Google / OpenAI

## Suggested folder layout

```
app/
  (app)/
    overview/
    itinerary/
    map/
    places/
    shopping/
  api/
    ai/
    routes/
components/
  app-shell/
  itinerary/
  map/
  places/
  shopping/
domain/
  trip/
  place/
  itinerary/
  routing/
lib/
  adapters/
    demo/
    supabase/
    google/
    openai/
  services/
  validation/
  utils/
store/
supabase/
tests/
```

## Runtime profiles

### `NEXT_PUBLIC_APP_MODE=demo`

- LocalTripRepository
- MockDirectionsProvider
- MockAIPlannerProvider
- localStorage
- static export compatible

### `NEXT_PUBLIC_APP_MODE=production`

- SupabaseTripRepository
- GoogleDirectionsProvider through server API
- OpenAIPlannerProvider through server API
- SSR/auth allowed
- deploy Vercel

## State split

Remote/domain persisted state:
- trips
- places
- itinerary
- shopping

UI state:
- selected day
- selected marker
- drawer open
- current filter
- temporary drag state

Avoid storing persisted domain state only in Zustand in Production Mode.

## External integrations

### Google
Browser:
- Maps JavaScript rendering
- Places UI/search where safe

Server:
- Routes API calls
- route matrix
- secret or restricted server credentials

### OpenAI
Server only:
- trip preference parsing
- structured planning explanation
- place brief
- daily brief

### Supabase
- Auth
- Postgres
- RLS
- optional Storage

## Important transit constraint

Transit `computeRoutes` works point-to-point and transit routes do not support intermediate waypoints.

Therefore multi-stop trips must be modeled as:
1. Planner chooses stop ordering.
2. DirectionsProvider requests each adjacent leg.
3. Aggregate duration/cost/walking.
4. Re-score schedule.
5. Iterate if needed.

## Error boundaries

UI must distinguish:
- provider unavailable
- no transit route found
- closed place conflict
- stale route estimate
- AI unavailable
- authentication failure

Never convert these to generic “Something went wrong” only.

## Responsive client architecture

- Use one semantic component tree where practical; do not create separate phone and desktop applications.
- Centralize layout breakpoints and safe-area spacing in design tokens.
- Prefer CSS container/media queries for presentation changes; JavaScript viewport checks must not be required for initial rendering.
- Browser-only APIs (`localStorage`, geolocation, install prompts) must be guarded and accessed after hydration.
- Persist domain state independently from transient responsive UI state so rotation or breakpoint changes do not lose edits.
- Lazy-load map/provider code so the Today/list flow remains fast on mobile networks.
- Treat touch, pointer, keyboard and assistive technology as supported inputs.
- See `14-MOBILE-IPADOS-SPEC.md` for the device matrix and implementation constraints.
