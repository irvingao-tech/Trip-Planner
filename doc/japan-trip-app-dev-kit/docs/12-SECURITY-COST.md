# 12 — Security & Cost Controls

## API keys

### OpenAI
Server only.
Never prefix with `NEXT_PUBLIC_`.

### Google Maps
Browser map key:
- restrict by HTTP referrer
- restrict to required APIs

Routes key:
- call server-side
- restrict by API where possible

### Supabase
Publishable key may be used by client with RLS.
Privileged/service keys must stay server-only.

## RLS

Production database must enable Row Level Security on user-owned tables.

Core invariant:
- user can access only trips they own
- descendants inherit trip ownership

## Input validation

All API route input:
- Zod parse
- length limits
- enum validation
- coordinates range check
- ISO timestamp validation

## Rate limits

AI:
- per user/minute
- per user/day budget

Routes:
- cache aggressively during planning
- debounce itinerary changes
- do not recompute every drag frame
- recompute after drop

## Cost strategy

Planning flow:
1. Use approximate/cached matrix.
2. Decide likely order.
3. Resolve exact adjacent legs.
4. Only refresh when itinerary materially changes.

AI:
- brief generation on demand
- cache generated brief against input hash
- do not regenerate every page view

## Privacy

Do not store:
- passport information
- payment credentials
unless a future feature explicitly requires and is designed for it.

Trip data may reveal location plans; keep trips private by default.
