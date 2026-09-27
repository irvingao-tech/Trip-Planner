# 09 — Test Plan

## Unit tests

Planner:
- must place before optional
- respects fixed start
- rejects closed place
- handles no-route result
- handles day end overflow
- does not duplicate items
- stable ordering
- repair removes/defer optional item first

Time:
- timezone conversion
- overnight invalid day
- DST-safe general implementation

Data:
- Zod validation
- local repository serialization

## Component tests

- Add Place form
- priority selector
- duration input
- itinerary reorder
- shopping purchased toggle
- dining form and cuisine/meal filters
- reservation-state control
- route warning
- empty states

## Integration tests

Demo Mode:
- create trip
- add places
- assign to day
- refresh
- persistence remains

Production:
- login
- create trip
- read own trip
- cannot read another user's trip
- route proxy
- AI proxy

## E2E smoke

Use Playwright browser projects/viewports for automated responsive smoke coverage. These checks complement, but do not replace, manual verification in real iPhone/iPad Safari and Home Screen standalone mode.

Desktop:
1. Open trip.
2. Add place.
3. Assign place.
4. Reorder.
5. Open map.
6. Add shopping item.
7. Add a dining place and assign it to lunch.

Mobile:
1. Open Today.
2. Select next place.
3. Open map.
4. Mark visited.
5. Open Dining, find the booked restaurant and open its map action.

Dining integration:
- save Food/Cafe place with DiningDetails
- filter by lunch/dinner and cuisine
- persist must-try dishes and dietary notes
- booked reservation produces a fixed itinerary time
- planner warns on meal-slot conflict without fabricating availability

Mobile/tablet viewport matrix:
- 320 x 568 (minimum supported compact width)
- 375 x 667 (small iPhone portrait)
- 390 x 844 (modern iPhone portrait)
- 844 x 390 (phone landscape)
- 768 x 1024 (iPad portrait)
- 1024 x 768 (iPad landscape)
- 820 x 1180 and 1180 x 820 (modern iPad class)

For each affected flow verify:
- no horizontal page scrolling or clipped primary action
- top/bottom safe-area padding
- bottom navigation does not cover content
- software keyboard does not hide the focused field or submit action
- rotation/resizing preserves current trip, day and unsaved form state
- all actions work without hover
- touch targets are at least 44 x 44 CSS px
- reorder works with touch and with move-up/move-down controls
- map gestures and bottom-sheet gestures do not conflict
- text remains usable at 200% zoom and with increased system text size where the browser exposes it

PWA smoke:
- manifest is valid and icons resolve under GitHub Pages `basePath`
- standalone launch and normal Safari-tab launch reach the same saved trip
- offline UI is not advertised unless its tested service-worker behavior is implemented

## Failure testing

Simulate:
- Google 429
- Google no route
- OpenAI timeout
- Supabase unavailable
- invalid provider payload
- slow connection
- missing image

Expected behavior:
- preserve user data
- show actionable message
- never fabricate missing route data
