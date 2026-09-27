# 08 — Implementation Plan

## Phase 0 — Repository baseline
Goal: compile, lint, test, deploy empty shell.

Tasks:
- Next.js + TypeScript
- Tailwind
- ESLint
- Vitest
- Playwright viewport smoke-test baseline
- folder structure
- environment schema
- GitHub Actions
- app mode flag

Acceptance:
- local dev works
- production build works
- static Demo export works
- automated compact and tablet viewport smoke tests can run in CI

## Phase 1 — UI shell
Build:
- sidebar
- header
- trip switcher
- overview screen
- responsive layout
- web app manifest, icons and safe-area tokens

Use mock data only.

Acceptance:
- visual match to concept direction
- compact, medium and expanded layouts
- iPhone and iPad portrait/landscape shell behavior follows doc 14
- safe-area-aware bottom navigation and no horizontal page overflow

## Phase 2 — Place Wishlist
Build:
- place list/cards
- add/edit/delete
- category
- priority
- duration
- local search/filter
- localStorage repository

Acceptance:
- refresh preserves data
- no external API required
- add/edit/filter works without hover and with the iOS on-screen keyboard

## Phase 2B — Dining & Food
Build:
- dining view over Food/Cafe places
- cuisine and meal-slot metadata
- must-try dishes
- budget and dietary notes
- reservation status and notes
- cuisine / meal / reservation filters
- assign restaurant to day and meal slot

Acceptance:
- dining data persists through LocalTripRepository
- restaurant can be saved and assigned in <= 30 sec on a phone
- booked meal time becomes a fixed itinerary constraint
- no external restaurant API is required
- food UI follows `docs/15-DINING-SPEC.md`

## Phase 3 — Daily Itinerary
Build:
- day tabs
- timeline
- assign place to day
- drag reorder
- fixed-time item
- visit/skipped status

Acceptance:
- manual itinerary is fully usable without route provider
- reorder has touch drag plus move-up/move-down fallback

## Phase 4 — Map
Build:
- map abstraction
- mock map adapter for Demo
- Google Maps adapter
- markers
- selected marker sync
- route polyline

Acceptance:
- selecting itinerary item focuses marker
- phone map is full-screen with a usable itinerary sheet; tablet layout follows available width

## Phase 5 — Routing
Build:
- DirectionsProvider interface
- mock provider
- server Google adapter
- adjacent route legs
- route cache
- warnings

Acceptance:
- no key required in Demo
- Production gets real routes
- route warnings and external-map actions remain reachable on compact screens

## Phase 6 — Deterministic Auto Planner
Build:
- place eligibility
- region clustering
- fixed items
- best insertion heuristic
- schedule validation
- repair/defer
- unit tests

Acceptance:
- planner never silently violates opening/fixed constraints

## Phase 7 — Shopping
Build:
- items
- purchased toggle
- store/place link
- map/day proximity suggestions

Acceptance:
- daily brief can surface shopping opportunities

## Phase 8 — Supabase
Build:
- schema
- auth
- RLS
- repositories
- migration path from local demo

Acceptance:
- two users cannot read each other’s trips

## Phase 9 — AI
Build:
- preference parser
- place brief
- daily brief
- structured output
- retries / timeout / fallback

Acceptance:
- app still works if AI fails

## Phase 10 — Production hardening
- accessibility
- loading skeletons
- error states
- mobile regression polish (mobile support is required in every earlier phase)
- analytics
- API rate limiting
- cost controls
- security headers
- E2E tests

## Cross-phase mobile gate

Every UI phase is incomplete until the affected flow:
- works at `320`, `375`, `390`, `768`, `820`, `1024` and desktop widths
- works with touch and keyboard without hover-only actions
- respects iOS safe areas and dynamic viewport height
- preserves state across responsive layout changes
- has no unintended horizontal page scrolling
- includes at least one compact and one tablet automated viewport check

Use `docs/14-MOBILE-IPADOS-SPEC.md` as the detailed acceptance source.

## Recommended Codex issue size

One task should normally be:
- 1 vertical feature
- <= ~10–15 touched files
- one clear acceptance test

Avoid prompts like:
> Implement the whole app.

Prefer:
> Implement Phase 2 Wishlist using LocalTripRepository per docs 01/03/04.
