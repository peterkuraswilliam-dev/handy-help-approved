# Authentication and integrations

Purpose: record known auth concerns and future integration boundaries.

## Authentication

Supabase email/password authentication is implemented through browser/server clients and authenticated TanStack Start route guards. No Google sign-in implementation was found in the repository.

Contractor registration is invitation-only for the current launch. There must be no public contractor sign-up route or open contractor-account creation API. Only the app owner or an authorised admin may generate a secure invitation link. Valid invitation acceptance may create/link the contractor's own authenticated account and grant applicant access, but must not grant approval. See [contractor invitations](../features/contractor-invitations.md).

**Implementation drift:** `/auth` currently calls Supabase sign-up directly for contractor accounts, and `/become-approved` links to that public sign-up mode. No invitation route, table, generated type or application implementation was found. The confirmed rule therefore remains unmet and must be resolved before launch.

Roles must not be trusted from client-editable profile fields. Use server-controlled claims or a protected role-membership table with RLS and audited grants. Session/route checks improve UX but do not replace database policies.

Invitation tokens must be generated and validated server-side, stored only as non-reversible digests, protected from logs/analytics and consumed transactionally. Token lifetime, resend policy and the email-delivery provider remain open.

## Integrations

| Integration | Status |
| --- | --- |
| Supabase Auth/Database/Storage | Present in repository; live project state unverified |
| Email notification provider | Deferred/open |
| Vercel | Discussed; no repository Vercel configuration found and external project state unverified |
| Payment provider | Future/open |
| Landstack/property data | Future research |
| Maps/geocoding | Future/open |

Secrets belong in environment configuration, never Markdown or client bundles.
