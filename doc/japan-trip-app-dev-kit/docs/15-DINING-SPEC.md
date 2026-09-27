# 15 — Dining and Food Specification

## 1. Product role

Dining is a first-class part of a Japan trip, not just a label on a place. It must support discovery notes, meal planning, reservations and day-of execution while reusing the common Place, map and itinerary systems.

Restaurants and cafes are `Place` records with category `Food` or `Cafe`. Optional `DiningDetails` stores food-specific metadata. A scheduled meal is still an `ItineraryItem`, so routing and timeline behavior stay consistent.

## 2. MVP jobs

The user can:
- save a restaurant or cafe manually
- record cuisine and suitable meal slots
- record one or more must-try dishes
- record budget per person and free-form practical notes
- track whether a reservation is required, planned, booked or unavailable
- store a booking link and confirmation note
- record queue and dietary/allergy notes
- filter the dining list
- assign a venue to a day and meal slot
- open the venue in an external map during the trip

External restaurant search, live table availability and automated booking are not required for the GitHub Pages MVP.

## 3. Dining list

Default card content:
- restaurant/cafe name
- region
- cuisine chips
- meal-slot chips
- top must-try dish
- priority
- estimated budget
- reservation badge
- quick `Add to day` action

Filters:
- search text
- Food / Cafe
- cuisine
- breakfast / lunch / cafe / dinner / late night
- priority
- reservation status
- region

Useful saved views:
- Must eat
- Booked
- Needs reservation
- Near today's route (available after route support)

## 4. Add/edit flow

Compact phone flow should use a full-screen form or sheet.

Required fields:
- name
- Food or Cafe category
- priority

Progressive optional fields:
- address/map link
- cuisine types
- meal slots
- must-try dishes
- duration
- budget per person/currency
- reservation state and booking details
- queue note
- dietary note
- verified last-order time

The first save should remain fast; advanced fields must not block saving.

## 5. Itinerary integration

- Assigning a dining place creates an `ItineraryItem` referencing the same Place.
- Meal slot is planning intent, not an invented time.
- A booked date/time uses `fixedStartAt` and behaves like any other fixed event.
- Default visit duration may be suggested locally, but remains editable.
- Planner warns if lunch/dinner is missing or scheduled outside the preferred slot.
- Planner must never claim availability or create a reservation.
- Route calculation is identical to other itinerary stops.

Suggested default meal windows are user-editable trip preferences rather than venue facts. Initial defaults may be:
- breakfast: 07:00–10:00
- lunch: 11:00–14:30
- cafe: 13:00–17:30
- dinner: 17:00–21:30
- late night: 21:00–02:00

## 6. Day-of mobile experience

For the next dining stop show:
- venue and must-try dishes
- reservation time/status
- booking/confirmation note
- dietary or queue warning
- Open in Maps
- mark visited / skipped
- quick note

Sensitive confirmation data should be kept minimal. Do not ask users to store payment card details or identity documents.

## 7. AI boundary

AI may:
- organize user-entered dining notes
- summarize verified supplied metadata
- explain why a selected restaurant fits the day
- suggest that the user verify live hours or availability

AI must not invent:
- menu items or signature dishes
- current price
- opening or last-order times
- queue duration
- reservation availability or confirmation
- dietary safety guarantees

## 8. GitHub Pages behavior

Demo Mode uses local data and mock/demo content only. All dining features must work without API keys. A user can open the deployed site on a phone or iPad, but saved dining data stays in that browser profile and does not automatically sync to another device.

## 9. Acceptance criteria

- Add a dining place and assign it to a meal slot in <= 30 seconds on a phone.
- Save multiple must-try dishes.
- Filter by cuisine, meal slot and reservation state.
- Booked reservation time appears as a fixed itinerary item.
- Dining cards and forms work at compact, medium and expanded widths.
- All primary actions have 44 x 44 CSS px touch targets.
- Software keyboard does not cover Save/Cancel.
- Refresh preserves data in Demo Mode.
- No unavailable external provider prevents manual dining planning.
