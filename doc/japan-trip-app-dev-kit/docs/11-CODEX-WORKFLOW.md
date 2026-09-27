# 11 — Codex Workflow

## Recommended workflow

### Step 1 — Give Codex repository context

Start with:
> Read AGENTS.md and docs/01, 02, 03, 04, 08. Do not code yet. Summarize architecture and identify files needed for Phase 0.

Then:
> Implement Phase 0 only. Run typecheck/lint/tests/build.

### Step 2 — Build vertical slices

Prompt example:
> Implement Phase 2 Place Wishlist. Use LocalTripRepository. Include add/edit/delete, category, priority, duration, search/filter and localStorage persistence. Follow docs/01-04. Do not add Supabase yet. Add tests.

### Step 3 — Review

Prompt:
> Review the implementation against the acceptance criteria in docs/08. Fix only blocking deviations. Run all checks.

## Good Codex task template

```
Goal:
<one feature>

Read first:
<docs>

Constraints:
- keep Demo Mode working
- no secrets
- no unrelated refactor

Acceptance:
- ...
- ...
- tests pass

Before finishing:
- run lint
- run typecheck
- run tests
- run build
- summarize changes
```

## Suggested task order

1. Bootstrap
2. Shell UI
3. Domain types
4. Local repository
5. Wishlist
6. Itinerary
7. Drag/reorder
8. Demo map
9. Google map adapter
10. Route leg interface
11. Google route proxy
12. Planner heuristics
13. Shopping
14. Supabase schema
15. Auth/RLS
16. Supabase repository
17. AI endpoints
18. Mobile regression polish (mobile support is implemented throughout earlier UI tasks)
19. E2E
20. Production deploy

## Codex rule

Do not ask Codex to simultaneously:
- redesign UI
- change database
- add AI
- refactor architecture

Keep each iteration independently testable.
