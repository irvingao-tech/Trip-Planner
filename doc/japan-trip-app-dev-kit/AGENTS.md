# Codex Project Instructions

You are implementing the Japan Trip Planner described in `/docs`.

## Product priorities

1. Correctness over cleverness.
2. Mobile travel usability is mandatory.
3. The itinerary is the primary object, map is the primary visualization.
4. Never let AI invent transit results.
5. Route calculations and AI text generation must be separate systems.
6. All external services must go through adapters.
7. Demo Mode must work without secret keys.
8. Production Mode must never expose server-only API keys in the browser.
9. Dining is a first-class trip-planning feature, not only a generic place category.

## Required architecture

Use:

- Next.js App Router
- TypeScript strict mode
- Tailwind
- shadcn/ui compatible component structure
- Zod for input/output validation
- Repository/service adapter pattern for data and external APIs

Core adapters:

- `TripRepository`
- `PlacesProvider`
- `DirectionsProvider`
- `AIPlannerProvider`
- `PersistenceProvider`

Implement:
- Demo/local adapters first
- Supabase / Google / OpenAI adapters second

## Code quality

- No `any` unless unavoidable and documented.
- Pure functions for itinerary scoring and scheduling.
- Route planning logic must be unit-testable without network access.
- API responses must be parsed through Zod.
- UI components should not directly call Google/OpenAI/Supabase.
- Keep external provider response types outside domain models.
- Use stable IDs for itinerary items.
- Store times in ISO 8601; display in trip timezone.
- Model restaurants/cafes as Places with typed dining metadata; itinerary items remain the source of scheduled visits.
- Never let AI invent restaurant opening hours, prices, reservation availability, or signature dishes.

## UI

Reference `/docs/02-UX-UI-SPEC.md`.

Desktop:
- 240px sidebar
- Main itinerary panel
- Large right-side map
- Bottom secondary content: Wishlist / Shopping

Mobile:
- Bottom navigation
- Today first
- Map as full-screen sheet/tab
- Large touch targets
- Support iPhone and iPad portrait and landscape layouts from Phase 1 onward
- Respect iOS safe areas and the on-screen keyboard
- Do not rely on hover, right-click, or drag as the only way to complete an action
- Keep primary touch targets at least 44 x 44 CSS px
- Follow `docs/14-MOBILE-IPADOS-SPEC.md` for responsive and mobile acceptance criteria

## Security

Never commit:
- OPENAI_API_KEY
- SUPABASE_SERVICE_ROLE_KEY
- unrestricted Google server keys

Google browser key must be restricted by hostname and API.
All OpenAI calls go through server endpoints in Production Mode.

## Git workflow

Each Codex task should:
1. Read relevant docs.
2. Implement one vertical slice.
3. Add/update tests.
4. Run lint/typecheck/tests.
5. Summarize changed files.
6. Do not refactor unrelated files.

## Definition of done

A feature is done when:
- Works in Demo Mode
- Has loading / empty / error states
- Has responsive behavior
- Passes the mobile acceptance matrix for its affected screens
- Typecheck passes
- Core logic is tested
- No secrets are hardcoded
