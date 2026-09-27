# 10 — Deployment

## A. GitHub Pages — Demo Mode

Use for UI / local MVP only.

### Requirements
- `NEXT_PUBLIC_APP_MODE=demo`
- no server Route Handlers required by visible features
- no secret keys
- static export
- localStorage persistence

Demo data is device/browser-local. Deploying the static site does not synchronize trips between an iPhone and an iPad. Cross-device synchronization requires the later Production Mode repository/auth work.

### Next.js config concept
```ts
const isPages = process.env.GITHUB_ACTIONS === "true"

export default {
  output: "export",
  basePath: isPages ? "/REPOSITORY_NAME" : "",
  assetPrefix: isPages ? "/REPOSITORY_NAME/" : "",
  images: { unoptimized: true }
}
```

Adapt repository name before use.

### GitHub Action
See:
`starter/.github/workflows/deploy-pages.yml`

### Important
GitHub Pages cannot securely hold:
- OpenAI secret
- Supabase service role secret
- unrestricted server API secret

Therefore Demo Mode uses mock adapters / browser-safe public configuration only.

## B. Vercel — Production

Recommended when adding:
- OpenAI
- secure Google Routes proxy
- SSR auth
- Server Actions
- API Route Handlers

Vercel has first-class Next.js deployment support.

### Environment variables

Browser-safe:
- `NEXT_PUBLIC_APP_MODE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- browser-restricted Maps key if used

Server only:
- `OPENAI_API_KEY`
- `GOOGLE_ROUTES_API_KEY`
- optional Supabase privileged key only when truly required

## C. Custom domain

Suggested:
- `trip.example.com`
- or a temporary Vercel domain

## D. Deployment gates

Before Production:
- RLS reviewed
- API key restrictions enabled
- no secrets in JS bundle
- error monitoring
- rate limit AI endpoints
- budgets/quotas configured
