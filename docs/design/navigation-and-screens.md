# Navigation and screen inventory

Purpose: map repository-confirmed routes separately from future screens.

## Existing routes

- Public: `/`, `/auth`, `/reset-password`, `/become-approved`, `/contractors`, `/contractors/$contractorSlug`, `/community-rules` and `/privacy`.
- Authenticated: `/dashboard`, `/application`, `/notifications` and `/settings`.
- Admin: `/admin`, `/admin/applications/$applicationId` and `/admin/roles`.

TanStack Start derives these paths from files under `src/routes`; `_authenticated` is a pathless authenticated layout. The current `/auth` screen exposes contractor sign-up and `/become-approved` links to it. No invitation-management or invitation-acceptance route was found, which conflicts with the confirmed invitation-only launch rule.

## Future marketplace

Customer job wizard/status/quotes/booking/job timeline/review; contractor opportunities/quote/job timeline; public profiles; admin jobs/matches/messages/reviews/cases/reports/settings.

Reinspect route definitions before changing paths because the generated route tree follows the filesystem. Navigation must hide irrelevant actions for usability, while RLS/server authorisation remains the security control.
