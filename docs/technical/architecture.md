# Technical architecture

Purpose: distinguish confirmed technology from unverified or proposed architecture.

## Confirmed from project discussions

- React
- TypeScript
- Tailwind CSS
- Supabase for backend/database/auth/storage direction

## Unverified

A 6 August visual included Next.js and PWA labels. No codebase/package manifest was accessible, so framework version, routing, deployment, test stack and PWA implementation are unknown.

## Proposed logical boundaries

```text
Web client
  -> authenticated Supabase queries protected by RLS
  -> server/edge functions for privileged transitions, moderation and notifications
  -> private/public-safe storage paths
  -> immutable audit/event records
```

Service-role operations must remain server-only and narrowly scoped. Inspect code before choosing server actions, API routes or edge functions. See [authentication](authentication-and-integrations.md) and [database overview](../database/overview.md).
