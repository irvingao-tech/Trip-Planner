# 13 — Current Technical Notes (verified September 2026)

- Supabase's current Next.js quickstart uses the App Router and provides a `with-supabase` template with cookie-based auth, TypeScript and Tailwind.
- Supabase recommends Row Level Security for Data API access and supports cookie-based SSR auth with Next.js.
- Google Routes API provides `computeRoutes` and `computeRouteMatrix`.
- Google transit routing can return transit steps, stop information, times, line details and polylines.
- Transit route requests do not support intermediate waypoints. Multi-stop itinerary planning must therefore be implemented above the point-to-point routing layer.
- Vercel provides zero-config / first-class Next.js deployment support.
- OpenAI current models are available through the Responses API; keep the model configurable rather than embedding model IDs into domain logic.

Official references:
- https://supabase.com/docs/guides/auth/quickstarts/nextjs
- https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- https://developers.google.com/maps/documentation/routes/transit-route
- https://developers.google.com/maps/documentation/routes/reference/rest
- https://vercel.com/frameworks/nextjs
- https://platform.openai.com/docs/models
