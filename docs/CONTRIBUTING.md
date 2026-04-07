# Contributing Guide

## How this project works

Development is done collaboratively with **Oz** (Warp's AI agent) inside **bolt.new**. The user describes changes in Warp, Oz implements them, and the result is pushed to GitHub and deployed via bolt.new to Netlify.

There is no CI/CD pipeline or GitHub Actions — deployment is always manual via the bolt.new Git panel.

---

## Deployment workflow

See [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md) for the full step-by-step guide. The short version:

1. Oz commits and pushes to GitHub (`main` branch).
2. You open bolt.new → Git panel → **Pull**.
3. bolt.new rebuilds and redeploys to Netlify automatically.
4. If the change includes a Supabase migration, always pull the migration commit **first**, verify it applied, then pull the frontend commit.

---

## Architecture improvement plan

Active improvements are tracked in `Archtecture and code improvements plan.txt` at the root of the repo. Completed phases are logged in [`CHANGELOG.md`](CHANGELOG.md) under `[Unreleased] > Changed`.

Current phases:
- **Phase 1** ✅ User-facing error handling (toast system, error boundary)
- **Phase 2** ✅ Proper router (wouter) + App.tsx decomposition
- **Phase 3** ✅ Performance optimizations, security hardening, docs cleanup
- **Phase 4** (next) Service layer tests + `exerciseService.ts` split

---

## Coding standards

### Commit messages
Follow [Conventional Commits](https://www.conventionalcommits.org/). commitlint enforces this on every commit.

```
feat: add something new
fix: correct a bug
refactor: restructure without behaviour change
docs: update documentation only
chore: tooling, deps, config
```

Every commit made by Oz includes a co-author line:
```
Co-Authored-By: Oz <oz-agent@warp.dev>
```

### Formatting
Prettier is configured and runs automatically on pre-commit via Husky + lint-staged. You never need to run it manually.

### TypeScript
- No `any` types.
- All data shapes have explicit interfaces (see `src/lib/exerciseService.ts` for examples).
- Components use named exports; pages use default exports only where required.

### File headers
Every source file starts with a creation date and last-updated timestamp:
```typescript
// Created: YYYY-MM-DD
// Last Updated: YYYY-MM-DD (brief description of change)
```

### Error handling
All Supabase calls check for errors and return `null`/`false`/`[]` on failure. User-facing failures surface via `toast.error(...)` from `src/lib/toast.ts`. See Phase 1 implementation for the pattern.

---

## Environment variables

| Variable | Where set | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | bolt.new environment | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | bolt.new environment | Supabase anonymous key |
| `OPENAI_API_KEY` | Supabase Edge Function secrets | OpenAI vision API key |
| `OPENAI_MODEL` | Supabase Edge Function secrets | Model name (default: `gpt-4o`) |

> **Note:** bolt.new environment variables and Supabase Edge Function secrets are separate stores. Frontend env vars go in bolt.new; edge function secrets go in the Supabase dashboard under **Settings → Edge Functions → Secrets**.

---

## Key directories

```
src/
  components/       # UI components grouped by domain
    exercises/      # Week/question/bulk-import modals and cards
    layout/         # DashboardLayout, MainNavigation
    pages/          # DashboardPage, PowerPage, ProgressTrackingPage
    profile/        # Delete modal, deletion view
    ui/             # Shared: Button, Card, Badge, Avatar, Toast, ErrorBoundary
  hooks/            # useAuth, useLegalStatus
  lib/              # Service layer, Supabase client, toast, crypto, timezone
supabase/
  functions/        # Edge functions: delete-account, password-reset, extract-questions-from-image
  migrations/       # SQL migrations (applied automatically by bolt.new on pull)
docs/               # All project documentation
public/             # Static assets, PWA manifest, service worker, _headers
```
