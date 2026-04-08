# ADR-0001: wouter over React Router

**Date:** 2025-12-21
**Status:** Accepted

## Context

The app needed a client-side router that works well in a Vite + PWA environment. The two dominant
options were **React Router v6** and **wouter**. Because this is a small personal application with
a handful of routes and no server-side rendering, bundle size and API simplicity were the primary
selection criteria.

## Decision

Use **wouter** (`^3.3.5`) instead of React Router.

## Consequences

**Positive**

- Bundle footprint: wouter is ~1.3 KB gzipped vs. React Router v6 at ~13 KB — a 10× saving that
  matters for PWA load times on mobile.
- No `<BrowserRouter>` / `<RouterProvider>` wrapper required — wouter uses a default provider
  automatically, which simplified `main.tsx`.
- Simple hook API (`useLocation`, `useRoute`, `useParams`) maps cleanly to the existing component
  tree.
- Works seamlessly with the Vite dev server and the Netlify `_redirects` / `_headers` files already
  configured for SPA routing.

**Negative / trade-offs**

- wouter has a smaller community than React Router and fewer advanced features (e.g. no data
  loaders, no `<Await>`, no nested route layouts built-in).
- If the app ever needs server-side rendering or complex nested routing, migration to React Router
  would require touching every `<Route>` and `useLocation()` call.
- The `<Switch>` / `<Route>` / `<Redirect>` API used here is stable but is wouter's own convention
  rather than the web-standard `<RouterProvider>` model.

**Why React Router was not chosen**
React Router v6's `<RouterProvider>` + `createBrowserRouter` API introduces boilerplate
(loader functions, error elements) that adds unnecessary complexity for a five-route SPA.
Its larger bundle size also conflicts with the PWA performance budget.
