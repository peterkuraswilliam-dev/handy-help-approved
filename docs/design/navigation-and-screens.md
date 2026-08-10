# Navigation and screen inventory

Purpose: map repository-confirmed routes separately from future screens.

## Existing routes

- Public: `/`, `/auth`, `/reset-password`, `/become-approved`, `/invite/$token`, `/contractors`, `/contractors/$contractorSlug`, `/community-rules` and `/privacy`.
- Authenticated: `/dashboard`, `/application`, `/notifications` and `/settings`.
- Admin: `/admin`, `/admin/applications/$applicationId`, `/admin/invitations` and `/admin/roles`.

TanStack Start derives these paths from files under `src/routes`; `_authenticated` is a pathless authenticated layout. `/auth` is sign-in-only, `/become-approved` explains invitation-only access, and the invitation routes implement manual admin link creation and email-bound acceptance.

## Future marketplace

Customer job wizard/status/quotes/booking/job timeline/review; contractor opportunities/quote/job timeline; public profiles; admin jobs/matches/messages/reviews/cases/reports/settings.

Reinspect route definitions before changing paths because the generated route tree follows the filesystem. Navigation must hide irrelevant actions for usability, while RLS/server authorisation remains the security control.
