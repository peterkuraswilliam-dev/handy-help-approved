# Technical architecture

Purpose: distinguish repository-confirmed technology from unverified or proposed architecture.

## Confirmed from repository audit

- React 19 and TypeScript
- TanStack Start with file-based TanStack Router routes
- Vite 8 and Tailwind CSS 4
- Supabase browser/server clients, generated types and SQL migrations
- Lovable's Vite/TanStack configuration package, with Nitro configured by that package for builds

## Not found or externally unverified

A 6 August visual included Next.js and PWA labels, but the repository uses TanStack Start and contains no Next.js or PWA implementation. There is no automated test script or application test suite in the repository. Live Supabase state, Vercel linkage, deployment history and production configuration were not inspected.

## Proposed logical boundaries

```text
Web client
  -> authenticated Supabase queries protected by RLS
  -> server/edge functions for privileged transitions, moderation and notifications
  -> private/public-safe storage paths
  -> immutable audit/event records
```

Service-role operations must remain server-only and narrowly scoped. Reconcile any new server action, API route or edge function with the existing TanStack Start and Supabase patterns. See [authentication](authentication-and-integrations.md) and [database overview](../database/overview.md).
