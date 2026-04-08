# Inner Stance Buddy

A personal coaching exercise journal — a Progressive Web App (PWA) for tracking weekly exercise questions, writing answers, and monitoring daily progress.

## Stack

| Layer      | Technology                                                 |
| ---------- | ---------------------------------------------------------- |
| Frontend   | React 18 + TypeScript + Vite + Tailwind CSS                |
| Backend    | Supabase (Postgres + Auth + Edge Functions + RLS)          |
| Deployment | bolt.new → Netlify (frontend) + Supabase (backend)         |
| Router     | wouter                                                     |
| PWA        | Service worker with network-first HTML, cache-first assets |

## Deployment

This project is deployed via **bolt.new**, not GitHub Actions.

1. Oz commits and pushes changes to GitHub
2. Open [bolt.new](https://bolt.new) → Git panel → **Pull**
3. bolt.new redeploys the Netlify frontend and applies any new Supabase migrations automatically

See [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md) for the full workflow including migrations and Edge Functions.

## Documentation

| Document                                                           | Description                                         |
| ------------------------------------------------------------------ | --------------------------------------------------- |
| [`docs/FRONTEND.md`](docs/FRONTEND.md)                             | Frontend architecture, component structure, routing |
| [`docs/BACKEND.md`](docs/BACKEND.md)                               | Database schema, RLS policies, Edge Functions       |
| [`docs/DEPLOYMENT_CHECKLIST.md`](docs/DEPLOYMENT_CHECKLIST.md)     | Step-by-step deploy guide for all change types      |
| [`docs/SECURITY_CONFIGURATION.md`](docs/SECURITY_CONFIGURATION.md) | Encryption, hashed answers, security headers        |
| [`docs/CHANGELOG.md`](docs/CHANGELOG.md)                           | Full history of all changes                         |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md)                         | End-user guide including privacy and encryption     |
| [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md)                     | How to contribute and work with Oz                  |

## Local Development

This project is developed inside bolt.new. Local development is possible but optional:

```bash
npm install
npm run dev
```

Required environment variables (copy `.env.example` to `.env`):

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Code Quality

```bash
npm run lint        # ESLint
npm run typecheck   # TypeScript
npm test            # Vitest unit tests
npm run test:e2e    # Playwright end-to-end tests
```

Pre-commit hooks (Husky + lint-staged) enforce Prettier formatting automatically.
Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/).
