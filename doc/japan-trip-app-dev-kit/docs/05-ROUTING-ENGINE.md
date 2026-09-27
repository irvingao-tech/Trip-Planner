# 05 — Routing & Auto Planning Engine

## Objective

Create an editable itinerary that satisfies:
- opening hours
- fixed-time events
- user day boundaries
- priority
- travel time
- visit duration
- walking preference
- region clustering
- meal-slot suitability and confirmed dining reservations

This is not pure shortest-path optimization.

## Recommended planner pipeline

### Stage 1 — Normalize
For every place:
- lat/lng
- duration
- priority score
- candidate days
- opening intervals
- fixed time if any

### Stage 2 — Geographic clustering
Group by:
- city / region
- distance
- rail corridor
- manual labels

Do not send Dazaifu and distant Fukuoka locations back-and-forth in the same day unless constraints require it.

### Stage 3 — Day allocation
Allocate must-go places first.

Heuristic score:
```
allocationScore =
  priorityWeight
  + sameRegionBonus
  + dayPreferenceBonus
  - estimatedTravelPenalty
  - scheduleRiskPenalty
```

### Stage 4 — In-day ordering
Start with fixed events.
Insert flexible places around them.

Confirmed restaurant reservations are fixed events. Flexible dining candidates should receive a penalty when scheduled outside their selected meal slots. The planner may warn that a meal is missing, but must not invent restaurant availability or insert an unselected venue without user approval.

Suggested insertion cost:
```
cost =
  extraTravelMinutes * travelWeight
  + waitingMinutes * waitWeight
  + latePenalty
  + walkingPenalty
  + regionSwitchPenalty
```

### Stage 5 — Route resolution
For each adjacent pair:
- request DirectionsProvider
- choose transit / walk
- insert travel duration
- recompute arrival/departure

### Stage 6 — Validate
Check:
- arrival during opening interval
- end before daily finish
- fixed event compatibility
- route exists
- buffer >= minimum

### Stage 7 — Repair
If invalid:
- swap
- move item to another day
- remove optional place
- suggest earlier start

### Stage 8 — Explain
AI may explain:
- why places were grouped
- what was dropped
- what constraints caused warnings

AI must not create route facts.

## First algorithm implementation

MVP should use deterministic heuristics, not OR-Tools initially.

Pseudo:

```ts
for day of days:
  placePool = eligiblePlaces(day)
  schedule = seedFixedItems(day)

  while placePool not empty:
    candidate = bestInsertion(placePool, schedule)
    if candidate.feasible:
      insert(candidate)
    else:
      defer(candidate)

  resolveRouteLegs(schedule)
  repairSchedule(schedule)
```

## Route caching

Cache key:
```
originLatLng
destinationLatLng
mode
departureTimeBucket
preference
```

Recommended time bucket:
- 10 or 15 minutes

TTL:
- planning estimates can be reused
- live day-of travel should refresh

## Fallback

If Google route unavailable:
- preserve itinerary
- show `Route unresolved`
- do not invent minutes
