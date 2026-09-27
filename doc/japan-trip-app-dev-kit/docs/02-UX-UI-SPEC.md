# 02 — UX / UI Specification

## Design direction

Combination of:
- Apple Maps clarity
- Linear information density
- Notion-style editable data
- Japanese travel editorial accents

Visual tone:
- clean
- calm
- light
- map-first
- minimal decoration

## Color system

Base:
- Background: `#F7F7F8`
- Surface: `#FFFFFF`
- Text: `#1D1D1F`
- Muted text: `#737373`
- Border: `#E8E8EA`

Accent:
- Japan vermilion: `#E7472E`

Semantic:
- success
- warning
- danger
- transit
Use Tailwind semantic tokens rather than hard-coded component colors.

## Desktop shell

```
┌──────────┬─────────────────────────────────────────┐
│ Sidebar  │ Top Search / Trip Switcher              │
│          ├─────────────────────────────────────────┤
│          │ Header / Summary Cards                  │
│          ├─────────────────────┬───────────────────┤
│          │ Daily Itinerary     │ Map               │
│          │                     │                   │
│          ├─────────────────────┴───────────────────┤
│          │ Wishlist / Shopping                     │
└──────────┴─────────────────────────────────────────┘
```

Sidebar: 220–240 px.

Main recommended ratio:
- itinerary: ~44%
- map: ~56%

## Main nav

- Overview
- Itinerary
- Map
- Places
- Dining
- Shopping
- Notes

## Overview screen

Header:
- Trip cover thumbnail
- Trip name
- dates
- day count
- regions
- Auto Plan button

Summary cards:
- total days
- saved places
- estimated transit
- estimated walking
- shopping completion

Main:
- current selected day
- timeline
- map

Bottom:
- place and dining wishlist cards
- shopping table/list

## Itinerary item

Contents:
- arrival time
- sequence number
- thumbnail/icon
- name
- subtitle / area
- visit duration
- overflow menu

Between items show a RouteLeg:
- icon
- transport mode
- duration
- optional line name
- warning state

## Map

Marker behavior:
- numbered markers matching timeline order
- hover/select sync between marker and itinerary
- route polyline
- Day selector
- map / satellite optional
- focus selected place
- fit bounds

## Place drawer

Right drawer / modal:
- name
- image
- category
- priority
- address
- opening hours
- duration
- notes
- AI brief
- add to day
- external maps link

## Auto Plan dialog

Inputs:
- date range / selected days
- start/end time
- start/end location
- pace
- walking preference
- transport modes
- priority mode
- fixed items

Result preview:
- proposed day groups
- warnings
- apply / cancel

## Mobile

Responsive modes:
- Compact: `320–767 px` — phone layout, single column, bottom navigation.
- Medium: `768–1023 px` — iPad portrait / small tablet, adaptive split view where useful.
- Expanded: `>= 1024 px` — iPad landscape / desktop, sidebar and itinerary-map split view.

Treat breakpoints as layout triggers, not device detection. Components must also tolerate split-screen widths.

Bottom nav:
- Today
- Plan
- Map
- Places
- More

Within Places on compact layouts, provide top-level `All` and `Dining` views so food remains reachable without adding a sixth bottom-navigation item.

Today screen:
- current/next item large
- timeline
- “Open in Maps”
- mark visited
- quick notes

Map:
- full screen
- draggable bottom sheet for itinerary

### iPhone behavior

- Today is the default travel-day landing screen.
- Use a fixed bottom navigation that includes `padding-bottom: env(safe-area-inset-bottom)`.
- Top bars and full-screen sheets respect `env(safe-area-inset-top)`.
- Primary actions remain reachable above the bottom bar and virtual keyboard.
- Minimum interactive target is `44 x 44 CSS px`; keep at least `8 px` spacing between adjacent destructive/primary controls.
- Avoid hover-only affordances. Overflow actions open by tap.
- Reordering supports both drag handles and an accessible move-up/move-down action.
- Forms use appropriate input types and do not auto-zoom due to undersized text inputs.

### iPad behavior

- Portrait defaults to a list/detail or itinerary/map switcher; do not squeeze the desktop three-column shell.
- Landscape may use the expanded sidebar plus itinerary/map split layout.
- Map and detail panes may appear side by side when each pane retains a useful minimum width.
- Support touch, trackpad and keyboard without making any one input method mandatory.
- Layout must remain functional in iPad split view at compact and medium effective widths.

### Mobile map and sheet

- The map viewport must use dynamic viewport units (`dvh`) with a safe fallback, not only `100vh`.
- The itinerary bottom sheet has collapsed, half and expanded states and a visible grab handle.
- Panning the map and dragging the sheet must not fight for the same gesture region.
- Selecting a marker exposes the same actions available from the itinerary card.
- Provide a non-map list path for all destinations and route warnings.

### Orientation and state

- Portrait/landscape changes preserve selected day, selected place, sheet position where practical, and unsaved form data.
- Do not lock orientation.
- Avoid fixed pixel heights for primary content; account for browser chrome and the software keyboard.

### Installable web app

- Provide a web app manifest, icons and theme/background colors.
- `display: standalone` is supported, but every feature must also work in a normal Safari tab.
- Service worker/offline caching is a later enhancement; do not claim offline support until tested.

## Interaction principles

- Every auto-generated result must remain manually editable.
- Drag reorder is a first-class action.
- Never hide route errors.
- Show assumptions near generated plans.
- A place card should require <= 2 taps to assign to a day.
- A dining card should show cuisine, meal suitability, must-try dish and reservation state without opening its detail view.
