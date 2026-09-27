# 06 — AI Specification

## Principle

AI is a language/intention layer, not the source of truth for transit, opening hours, coordinates, or reservations.

For dining, AI may summarize only supplied verified metadata and user notes. It must not invent menu items, prices, opening hours, queue time or reservation availability.

## AI use cases

### 1. Natural language preference parser
Input:
> 第二天轻松一点，下午去天神购物，晚饭前回博多。

Output JSON:
```json
{
  "day": "2026-10-20",
  "pace": "relaxed",
  "afternoonTheme": "shopping",
  "preferredRegion": "Tenjin",
  "returnRegion": "Hakata",
  "returnBy": "18:00"
}
```

### 2. Place brief
Input:
- verified place metadata
- user notes

Output:
- why visit
- suggested visit style
- photo ideas
- nearby pairing ideas
- caveat that live details should be verified

### 3. Daily brief
Input:
- final validated itinerary
- resolved route data

Output:
- concise readable summary
- key transfer notes
- schedule risks
- shopping opportunities

### 4. Planner explanation
Input:
- deterministic planner result
- dropped/deferred items

Output:
- natural explanation only

## Structured output

All machine-consumed AI results must be JSON and validated by Zod.

Never parse a prose answer for core scheduling logic.

## Recommended model strategy

Use a configurable environment variable:
`OPENAI_MODEL=...`

Do not hardcode a specific model throughout the codebase.

## Production request flow

```
Browser
  -> /api/ai/...
  -> server validates input
  -> OpenAI
  -> server validates output
  -> browser
```

## System prompt principles

- Do not invent transport details.
- Do not invent opening times.
- Treat supplied route and place metadata as authoritative inputs.
- Mark uncertainty.
- Return requested schema only for structured endpoints.
- Keep travel briefs concise on mobile.
