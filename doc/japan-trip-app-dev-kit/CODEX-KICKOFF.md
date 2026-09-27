# Codex Kickoff Prompt

把下面内容作为第一次给 Codex 的任务：

---

Read `AGENTS.md` and all documents under `/docs`.

We are building the Japan Trip Planner described there.

For this first task, implement **Phase 0 + Phase 1 only**:

1. Bootstrap a current stable Next.js App Router project with TypeScript.
2. Configure Tailwind.
3. Create the required folder structure from `docs/03-ARCHITECTURE.md`.
4. Add strict domain types based on `docs/04-DATA-MODEL.md`.
5. Implement `NEXT_PUBLIC_APP_MODE=demo`.
6. Build the responsive application shell and Overview UI described in `docs/02-UX-UI-SPEC.md`.
   Follow `docs/14-MOBILE-IPADOS-SPEC.md`; implement compact phone, iPad portrait and iPad landscape/desktop modes from the start.
7. Use `/starter/data/kyushu-demo.json` as the mock dataset.
8. Do NOT add Supabase, Google Routes, OpenAI, authentication, or real network calls yet.
9. Keep external integrations behind interfaces so they can be added later.
10. Add sensible empty/loading/error UI states where relevant.
11. Set up lint, typecheck and unit test commands.
12. Ensure a static production export works for GitHub Pages Demo Mode.
13. Add viewport tests for at least one iPhone-sized and one iPad-sized layout.

Before finishing:
- run lint
- run typecheck
- run tests
- run build
- list all changed files
- explain any deviation from the docs

Do not implement later phases.
Do not refactor unrelated code.
Do not hardcode secret keys.

---

第二轮建议：
> Implement Phase 2 Place Wishlist only, using the local repository and demo data. Follow docs/01-04 and docs/08.

第三轮建议：
> Implement Phase 3 Daily Itinerary only, including day tabs, assignment, timeline and drag/reorder. Do not add real routing yet.
