# Refactor Scope – 08-04-2026

## Goal

Raise the architecture and code quality of Inner Stance Buddy by one grade level, from B to A- or A.

## In scope

- Architecture & modularization
- Code quality & readability
- Error handling
- Testing
- Technical debt
- Performance in flagged flows

## Out of scope

- GitHub Actions
- Changing the deployment workflow
- Broad UI redesign
- Full feature rewrites

## Known review targets

- Split remaining oversized service logic into domain-based services
- Add orchestrators for multi-domain flows
- Reduce complexity in DashboardPage and PowerPage
- Standardize error handling in critical flows
- Add tests for services, orchestrators, and key hooks
- Fix flagged sequential query patterns
- Clean up leftover repo artifacts

## Validation method

After each refactor step, do a micro-review only on the touched files.

For each step, check:

- Did architecture improve?
- Did readability improve?
- Did testability improve?
- Did error handling improve?
- Did complexity go down?

## Done definition for this refactor

This pass is successful if:

- Core logic is split into clear domain services
- Multi-domain flows are visible in orchestrators
- Large pages are simplified through hooks
- Critical logic has targeted tests
- Flagged risky/error-prone patterns are removed
- The app is ready for a final review aiming at A- or A
