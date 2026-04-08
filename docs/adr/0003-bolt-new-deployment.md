# ADR-0003: bolt.new deployment instead of GitHub Actions

**Date:** 2025-12-21
**Status:** Accepted

## Context

The project needs a deployment pipeline that can:

1. Deploy the Vite frontend to a CDN (Netlify).
2. Apply Supabase database migrations automatically.
3. Deploy updated Supabase Edge Functions.

The project is maintained by a single developer and is developed partly inside the bolt.new AI IDE,
which has native integration with Netlify and Supabase.

## Decision

Use **bolt.new → Netlify** for frontend deployment and the bolt.new Git panel to trigger Supabase
migration + Edge Function deployments, rather than configuring a GitHub Actions CI/CD pipeline.

## Consequences

**Positive**

- bolt.new's Git panel pulls from GitHub and applies all three deployment steps (Netlify, migrations,
  Edge Functions) in a single manual action — no YAML pipeline to maintain.
- Supabase migration ordering (migrations must be applied before the frontend code that depends on
  them) is easy to enforce by doing two separate pulls, as documented in `DEPLOYMENT_CHECKLIST.md`.
- Zero CI configuration overhead for a solo-developer project — a GitHub Actions pipeline would add
  complexity with no added safety benefit when there is only one contributor.

**Negative / trade-offs**

- Deployment is manual: the developer must open bolt.new and click Pull after each push. There is no
  automated deployment on merge.
- bolt.new secrets (Netlify environment variables) and Supabase Edge Function secrets are stored in
  separate locations and must be set independently — a source of occasional confusion documented in
  the Deployment Checklist lessons-learned section.
- bolt.new does not auto-pull from GitHub; it must be triggered manually, which means a pushed
  commit is not live until the developer remembers to pull.

**When this decision should be revisited**
If the project gains multiple contributors, a GitHub Actions pipeline (running tests, then deploying
on merge to `main`) would become the correct approach because the manual pull step does not scale
to a team workflow.
